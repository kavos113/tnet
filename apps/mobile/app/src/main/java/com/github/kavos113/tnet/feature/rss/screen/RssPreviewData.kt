package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem

internal val previewRssFeed = RssFeed(
  id = "feed-preview",
  title = "Research updates",
  url = "https://example.com/research.xml",
  lastRefreshLabel = "Fetched 12 items"
)

internal val previewRssItems = listOf(
  RssItem(
    title = "A practical note on offline-first readers",
    link = "https://example.com/articles/offline-first",
    publishedAt = "2026-05-04"
  ),
  RssItem(
    title = "SQLite sharing constraints on Android",
    link = "https://example.com/articles/sqlite-android",
    publishedAt = "2026-05-03"
  )
)
