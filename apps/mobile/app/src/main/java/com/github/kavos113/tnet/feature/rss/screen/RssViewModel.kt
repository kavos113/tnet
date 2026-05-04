package com.github.kavos113.tnet.feature.rss.screen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.feature.rss.model.createRssFeed
import com.github.kavos113.tnet.feature.rss.model.fetchRssItems
import com.github.kavos113.tnet.feature.rss.model.updateRssFeed
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RssViewModel : ViewModel() {
  private val mutableUiState = MutableStateFlow(RssUiState())
  val uiState: StateFlow<RssUiState> = mutableUiState.asStateFlow()

  fun updateTitleDraft(value: String) = mutableUiState.update { it.copy(titleDraft = value) }

  fun updateUrlDraft(value: String) = mutableUiState.update { it.copy(urlDraft = value) }

  fun saveFeed() {
    mutableUiState.update { state ->
      val editingFeedId = state.editingFeedId
      if (editingFeedId != null) {
        val updatedFeeds = updateRssFeed(
          feeds = state.feeds,
          feedId = editingFeedId,
          title = state.titleDraft,
          url = state.urlDraft
        ) ?: return@update state.copy(error = "Enter an http or https feed URL.")

        state.copy(feeds = updatedFeeds, editingFeedId = null).clearDraft()
      } else {
        val feed = createRssFeed(
          id = "feed-${state.nextFeedNumber}",
          title = state.titleDraft,
          url = state.urlDraft
        ) ?: return@update state.copy(error = "Enter an http or https feed URL.")

        state
          .copy(
            feeds = listOf(feed) + state.feeds,
            nextFeedNumber = state.nextFeedNumber + 1
          )
          .clearDraft()
      }
    }
  }

  fun cancelEditing() = mutableUiState.update { it.copy(editingFeedId = null).clearDraft() }

  fun editFeed(feed: RssFeed) {
    mutableUiState.update {
      it.copy(
        editingFeedId = feed.id,
        titleDraft = feed.title,
        urlDraft = feed.url,
        error = null
      )
    }
  }

  fun removeFeed(feed: RssFeed) {
    mutableUiState.update {
      val nextFeeds = it.feeds.filterNot { candidate -> candidate.id == feed.id }
      if (it.selectedFeedTitle == feed.title) {
        it.copy(
          feeds = nextFeeds,
          selectedFeedTitle = null,
          selectedItem = null,
          items = emptyList()
        )
      } else {
        it.copy(feeds = nextFeeds)
      }
    }
  }

  fun refreshFeed(feed: RssFeed) {
    mutableUiState.update {
      it.copy(
        feeds = it.feeds.markFeed(feed.id, "Refresh requested"),
        selectedFeedTitle = feed.title,
        selectedItem = null
      )
    }

    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        fetchRssItems(feed.url)
      }
      mutableUiState.update { state ->
        result.fold(
          onSuccess = { items ->
            state.copy(
              feeds = state.feeds.markFeed(feed.id, "Fetched ${items.size} items"),
              items = items,
              error = null
            )
          },
          onFailure = {
            state.copy(
              items = emptyList(),
              error = it.message ?: "Feed refresh failed."
            )
          }
        )
      }
    }
  }

  fun selectItem(item: RssItem) = mutableUiState.update { state ->
    state.copy(
      selectedItem = item.copy(isRead = true),
      items = state.items.map { candidate ->
        if (candidate.link == item.link && candidate.title == item.title) {
          candidate.copy(isRead = true)
        } else {
          candidate
        }
      }
    )
  }

  fun closeItem() = mutableUiState.update { it.copy(selectedItem = null) }

  internal fun replaceItemsForTest(items: List<RssItem>) {
    mutableUiState.update { it.copy(items = items) }
  }
}

private fun RssUiState.clearDraft(): RssUiState {
  return copy(
    titleDraft = "",
    urlDraft = "",
    error = null
  )
}

private fun List<RssFeed>.markFeed(
  feedId: String,
  label: String
): List<RssFeed> {
  return map { feed ->
    if (feed.id == feedId) feed.copy(lastRefreshLabel = label) else feed
  }
}
