package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertNull
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
    assertTrue(requireNotNull(state.selectedItem).isRead)
    assertTrue(state.items.single().isRead)
  }
}
