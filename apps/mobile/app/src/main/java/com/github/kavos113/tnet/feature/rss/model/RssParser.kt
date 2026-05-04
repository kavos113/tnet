package com.github.kavos113.tnet.feature.rss.model

import org.w3c.dom.Element
import org.xml.sax.ErrorHandler
import org.xml.sax.SAXParseException
import java.io.ByteArrayInputStream
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

fun parseRssItems(xml: String): List<RssItem> {
  val source = xml.trim()
  if (source.startsWith("{")) return parseJsonFeedItems(source)

  return runCatching {
    parseXmlFeedItems(source)
  }.getOrElse {
    parseTolerantFeedItems(source)
  }
}

private fun parseXmlFeedItems(xml: String): List<RssItem> {
  val document = DocumentBuilderFactory
    .newInstance()
    .apply {
      isNamespaceAware = true
      enableFeatureIfSupported(XMLConstants.FEATURE_SECURE_PROCESSING, true)
      enableFeatureIfSupported("http://apache.org/xml/features/disallow-doctype-decl", true)
      enableFeatureIfSupported("http://xml.org/sax/features/external-general-entities", false)
      enableFeatureIfSupported("http://xml.org/sax/features/external-parameter-entities", false)
      isExpandEntityReferences = false
    }
    .newDocumentBuilder()
    .apply {
      setErrorHandler(SilentThrowingXmlErrorHandler)
    }
    .parse(ByteArrayInputStream(xml.toByteArray(Charsets.UTF_8)))

  val rootName = document.documentElement?.localName?.lowercase()
  val rootTagName = document.documentElement?.tagName?.lowercase()
  if (rootName == "feed") return parseAtomEntries(document.documentElement)
  if (rootName != "rss" && rootName != "rdf" && rootTagName != "rdf:rdf") return emptyList()

  val rssItems = document.getElementsByTagName("item")
  return (0 until rssItems.length).mapNotNull { index ->
    val element = rssItems.item(index) as? Element ?: return@mapNotNull null
    val title = element.childText("title") ?: return@mapNotNull null
    RssItem(
      title = title,
      link = element.childText("link"),
      publishedAt = element.childText("pubDate") ?: element.childText("dc:date"),
      contentHtml = element.childText("content:encoded")?.sanitizeFeedHtml()
        ?: element.childText("description")?.sanitizeFeedHtml()
    )
  }
}

private object SilentThrowingXmlErrorHandler : ErrorHandler {
  override fun warning(exception: SAXParseException) = Unit

  override fun error(exception: SAXParseException) {
    throw exception
  }

  override fun fatalError(exception: SAXParseException) {
    throw exception
  }
}

private fun parseAtomEntries(root: Element): List<RssItem> {
  val atomEntries = root.getElementsByTagName("entry")
  return (0 until atomEntries.length).mapNotNull { index ->
    val element = atomEntries.item(index) as? Element ?: return@mapNotNull null
    val title = element.childText("title") ?: return@mapNotNull null
    RssItem(
      title = title,
      link = element.atomLink(),
      publishedAt = element.childText("published") ?: element.childText("updated"),
      contentHtml = element.childText("content")?.sanitizeFeedHtml()
        ?: element.childText("summary")?.sanitizeFeedHtml()
    )
  }
}

private fun parseJsonFeedItems(json: String): List<RssItem> {
  val itemsBody = Regex(""""items"\s*:\s*\[(.*)]""", RegexOption.DOT_MATCHES_ALL)
    .find(json)
    ?.groupValues
    ?.get(1)
    ?: return emptyList()

  return Regex("""\{(.*?)}""", RegexOption.DOT_MATCHES_ALL)
    .findAll(itemsBody)
    .mapNotNull { match ->
      val body = match.groupValues[1]
      val title = body.jsonStringValue("title") ?: body.jsonStringValue("summary") ?: return@mapNotNull null
      RssItem(
        title = title,
        link = body.jsonStringValue("url") ?: body.jsonStringValue("external_url"),
        publishedAt = body.jsonStringValue("date_published") ?: body.jsonStringValue("date_modified"),
        contentHtml = (
          body.jsonStringValue("content_html")
            ?: body.jsonStringValue("content_text")
            ?: body.jsonStringValue("summary")
          )?.sanitizeFeedHtml()
      )
    }
    .toList()
}

