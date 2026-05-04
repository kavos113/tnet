package com.github.kavos113.tnet.feature.rss.model

import java.net.URI

data class RssFeed(
  val id: String,
  val title: String,
  val url: String,
  val folderId: String? = null,
  val lastRefreshLabel: String? = null
)

data class RssFolder(
  val id: String,
  val title: String
)

data class RssFeedUrlList(
  val urls: List<String>,
  val invalidLines: List<String>,
  val duplicateLines: Int
)

fun createRssFeed(
  id: String,
  title: String,
  url: String
): RssFeed? {
  val normalizedUrl = normalizeRssFeedUrl(url) ?: return null
  val normalizedTitle = title.trim().ifBlank { normalizedUrl }

  return RssFeed(
    id = id,
    title = normalizedTitle,
    url = normalizedUrl
  )
}

fun removeRssFeed(feeds: List<RssFeed>, feedId: String): List<RssFeed> {
  return feeds.filterNot { it.id == feedId }
}

fun updateRssFeed(
  feeds: List<RssFeed>,
  feedId: String,
  title: String,
  url: String
): List<RssFeed>? {
  val currentFeed = feeds.firstOrNull { it.id == feedId } ?: return feeds
  val updatedFeed = createRssFeed(feedId, title, url)?.copy(
    lastRefreshLabel = currentFeed.lastRefreshLabel
  ) ?: return null

  return feeds.map { feed ->
    if (feed.id == feedId) updatedFeed else feed
  }
}

fun markFeedRefreshed(
  feeds: List<RssFeed>,
  feedId: String,
  label: String
): List<RssFeed> {
  return feeds.map { feed ->
    if (feed.id == feedId) feed.copy(lastRefreshLabel = label) else feed
  }
}

fun moveRssFeedToFolder(
  feeds: List<RssFeed>,
  feedId: String,
  folderId: String?
): List<RssFeed> {
  return feeds.map { feed ->
    if (feed.id == feedId) feed.copy(folderId = folderId) else feed
  }
}

fun parseRssFeedUrlList(value: String): RssFeedUrlList {
  val urls = mutableListOf<String>()
  val invalidLines = mutableListOf<String>()
  val seenUrls = mutableSetOf<String>()
  var duplicateLines = 0

  value
    .lineSequence()
    .map { it.trim() }
    .filter { it.isNotEmpty() }
    .forEach { line ->
      val normalizedUrl = normalizeRssFeedUrl(line)
      when {
        normalizedUrl == null -> invalidLines.add(line)
        !seenUrls.add(normalizedUrl) -> duplicateLines += 1
        else -> urls.add(normalizedUrl)
      }
    }

  return RssFeedUrlList(
    urls = urls,
    invalidLines = invalidLines,
    duplicateLines = duplicateLines
  )
}

fun normalizeRssFeedUrl(value: String): String? {
  val trimmed = value.trim()
  if (trimmed.isEmpty()) return null

  return runCatching {
    val uri = URI(trimmed)
    val scheme = uri.scheme?.lowercase()
    if (scheme != "http" && scheme != "https") return null
    val host = uri.host?.lowercase()
    if (host.isNullOrBlank()) return null
    URI(scheme, uri.userInfo, host, uri.port, uri.path, uri.query, null).toString()
  }.getOrNull()
}
