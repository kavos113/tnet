package com.github.kavos113.tnet.feature.rss.model

import org.junit.Assert.assertEquals
import org.junit.Test

class RssRoomTest {
  @Test
  fun rssFeedRoundTripsThroughEntity() {
    val feed = RssFeed(
      id = "feed-1",
      title = "TNET updates",
      url = "https://example.com/feed.xml",
      folderId = "folder-1",
      lastRefreshLabel = "2026-05-04 10:00"
    )

    assertEquals(feed, feed.toEntity(folderId = "folder-1").toRssFeed())
  }

  @Test
  fun rssFeedEntityKeepsFolderSeparateFromDomainModel() {
    val feed = RssFeed(
      id = "feed-2",
      title = "Papers",
      url = "https://example.com/papers.atom"
    )

    val entity = feed.toEntity(folderId = "research")

    assertEquals("research", entity.folderId)
    assertEquals(feed.copy(folderId = "research"), entity.toRssFeed())
  }

  @Test
  fun rssFolderRoundTripsThroughEntity() {
    val folder = RssFolder(id = "folder-1", title = "Research")

    assertEquals(folder, folder.toEntity().toRssFolder())
  }

  @Test
  fun rssItemRoundTripsThroughEntity() {
    val item = RssItem(
      id = "item-1",
      feedId = "feed-1",
      title = "Article",
      link = "https://example.com/article",
      publishedAt = "2026-05-04",
      isRead = true
    )

    assertEquals(item, item.toEntity().toRssItem())
  }
}
