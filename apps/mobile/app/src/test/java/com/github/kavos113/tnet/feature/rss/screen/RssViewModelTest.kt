package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RssViewModelTest {
  @Test
  fun saveFeedCreatesFeedAndClearsDraft() {
    val viewModel = RssViewModel()

    viewModel.updateTitleDraft("Example")
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    val state = viewModel.uiState.value
    assertEquals(1, state.feeds.size)
    assertEquals("Example", state.feeds[0].title)
    assertEquals("", state.titleDraft)
    assertNull(state.error)
  }

  @Test
  fun editFeedUpdatesExistingFeed() {
    val viewModel = RssViewModel()
    viewModel.updateTitleDraft("Example")
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    viewModel.editFeed(viewModel.uiState.value.feeds[0])
    viewModel.updateTitleDraft("Updated")
    viewModel.updateUrlDraft("https://example.com/updated.xml")
    viewModel.saveFeed()

    val feed = viewModel.uiState.value.feeds[0]
    assertEquals("Updated", feed.title)
    assertEquals("https://example.com/updated.xml", feed.url)
    assertNull(viewModel.uiState.value.editingFeedId)
  }

  @Test
  fun saveFeedSkipsDuplicateFeedUrl() {
    val viewModel = RssViewModel()
    viewModel.updateTitleDraft("Example")
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    viewModel.updateTitleDraft("Duplicate")
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    val state = viewModel.uiState.value
    assertEquals(1, state.feeds.size)
    assertEquals("Feed URL is already subscribed.", state.error)
  }

  @Test
  fun importFeedsFromTextAddsValidUrlsAndSkipsDuplicates() {
    val viewModel = RssViewModel()
    viewModel.updateTitleDraft("Example")
    viewModel.updateUrlDraft("https://example.com/feed.xml")
    viewModel.saveFeed()

    viewModel.updateBulkImportDraft(
      """
      https://example.com/feed.xml
      https://second.example/rss
      https://second.example/rss
      invalid
      """.trimIndent()
    )
    viewModel.importFeedsFromText()

    val state = viewModel.uiState.value
    assertEquals(2, state.feeds.size)
    assertEquals("https://second.example/rss", state.feeds[0].url)
    assertEquals("", state.bulkImportDraft)
    assertEquals(
      "Imported 1 feeds. Skipped 2 duplicate feeds. Ignored 1 invalid lines.",
      state.importMessage
    )
  }

  @Test
  fun importFeedsFromTextUsesSelectedFolder() {
    val viewModel = RssViewModel()
    viewModel.updateFolderTitleDraft("Research")
    viewModel.saveFolder()
    val folderId = viewModel.uiState.value.folders.single().id
    viewModel.selectSource(RssSource.Folder(folderId))

    viewModel.importFeedsFromText("https://example.com/feed.xml")

    assertEquals(folderId, viewModel.uiState.value.feeds.single().folderId)
  }

  @Test
  fun selectSourceFiltersVisibleItems() {
    val viewModel = RssViewModel()
    viewModel.updateTitleDraft("A")
    viewModel.updateUrlDraft("https://a.example/feed.xml")
    viewModel.saveFeed()
    viewModel.updateTitleDraft("B")
    viewModel.updateUrlDraft("https://b.example/feed.xml")
    viewModel.saveFeed()
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
  fun importFeedsFromTextReportsEmptyInput() {
    val viewModel = RssViewModel()

    viewModel.importFeedsFromText("  \n ")

    assertEquals("Enter one feed URL per line.", viewModel.uiState.value.error)
  }

  @Test
  fun selectItemMarksItRead() {
    val viewModel = RssViewModel()
    val item = RssItem(
      title = "Article",
      link = "https://example.com/article",
      publishedAt = "2026-05-04"
    )
    viewModel.replaceItemsForTest(listOf(item))

    viewModel.selectItem(item)

    val state = viewModel.uiState.value
    assertTrue(state.isArticlePanelOpen)
    assertTrue(requireNotNull(state.selectedItem).isRead)
    assertTrue(state.items.single().isRead)
  }
}
