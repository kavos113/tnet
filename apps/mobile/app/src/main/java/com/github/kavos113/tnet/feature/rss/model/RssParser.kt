package com.github.kavos113.tnet.feature.rss.model

import org.w3c.dom.Element
import java.io.ByteArrayInputStream
import javax.xml.parsers.DocumentBuilderFactory

fun parseRssItems(xml: String): List<RssItem> {
  val document = DocumentBuilderFactory
    .newInstance()
    .apply {
      isNamespaceAware = true
      setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
    }
    .newDocumentBuilder()
    .parse(ByteArrayInputStream(xml.toByteArray(Charsets.UTF_8)))

  val rssItems = document.getElementsByTagName("item")
  if (rssItems.length > 0) {
    return (0 until rssItems.length).mapNotNull { index ->
      val element = rssItems.item(index) as? Element ?: return@mapNotNull null
      val title = element.childText("title") ?: return@mapNotNull null
      RssItem(
        title = title,
        link = element.childText("link"),
        publishedAt = element.childText("pubDate")
      )
    }
  }

  val atomEntries = document.getElementsByTagName("entry")
  return (0 until atomEntries.length).mapNotNull { index ->
    val element = atomEntries.item(index) as? Element ?: return@mapNotNull null
    val title = element.childText("title") ?: return@mapNotNull null
    RssItem(
      title = title,
      link = element.atomLink(),
      publishedAt = element.childText("published") ?: element.childText("updated")
    )
  }
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
