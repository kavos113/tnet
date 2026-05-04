package com.github.kavos113.tnet.feature.rss.screen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.feature.rss.model.InMemoryRssRepository
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.feature.rss.model.RssRepository
import com.github.kavos113.tnet.feature.rss.model.createRssFeed
import com.github.kavos113.tnet.feature.rss.model.fetchRssItems
import com.github.kavos113.tnet.feature.rss.model.normalizeRssFeedUrl
import com.github.kavos113.tnet.feature.rss.model.parseRssFeedUrlList
import com.github.kavos113.tnet.feature.rss.model.updateRssFeed
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.joinAll

class RssViewModel(
  private val repository: RssRepository = InMemoryRssRepository(),
  private val feedFetcher: (String) -> Result<List<RssItem>> = ::fetchRssItems
) : ViewModel() {
  private val mutableUiState = MutableStateFlow(RssUiState())
  val uiState: StateFlow<RssUiState> = mutableUiState.asStateFlow()

  init {
    viewModelScope.launch {
      combine(repository.feeds, repository.folders) { feeds, folders -> feeds to folders }
        .collect { (feeds, folders) ->
          mutableUiState.update { state ->
            state.copy(
              feeds = feeds,
              folders = folders,
              nextFeedNumber = nextNumberAfter(feeds.map { it.id }, "feed-"),
              nextFolderNumber = nextNumberAfter(folders.map { it.id }, "folder-"),
              selectedSource = state.selectedSource.keepExistingSelection(feeds, folders),
              isFeedListLoading = false
            )
          }
        }
    }
    viewModelScope.launch {
      repository.items.collect { items ->
        mutableUiState.update { state ->
          state.copy(
            items = items,
            isItemsLoading = false
          )
        }
      }
    }
  }

  fun updateTitleDraft(value: String) = mutableUiState.update { it.copy(titleDraft = value) }

  fun updateUrlDraft(value: String) = mutableUiState.update { it.copy(urlDraft = value) }

  fun updateFolderTitleDraft(value: String) = mutableUiState.update { it.copy(folderTitleDraft = value) }

  fun selectFolderDraft(folderId: String?) = mutableUiState.update { it.copy(selectedFolderIdDraft = folderId) }

  fun updateBulkImportDraft(value: String) = mutableUiState.update {
    it.copy(bulkImportDraft = value, importMessage = null, error = null)
  }

  fun updateSearchQuery(value: String) = mutableUiState.update { it.copy(searchQuery = value) }

  fun openDrawer() = mutableUiState.update { it.copy(isDrawerOpen = true) }

  fun closeDrawer() = mutableUiState.update { it.copy(isDrawerOpen = false) }

  fun selectSource(source: RssSource) {
    mutableUiState.update {
      it.copy(
        selectedSource = source,
        selectedItem = null,
        isArticlePanelOpen = false,
        isDrawerOpen = false,
        selectedFeedTitle = when (source) {
          RssSource.All -> null
          RssSource.Unread -> null
          is RssSource.Folder -> it.folders.firstOrNull { folder -> folder.id == source.folderId }?.title
          is RssSource.Feed -> it.feeds.firstOrNull { feed -> feed.id == source.feedId }?.title
        }
      )
    }
    if (source is RssSource.Feed) {
      mutableUiState.value.feeds.firstOrNull { it.id == source.feedId }?.let { feed ->
        if (mutableUiState.value.items.none { it.feedId == feed.id }) refreshFeed(feed)
      }
    }
  }

  fun saveFolder() {
    val folder = mutableUiState.updateAndReturn { state ->
      val title = state.folderTitleDraft.trim()
      if (title.isBlank()) {
        return@updateAndReturn null to state.copy(error = "Enter a folder title.")
      }
      val folder = RssFolder(
        id = "folder-${state.nextFolderNumber}",
        title = title
      )
      folder to state.copy(
        folders = listOf(folder) + state.folders,
        nextFolderNumber = state.nextFolderNumber + 1,
        folderTitleDraft = "",
        selectedFolderIdDraft = folder.id,
        error = null
      )
    } ?: return
    viewModelScope.launch { repository.upsertFolder(folder) }
  }

  fun saveFeed() {
    var feedToSave: RssFeed? = null
    mutableUiState.update { state ->
      val editingFeedId = state.editingFeedId
      if (editingFeedId != null) {
        val normalizedUrl = normalizeRssFeedUrl(state.urlDraft)
          ?: return@update state.copy(error = "Enter an http or https feed URL.")
        if (state.feeds.any { it.id != editingFeedId && normalizeRssFeedUrl(it.url) == normalizedUrl }) {
          return@update state.copy(error = "Feed URL is already subscribed.")
        }
        val updatedFeeds = updateRssFeed(
          feeds = state.feeds,
          feedId = editingFeedId,
          title = state.titleDraft,
          url = state.urlDraft
        ) ?: return@update state.copy(error = "Enter an http or https feed URL.")
        val updatedFeed = updatedFeeds.first { it.id == editingFeedId }.copy(folderId = state.selectedFolderIdDraft)
        feedToSave = updatedFeed

        state.copy(
          feeds = updatedFeeds.map { if (it.id == editingFeedId) updatedFeed else it },
          editingFeedId = null
        ).clearDraft()
      } else {
        val normalizedUrl = normalizeRssFeedUrl(state.urlDraft)
          ?: return@update state.copy(error = "Enter an http or https feed URL.")
        if (state.feeds.any { normalizeRssFeedUrl(it.url) == normalizedUrl }) {
          return@update state.copy(error = "Feed URL is already subscribed.")
        }
        val feed = createRssFeed(
          id = "feed-${state.nextFeedNumber}",
          title = state.titleDraft,
          url = state.urlDraft
        ) ?: return@update state.copy(error = "Enter an http or https feed URL.")
        val feedWithFolder = feed.copy(folderId = state.selectedFolderIdDraft)
        feedToSave = feedWithFolder

        state
          .copy(
            feeds = listOf(feedWithFolder) + state.feeds,
            nextFeedNumber = state.nextFeedNumber + 1
          )
          .clearDraft()
      }
    }
    feedToSave?.let { feed -> viewModelScope.launch { repository.upsertFeed(feed) } }
  }

  fun importFeedsFromText(text: String? = null) {
    var feedsToSave = emptyList<RssFeed>()
    mutableUiState.update { state ->
      val source = text ?: state.bulkImportDraft
      val parsed = parseRssFeedUrlList(source)
      if (parsed.urls.isEmpty() && parsed.invalidLines.isEmpty()) {
        return@update state.copy(error = "Enter one feed URL per line.", importMessage = null)
      }

      val existingUrls = state.feeds.mapNotNull { normalizeRssFeedUrl(it.url) }.toSet()
      val urlsToImport = parsed.urls.filterNot { it in existingUrls }
      val existingSkipped = parsed.urls.size - urlsToImport.size
      val feeds = urlsToImport.mapIndexedNotNull { index, url ->
        createRssFeed(
          id = "feed-${state.nextFeedNumber + index}",
          title = "",
          url = url
        )?.copy(folderId = state.importFolderId())
      }
      feedsToSave = feeds
      val skipped = existingSkipped + parsed.duplicateLines
      val invalid = parsed.invalidLines.size
      val messageParts = buildList {
        add("Imported ${feeds.size} feeds.")
        if (skipped > 0) add("Skipped $skipped duplicate feeds.")
        if (invalid > 0) add("Ignored $invalid invalid lines.")
      }

      state.copy(
        feeds = feeds + state.feeds,
        nextFeedNumber = state.nextFeedNumber + feeds.size,
        bulkImportDraft = if (text == null) "" else state.bulkImportDraft,
        importMessage = messageParts.joinToString(" "),
        error = if (feeds.isEmpty() && invalid > 0) "No valid new feed URLs found." else null
      )
    }
    feedsToSave.forEach { feed ->
      viewModelScope.launch { repository.upsertFeed(feed) }
    }
  }

  fun cancelEditing() = mutableUiState.update { it.copy(editingFeedId = null).clearDraft() }

  fun editFeed(feed: RssFeed) {
    mutableUiState.update {
      it.copy(
        editingFeedId = feed.id,
        titleDraft = feed.title,
        urlDraft = feed.url,
        selectedFolderIdDraft = feed.folderId,
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
    viewModelScope.launch { repository.deleteFeed(feed.id) }
  }

  fun refreshFeed(feed: RssFeed) {
    mutableUiState.update {
      it.copy(
        feeds = it.feeds.markFeed(feed.id, "Refresh requested"),
        syncingFeedIds = it.syncingFeedIds + feed.id,
        isRefreshing = true,
        selectedFeedTitle = feed.title,
        selectedItem = null
      )
    }

    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        feedFetcher(feed.url)
      }
      applyFeedSyncResult(feed, result)
      mutableUiState.update {
        it.copy(
          syncingFeedIds = it.syncingFeedIds - feed.id,
          isRefreshing = it.syncingFeedIds.minus(feed.id).isNotEmpty()
        )
      }
    }
  }

  fun refreshSelectedSource() {
    val feeds = mutableUiState.value.visibleFeeds
    if (feeds.isEmpty()) return
    val feedIds = feeds.map { it.id }.toSet()
    mutableUiState.update {
      it.copy(
        isRefreshing = true,
        syncingFeedIds = it.syncingFeedIds + feedIds
      )
    }
    viewModelScope.launch {
      feeds.map { feed ->
        launch {
          val result = withContext(Dispatchers.IO) { feedFetcher(feed.url) }
          applyFeedSyncResult(feed, result)
          mutableUiState.update { state ->
            state.copy(
              syncingFeedIds = state.syncingFeedIds - feed.id,
              isRefreshing = state.syncingFeedIds.minus(feed.id).isNotEmpty()
            )
          }
        }
      }.joinAll()
      mutableUiState.update { it.copy(isRefreshing = false, syncingFeedIds = it.syncingFeedIds - feedIds) }
    }
  }

  private fun applyFeedSyncResult(feed: RssFeed, result: Result<List<RssItem>>) {
    mutableUiState.update { state ->
      result.fold(
        onSuccess = { items ->
          val itemsWithIds = items.withStableIds(feed.id)
          viewModelScope.launch { repository.upsertItems(itemsWithIds) }
          val updatedFeed = feed.copy(lastRefreshLabel = "Fetched ${items.size} items")
          viewModelScope.launch { repository.upsertFeed(updatedFeed) }
          state.copy(
            feeds = state.feeds.markFeed(feed.id, "Fetched ${items.size} items"),
            items = itemsWithIds + state.items.filterNot { it.feedId == feed.id },
            error = null
          )
        },
        onFailure = {
          state.copy(error = it.message ?: "Feed refresh failed.")
        }
      )
    }
  }

  fun selectItem(item: RssItem) = mutableUiState.update { state ->
    val readItem = item.copy(isRead = true)
    if (item.id.isNotBlank()) {
      viewModelScope.launch { repository.markItemRead(item.id) }
    }
    state.copy(
      selectedItem = readItem,
      isArticlePanelOpen = true,
      items = state.items.map { candidate ->
        if (candidate.id == item.id) {
          candidate.copy(isRead = true)
        } else {
          candidate
        }
      }
    )
  }

  fun closeItem() = mutableUiState.update { it.copy(selectedItem = null, isArticlePanelOpen = false) }

  internal fun replaceItemsForTest(items: List<RssItem>) {
    mutableUiState.update { it.copy(items = items) }
  }
}