private fun parseTolerantFeedItems(xml: String): List<RssItem> {
  val rssItems = Regex("""(?is)<item\b[^>]*>(.*?)</item>""")
    .findAll(xml)
    .mapNotNull { match ->
      val body = match.groupValues[1]
      val title = body.tagText("title") ?: return@mapNotNull null
      RssItem(
        title = title,
        link = body.tagText("link"),
        publishedAt = body.tagText("pubDate") ?: body.tagText("dc:date"),
        contentHtml = body.tagHtml("content:encoded")?.sanitizeFeedHtml()
          ?: body.tagHtml("description")?.sanitizeFeedHtml()
      )
    }
    .toList()
  if (rssItems.isNotEmpty()) return rssItems

  return Regex("""(?is)<entry\b[^>]*>(.*?)</entry>""")
    .findAll(xml)
    .mapNotNull { match ->
      val body = match.groupValues[1]
      val title = body.tagText("title") ?: return@mapNotNull null
      RssItem(
        title = title,
        link = body.atomLinkText(),
        publishedAt = body.tagText("published") ?: body.tagText("updated"),
        contentHtml = body.tagHtml("content")?.sanitizeFeedHtml()
          ?: body.tagHtml("summary")?.sanitizeFeedHtml()
      )
    }
    .toList()
}

private fun DocumentBuilderFactory.enableFeatureIfSupported(
  feature: String,
  enabled: Boolean
) {
  runCatching {
    setFeature(feature, enabled)
  }
}

private fun String.tagText(tagName: String): String? {
  return tagHtml(tagName)?.cleanFeedText()
}

private fun String.tagHtml(tagName: String): String? {
  return Regex("""(?is)<$tagName\b[^>]*>(.*?)</$tagName>""")
    .find(this)
    ?.groupValues
    ?.get(1)
    ?.removeCdata()
    ?.trim()
    ?.takeIf { it.isNotEmpty() }
}

private fun String.atomLinkText(): String? {
  val links = Regex("""(?is)<link\b([^>]*)>""").findAll(this)
  val alternate = links.firstOrNull { match ->
    val attrs = match.groupValues[1]
    val rel = attrs.attr("rel")
    rel == null || rel == "alternate"
  } ?: return null
  return alternate.groupValues[1].attr("href")
}

private fun String.attr(name: String): String? {
  return Regex("""(?i)\b$name\s*=\s*["']([^"']+)["']""")
    .find(this)
    ?.groupValues
    ?.get(1)
    ?.decodeXmlEntities()
}

private fun String.jsonStringValue(name: String): String? {
  return Regex(""""$name"\s*:\s*"((?:\\.|[^"\\])*)"""")
    .find(this)
    ?.groupValues
    ?.get(1)
    ?.replace("\\\"", "\"")
    ?.replace("\\/", "/")
    ?.replace("\\n", "\n")
    ?.replace("\\t", "\t")
    ?.takeIf { it.isNotBlank() }
}

private fun String.cleanFeedText(): String? {
  return removeCdata()
    .replace(Regex("""(?is)<script\b.*?</script>"""), "")
    .replace(Regex("""(?is)<style\b.*?</style>"""), "")
    .replace(Regex("""(?is)<[^>]+>"""), "")
    .decodeXmlEntities()
    .trim()
    .takeIf { it.isNotEmpty() }
}

private fun String.sanitizeFeedHtml(): String? {
  val sanitized = removeCdata()
    .replace(Regex("""(?is)<script\b.*?</script>"""), "")
    .replace(Regex("""(?is)<style\b.*?</style>"""), "")
    .replace(Regex("(?i)\\son[a-z]+\\s*=\\s*\"[^\"]*\""), "")
    .replace(Regex("""(?i)\son[a-z]+\s*=\s*'[^']*'"""), "")
    .decodeXmlEntities()
    .trim()
  return sanitized.takeIf { it.isNotEmpty() }
}

private fun String.removeCdata(): String {
  return replace("<![CDATA[", "")
    .replace("]]>", "")
}

private fun String.decodeXmlEntities(): String {
  return replace("&amp;", "&")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&quot;", "\"")
    .replace("&apos;", "'")
}

private fun Element.childText(tagName: String): String? {
  val nodes = getElementsByTagName(tagName)
  if (nodes.length == 0) return null
  return nodes.item(0).textContent?.trim()?.takeIf { it.isNotEmpty() }
}

private fun Element.atomLink(): String? {
  val links = getElementsByTagName("link")
  for (index in 0 until links.length) {
    val element = links.item(index) as? Element ?: continue
    val rel = element.getAttribute("rel")
    if (rel.isBlank() || rel == "alternate") {
      return element.getAttribute("href").takeIf { it.isNotBlank() }
    }
  }
  return null
}
