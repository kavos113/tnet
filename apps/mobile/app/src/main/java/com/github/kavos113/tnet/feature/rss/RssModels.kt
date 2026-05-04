package com.github.kavos113.tnet.feature.rss

import java.net.URI

data class RssFeed(
  val id: String,
  val title: String,
  val url: String,
  val lastRefreshLabel: String? = null
)

fun createRssFeed(
  id: String,
  title: String,
  url: String
): RssFeed? {
  val normalizedUrl = url.trim()
  val normalizedTitle = title.trim().ifBlank { normalizedUrl }
  if (!isSupportedFeedUrl(normalizedUrl)) return null

  return RssFeed(
    id = id,
    title = normalizedTitle,
    url = normalizedUrl
  )
}

fun removeRssFeed(feeds: List<RssFeed>, feedId: String): List<RssFeed> {
  return feeds.filterNot { it.id == feedId }
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

private fun isSupportedFeedUrl(value: String): Boolean {
  return runCatching {
    val uri = URI(value)
    uri.scheme == "http" || uri.scheme == "https"
  }.getOrDefault(false)
}