private fun <T> MutableStateFlow<RssUiState>.updateAndReturn(
  transform: (RssUiState) -> Pair<T?, RssUiState>
): T? {
  var result: T? = null
  update { state ->
    val (value, nextState) = transform(state)
    result = value
    nextState
  }
  return result
}

private fun RssUiState.clearDraft(): RssUiState {
  return copy(
    titleDraft = "",
    urlDraft = "",
    selectedFolderIdDraft = null,
    importMessage = null,
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

private fun RssUiState.importFolderId(): String? {
  return when (val source = selectedSource) {
    RssSource.All -> selectedFolderIdDraft
    RssSource.Unread -> selectedFolderIdDraft
    is RssSource.Folder -> source.folderId
    is RssSource.Feed -> selectedFolderIdDraft
  }
}

private fun RssSource.keepExistingSelection(
  feeds: List<RssFeed>,
  folders: List<RssFolder>
): RssSource {
  return when (this) {
    RssSource.All -> this
    RssSource.Unread -> this
    is RssSource.Folder -> if (folders.any { it.id == folderId }) this else RssSource.All
    is RssSource.Feed -> if (feeds.any { it.id == feedId }) this else RssSource.All
  }
}

private fun nextNumberAfter(ids: List<String>, prefix: String): Int {
  return (ids.mapNotNull { it.removePrefix(prefix).toIntOrNull() }.maxOrNull() ?: 0) + 1
}

private fun List<RssItem>.withStableIds(feedId: String): List<RssItem> {
  return mapIndexed { index, item ->
    val identity = item.link ?: "${item.title}-${item.publishedAt.orEmpty()}-$index"
    item.copy(
      id = "$feedId-${identity.hashCode()}",
      feedId = feedId
    )
  }
}
