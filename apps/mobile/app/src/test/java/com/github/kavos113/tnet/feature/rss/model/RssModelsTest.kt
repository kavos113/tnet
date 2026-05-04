package com.github.kavos113.tnet.feature.rss.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class RssModelsTest {
  @Test
  fun createRssFeedUsesUrlAsFallbackTitle() {
    val feed = createRssFeed("feed-1", "", "https://example.com/feed.xml")

    assertEquals(
      RssFeed(
        id = "feed-1",
        title = "https://example.com/feed.xml",
        url = "https://example.com/feed.xml"
      ),
      feed
    )
  }

  @Test
  fun createRssFeedRejectsUnsupportedUrl() {
    assertNull(createRssFeed("feed-1", "Example", "ftp://example.com/feed.xml"))
  }

  @Test
  fun removeRssFeedDropsMatchingFeed() {
    val feeds = listOf(
      RssFeed(id = "feed-1", title = "A", url = "https://a.example/feed.xml"),
      RssFeed(id = "feed-2", title = "B", url = "https://b.example/feed.xml")
    )

    assertEquals(listOf(feeds[1]), removeRssFeed(feeds, "feed-1"))
  }

  @Test
  fun markFeedRefreshedUpdatesMatchingFeed() {
    val feeds = listOf(RssFeed(id = "feed-1", title = "A", url = "https://a.example/feed.xml"))

    assertEquals(
      listOf(feeds[0].copy(lastRefreshLabel = "Refresh requested")),
      markFeedRefreshed(feeds, "feed-1", "Refresh requested")
    )
  }

  @Test
  fun updateRssFeedUpdatesMatchingFeedAndKeepsRefreshLabel() {
    val feeds = listOf(
      RssFeed(
        id = "feed-1",
        title = "A",
        url = "https://a.example/feed.xml",
        lastRefreshLabel = "Fetched 2 items"
      )
    )

    assertEquals(
      listOf(
        RssFeed(
          id = "feed-1",
          title = "B",
          url = "https://b.example/feed.xml",
          lastRefreshLabel = "Fetched 2 items"
        )
      ),
      updateRssFeed(feeds, "feed-1", "B", "https://b.example/feed.xml")
    )
  }

  @Test
  fun updateRssFeedRejectsUnsupportedUrl() {
    val feeds = listOf(RssFeed(id = "feed-1", title = "A", url = "https://a.example/feed.xml"))

    assertNull(updateRssFeed(feeds, "feed-1", "B", "ftp://b.example/feed.xml"))
  }

  @Test
  fun moveRssFeedToFolderUpdatesOnlyMatchingFeed() {
    val feeds = listOf(
      RssFeed(id = "feed-1", title = "A", url = "https://a.example/feed.xml"),
      RssFeed(id = "feed-2", title = "B", url = "https://b.example/feed.xml")
    )

    val moved = moveRssFeedToFolder(feeds, feedId = "feed-1", folderId = "folder-1")

    assertEquals("folder-1", moved[0].folderId)
    assertNull(moved[1].folderId)
  }
}
