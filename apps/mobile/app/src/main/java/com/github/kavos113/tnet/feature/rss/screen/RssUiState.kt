package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.feature.rss.model.RssItem

data class RssUiState(
  val feeds: List<RssFeed> = emptyList(),
  val folders: List<RssFolder> = emptyList(),
  val nextFeedNumber: Int = 1,
  val nextFolderNumber: Int = 1,
  val urlDraft: String = "",
  val folderTitleDraft: String = "",
  val selectedFolderIdDraft: String? = null,
  val bulkImportDraft: String = "",
  val importMessage: String? = null,
  val error: String? = null,
  val searchQuery: String = "",
  val selectedSource: RssSource = RssSource.All,
  val selectedFeedTitle: String? = null,
  val editingFeedId: String? = null,
  val selectedItem: RssItem? = null,
  val items: List<RssItem> = emptyList(),
  val isDrawerOpen: Boolean = true,
  val isFeedListLoading: Boolean = true,
  val isItemsLoading: Boolean = true,
  val isRefreshing: Boolean = false,
  val syncingFeedIds: Set<String> = emptySet(),
  val isArticlePanelOpen: Boolean = false,
  val visibleItemLimit: Int = RSS_ITEM_PAGE_SIZE
) {
  val isEditing: Boolean = editingFeedId != null
  val selectedSourceTitle: String = when (val source = selectedSource) {
    RssSource.All -> "All feeds"
    RssSource.Unread -> "Unread"
    is RssSource.Folder -> folders.firstOrNull { it.id == source.folderId }?.title ?: "Folder"
    is RssSource.Feed -> feeds.firstOrNull { it.id == source.feedId }?.title ?: "Feed"
  }
  val selectedFeed: RssFeed? = (selectedSource as? RssSource.Feed)?.let { source ->
    feeds.firstOrNull { it.id == source.feedId }
  }
  val visibleFeeds: List<RssFeed> = when (val source = selectedSource) {
    RssSource.All -> feeds
    RssSource.Unread -> feeds
    is RssSource.Folder -> feeds.filter { it.folderId == source.folderId }
    is RssSource.Feed -> feeds.filter { it.id == source.feedId }
  }
  private val filteredItems: List<RssItem> = items
    .filter { item -> visibleFeeds.any { it.id == item.feedId } }
    .filter { item -> selectedSource != RssSource.Unread || !item.isRead }
    .filter { item ->
      searchQuery.isBlank() ||
        item.title.contains(searchQuery, ignoreCase = true) ||
        item.contentHtml.orEmpty().contains(searchQuery, ignoreCase = true)
    }
  val visibleItems: List<RssItem> = filteredItems.take(visibleItemLimit)
  val canLoadMoreItems: Boolean = filteredItems.size > visibleItemLimit
  fun unreadCount(feedId: String): Int = items.count { it.feedId == feedId && !it.isRead }
  fun unreadCountForFolder(folderId: String): Int {
    val feedIds = feeds.filter { it.folderId == folderId }.map { it.id }.toSet()
    return items.count { it.feedId in feedIds && !it.isRead }
  }
}

const val RSS_ITEM_PAGE_SIZE = 50

sealed interface RssSource {
  data object All : RssSource
  data object Unread : RssSource
  data class Folder(val folderId: String) : RssSource
  data class Feed(val feedId: String) : RssSource
}
