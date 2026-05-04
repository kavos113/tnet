package com.github.kavos113.tnet.feature.rss

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
}
