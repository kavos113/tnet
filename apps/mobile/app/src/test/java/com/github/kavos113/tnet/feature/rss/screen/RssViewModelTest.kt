package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.ParsedRssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import java.util.concurrent.atomic.AtomicInteger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RssViewModelTest {
  @Test
  fun saveFeedCreatesFeedAndClearsDraft() {
    val viewModel = newRssViewModel()

    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }

    val state = viewModel.uiState.value
    assertEquals(1, state.feeds.size)
    assertEquals("Feed for https://example.com/feed.xml", state.feeds[0].title)
    assertEquals("", state.urlDraft)
    assertNull(state.error)
  }

  @Test
  fun editFeedUpdatesExistingFeed() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.isNotEmpty() }

    viewModel.editFeed(viewModel.uiState.value.feeds[0])
    viewModel.updateUrlDraft("https://example.com/updated.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.firstOrNull()?.title == "Feed for https://example.com/updated.xml" }

    val feed = viewModel.uiState.value.feeds[0]
    assertEquals("Feed for https://example.com/updated.xml", feed.title)
    assertEquals("https://example.com/updated.xml", feed.url)
    assertNull(viewModel.uiState.value.editingFeedId)
  }

  @Test
  fun saveFeedSkipsDuplicateFeedUrl() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }

    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    val state = viewModel.uiState.value
    assertEquals(1, state.feeds.size)
    assertEquals("Feed URL is already subscribed.", state.error)
  }

  @Test
  fun importFeedsFromTextAddsValidUrlsAndSkipsDuplicates() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }

    viewModel.updateBulkImportDraft(
      """
      https://example.com/feed.xml
      https://second.example/rss
      https://second.example/rss
      invalid
      """.trimIndent()
    )
    viewModel.importFeedsFromText()
    waitUntil { viewModel.uiState.value.feeds.size == 2 }

    val state = viewModel.uiState.value
    assertEquals(2, state.feeds.size)
    assertEquals("https://second.example/rss", state.feeds[0].url)
    assertEquals("", state.bulkImportDraft)
    assertEquals(
      "Imported 1 feeds. Skipped 2 duplicate feeds or unreadable feeds. Ignored 1 invalid lines.",
      state.importMessage
    )
  }

  @Test
  fun importFeedsFromTextUsesSelectedFolder() {
    val viewModel = newRssViewModel()
    viewModel.updateFolderTitleDraft("Research")
    viewModel.saveFolder()
    waitUntil { viewModel.uiState.value.folders.size == 1 }
    val folderId = viewModel.uiState.value.folders.single().id
    viewModel.selectSource(RssSource.Folder(folderId))

    viewModel.importFeedsFromText("https://example.com/feed.xml")
    waitUntil { viewModel.uiState.value.feeds.size == 1 }

    assertEquals(folderId, viewModel.uiState.value.feeds.single().folderId)
  }

  @Test
  fun selectSourceFiltersVisibleItems() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://a.example/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    viewModel.updateUrlDraft("https://b.example/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 2 }
    val selectedFeed = viewModel.uiState.value.feeds.first()
    viewModel.replaceItemsForTest(
      listOf(
        RssItem(id = "item-1", feedId = selectedFeed.id, title = "Visible", link = null, publishedAt = null),
        RssItem(id = "item-2", feedId = "other-feed", title = "Hidden", link = null, publishedAt = null)
      )
    )

    viewModel.selectSource(RssSource.Feed(selectedFeed.id))

    assertEquals(listOf("Visible"), viewModel.uiState.value.visibleItems.map { it.title })
  }

  @Test
  fun unreadSourceShowsOnlyUnreadItems() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    val feed = viewModel.uiState.value.feeds.single()
    viewModel.replaceItemsForTest(
      listOf(
        RssItem(id = "item-1", feedId = feed.id, title = "Unread", link = null, publishedAt = null),
        RssItem(id = "item-2", feedId = feed.id, title = "Read", link = null, publishedAt = null, isRead = true)
      )
    )
    waitUntil { viewModel.uiState.value.items.size == 2 }

    viewModel.selectSource(RssSource.Unread)

    assertEquals(listOf("Unread"), viewModel.uiState.value.visibleItems.map { it.title })
  }

  @Test
  fun searchQueryFiltersVisibleItemsByTitleAndContent() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    val feed = viewModel.uiState.value.feeds.single()
    viewModel.replaceItemsForTest(
      listOf(
        RssItem(id = "item-1", feedId = feed.id, title = "Title hit", link = null, publishedAt = null),
        RssItem(id = "item-2", feedId = feed.id, title = "Body hit", link = null, publishedAt = null, contentHtml = "<p>needle</p>"),
        RssItem(id = "item-3", feedId = feed.id, title = "Other", link = null, publishedAt = null)
      )
    )
    waitUntil { viewModel.uiState.value.items.size == 3 }

    viewModel.updateSearchQuery("needle")

    assertEquals(listOf("Body hit"), viewModel.uiState.value.visibleItems.map { it.title })
  }

  @Test
  fun loadMoreItemsIncreasesVisibleItemLimit() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    val feed = viewModel.uiState.value.feeds.single()
    viewModel.replaceItemsForTest(
      (1..75).map { index ->
        RssItem(id = "item-$index", feedId = feed.id, title = "Item $index", link = null, publishedAt = null)
      }
    )
    waitUntil { viewModel.uiState.value.items.size == 75 }

    assertEquals(RSS_ITEM_PAGE_SIZE, viewModel.uiState.value.visibleItems.size)
    assertTrue(viewModel.uiState.value.canLoadMoreItems)

    viewModel.loadMoreItems()

    assertEquals(75, viewModel.uiState.value.visibleItems.size)
    assertEquals(false, viewModel.uiState.value.canLoadMoreItems)
  }

  @Test
  fun selectSourceResetsVisibleItemLimit() {
    val viewModel = newRssViewModel()
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    val feed = viewModel.uiState.value.feeds.single()
    viewModel.replaceItemsForTest(
      (1..75).map { index ->
        RssItem(id = "item-$index", feedId = feed.id, title = "Item $index", link = null, publishedAt = null)
      }
    )
    waitUntil { viewModel.uiState.value.items.size == 75 }
    viewModel.loadMoreItems()
    assertEquals(75, viewModel.uiState.value.visibleItems.size)

    viewModel.selectSource(RssSource.Feed(feed.id))

    assertEquals(RSS_ITEM_PAGE_SIZE, viewModel.uiState.value.visibleItems.size)
  }

  @Test
  fun refreshSelectedSourceFetchesFeedsInParallel() {
    val activeFetches = AtomicInteger(0)
    val maxActiveFetches = AtomicInteger(0)
    val completedFetches = AtomicInteger(0)
    val viewModel = RssViewModel(
      feedFetcher = {
        val active = activeFetches.incrementAndGet()
        maxActiveFetches.updateAndGet { current -> maxOf(current, active) }
        Thread.sleep(120)
        activeFetches.decrementAndGet()
        completedFetches.incrementAndGet()
        Result.success(listOf(RssItem(title = "Article", link = null, publishedAt = null)))
      },
      feedLoader = { url -> Result.success(ParsedRssFeed(title = "Feed for $url", items = emptyList())) }
    )
    viewModel.updateUrlDraft("https://a.example/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 1 }
    viewModel.updateUrlDraft("https://b.example/feed.xml")
    viewModel.saveFeed()
    waitUntil { viewModel.uiState.value.feeds.size == 2 }

    viewModel.refreshSelectedSource()
    waitUntil { completedFetches.get() == 2 && !viewModel.uiState.value.isRefreshing }

    assertTrue(maxActiveFetches.get() > 1)
  }

  @Test
  fun importFeedsFromTextReportsEmptyInput() {
    val viewModel = newRssViewModel()

    viewModel.importFeedsFromText("  \n ")

    assertEquals("Enter one feed URL per line.", viewModel.uiState.value.error)
  }

  @Test
  fun selectItemMarksItRead() {
    val viewModel = newRssViewModel()
    val item = RssItem(
      title = "Article",
      link = "https://example.com/article",
      publishedAt = "2026-05-04"
    )
    viewModel.replaceItemsForTest(listOf(item))
    waitUntil { viewModel.uiState.value.items.size == 1 }

    viewModel.selectItem(item)

    val state = viewModel.uiState.value
    assertTrue(state.isArticlePanelOpen)
    assertTrue(requireNotNull(state.selectedItem).isRead)
    assertTrue(state.items.single().isRead)
  }
}

private fun newRssViewModel(): RssViewModel {
  return RssViewModel(
    feedLoader = { url ->
      Result.success(
        ParsedRssFeed(
          title = "Feed for $url",
          items = emptyList()
        )
      )
    }
  )
}

private fun waitUntil(predicate: () -> Boolean) {
  val deadline = System.currentTimeMillis() + 2_000
  while (!predicate()) {
    if (System.currentTimeMillis() > deadline) {
      throw AssertionError("Condition was not met before timeout.")
    }
    Thread.sleep(10)
  }
}
