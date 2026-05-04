package com.github.kavos113.tnet.feature.rss.screen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.feature.rss.model.InMemoryRssRepository
import com.github.kavos113.tnet.feature.rss.model.ParsedRssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.feature.rss.model.RssRepository
import com.github.kavos113.tnet.feature.rss.model.createRssFeed
import com.github.kavos113.tnet.feature.rss.model.fetchRssFeed
import com.github.kavos113.tnet.feature.rss.model.fetchRssItems
import com.github.kavos113.tnet.feature.rss.model.normalizeRssFeedUrl
import com.github.kavos113.tnet.feature.rss.model.parseRssFeedUrlList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
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
  private val feedFetcher: (String) -> Result<List<RssItem>> = ::fetchRssItems,
  private val feedLoader: (String) -> Result<ParsedRssFeed> = ::fetchRssFeed
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

  fun updateUrlDraft(value: String) = mutableUiState.update { it.copy(urlDraft = value) }

  fun updateFolderTitleDraft(value: String) = mutableUiState.update { it.copy(folderTitleDraft = value) }

  fun selectFolderDraft(folderId: String?) = mutableUiState.update { it.copy(selectedFolderIdDraft = folderId) }

  fun updateBulkImportDraft(value: String) = mutableUiState.update {
    it.copy(bulkImportDraft = value, importMessage = null, error = null)
  }

  fun updateSearchQuery(value: String) = mutableUiState.update {
    it.copy(searchQuery = value, visibleItemLimit = RSS_ITEM_PAGE_SIZE)
  }

  fun openDrawer() = mutableUiState.update { it.copy(isDrawerOpen = true) }

  fun closeDrawer() = mutableUiState.update { it.copy(isDrawerOpen = false) }

  fun selectSource(source: RssSource) {
    mutableUiState.update {
      it.copy(
        selectedSource = source,
        selectedItem = null,
        isArticlePanelOpen = false,
        isDrawerOpen = false,
        visibleItemLimit = RSS_ITEM_PAGE_SIZE,
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
    val request = mutableUiState.updateAndReturn { state ->
      val editingFeedId = state.editingFeedId
      val normalizedUrl = normalizeRssFeedUrl(state.urlDraft)
        ?: return@updateAndReturn null to state.copy(error = "Enter an http or https feed URL.")
      if (state.feeds.any { it.id != editingFeedId && normalizeRssFeedUrl(it.url) == normalizedUrl }) {
        return@updateAndReturn null to state.copy(error = "Feed URL is already subscribed.")
      }
      val feedId = editingFeedId ?: "feed-${state.nextFeedNumber}"
      val folderId = state.selectedFolderIdDraft
      Triple(feedId, normalizedUrl, folderId) to state.copy(error = null, importMessage = "Fetching feed title...")
    } ?: return

    viewModelScope.launch {
      val parsedFeed = withContext(Dispatchers.IO) { feedLoader(request.second) }
      val title = parsedFeed.getOrNull()?.title?.trim().orEmpty()
      if (title.isBlank()) {
        mutableUiState.update { it.copy(error = "Could not read RSS feed title.", importMessage = null) }
        return@launch
      }
      val feed = createRssFeed(request.first, title, request.second)?.copy(folderId = request.third)
      if (feed == null) {
        mutableUiState.update { it.copy(error = "Enter an http or https feed URL.", importMessage = null) }
        return@launch
      }
      val items = parsedFeed.getOrNull()?.items.orEmpty().withStableIds(feed.id)
      mutableUiState.update { state ->
        if (state.editingFeedId == null) {
          state.copy(
            feeds = listOf(feed) + state.feeds,
            items = items + state.items.filterNot { it.feedId == feed.id },
            nextFeedNumber = state.nextFeedNumber + 1
          ).clearDraft()
        } else {
          state.copy(
            feeds = state.feeds.map { if (it.id == feed.id) feed.copy(lastRefreshLabel = it.lastRefreshLabel) else it },
            items = items + state.items.filterNot { it.feedId == feed.id },
            editingFeedId = null
          ).clearDraft()
        }
      }
      repository.upsertFeed(feed)
      repository.upsertItems(items)
    }
  }

  fun importFeedsFromText(text: String? = null) {
    val request = mutableUiState.updateAndReturn { state ->
      val source = text ?: state.bulkImportDraft
      val parsed = parseRssFeedUrlList(source)
      if (parsed.urls.isEmpty() && parsed.invalidLines.isEmpty()) {
        return@updateAndReturn null to state.copy(error = "Enter one feed URL per line.", importMessage = null)
      }

      val existingUrls = state.feeds.mapNotNull { normalizeRssFeedUrl(it.url) }.toSet()
      val urlsToImport = parsed.urls.filterNot { it in existingUrls }
      val existingSkipped = parsed.urls.size - urlsToImport.size
      ImportRequest(
        urls = urlsToImport,
        firstFeedNumber = state.nextFeedNumber,
        folderId = state.importFolderId(),
        existingSkipped = existingSkipped,
        duplicateSkipped = parsed.duplicateLines,
        invalidCount = parsed.invalidLines.size
      ) to state.copy(
        bulkImportDraft = if (text == null) "" else state.bulkImportDraft,
        importMessage = "Fetching feed titles...",
        error = null
      )
    } ?: return

    viewModelScope.launch {
      val loadedFeeds = request.urls.mapIndexed { index, url ->
        async(Dispatchers.IO) {
          val parsedFeed = feedLoader(url).getOrNull() ?: return@async null
          val title = parsedFeed.title?.trim().orEmpty()
          if (title.isBlank()) return@async null
          val feed = createRssFeed("feed-${request.firstFeedNumber + index}", title, url)
            ?.copy(folderId = request.folderId)
            ?: return@async null
          feed to parsedFeed.items.withStableIds(feed.id)
        }
      }.mapNotNull { it.await() }
      val feeds = loadedFeeds.map { it.first }
      val items = loadedFeeds.flatMap { it.second }
      val skipped = request.existingSkipped + request.duplicateSkipped + (request.urls.size - feeds.size)
      val messageParts = buildList {
        add("Imported ${feeds.size} feeds.")
        if (skipped > 0) add("Skipped $skipped duplicate feeds or unreadable feeds.")
        if (request.invalidCount > 0) add("Ignored ${request.invalidCount} invalid lines.")
      }

      mutableUiState.update { state ->
        state.copy(
          feeds = feeds + state.feeds,
          items = items + state.items.filterNot { item -> feeds.any { it.id == item.feedId } },
          nextFeedNumber = state.nextFeedNumber + request.urls.size,
          importMessage = messageParts.joinToString(" "),
          error = if (feeds.isEmpty() && request.invalidCount > 0) "No valid new feed URLs found." else null
        )
      }
      feeds.forEach { repository.upsertFeed(it) }
      repository.upsertItems(items)
    }
  }

  fun cancelEditing() = mutableUiState.update { it.copy(editingFeedId = null).clearDraft() }

  fun editFeed(feed: RssFeed) {
    mutableUiState.update {
      it.copy(
        editingFeedId = feed.id,
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

  fun loadMoreItems() = mutableUiState.update { state ->
    if (state.canLoadMoreItems) {
      state.copy(visibleItemLimit = state.visibleItemLimit + RSS_ITEM_PAGE_SIZE)
    } else {
      state
    }
  }

  internal fun replaceItemsForTest(items: List<RssItem>) {
    mutableUiState.update { it.copy(items = items) }
    viewModelScope.launch { repository.upsertItems(items) }
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

private data class ImportRequest(
  val urls: List<String>,
  val firstFeedNumber: Int,
  val folderId: String?,
  val existingSkipped: Int,
  val duplicateSkipped: Int,
  val invalidCount: Int
)

private fun RssUiState.clearDraft(): RssUiState {
  return copy(
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
