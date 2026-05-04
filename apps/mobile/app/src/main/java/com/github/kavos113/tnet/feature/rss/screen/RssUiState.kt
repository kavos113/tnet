package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.feature.rss.model.RssItem

data class RssUiState(
  val feeds: List<RssFeed> = emptyList(),
  val folders: List<RssFolder> = emptyList(),
  val nextFeedNumber: Int = 1,
  val nextFolderNumber: Int = 1,
  val titleDraft: String = "",
  val urlDraft: String = "",
  val folderTitleDraft: String = "",
  val selectedFolderIdDraft: String? = null,
  val bulkImportDraft: String = "",
  val importMessage: String? = null,
  val error: String? = null,
  val selectedSource: RssSource = RssSource.All,
  val selectedFeedTitle: String? = null,
  val editingFeedId: String? = null,
  val selectedItem: RssItem? = null,
  val items: List<RssItem> = emptyList(),
  val isDrawerOpen: Boolean = true,
  val isRefreshing: Boolean = false,
  val isArticlePanelOpen: Boolean = false
) {
  val isEditing: Boolean = editingFeedId != null
  val selectedSourceTitle: String = when (val source = selectedSource) {
    RssSource.All -> "All feeds"
    is RssSource.Folder -> folders.firstOrNull { it.id == source.folderId }?.title ?: "Folder"
    is RssSource.Feed -> feeds.firstOrNull { it.id == source.feedId }?.title ?: "Feed"
  }
  val visibleFeeds: List<RssFeed> = when (val source = selectedSource) {
    RssSource.All -> feeds
    is RssSource.Folder -> feeds.filter { it.folderId == source.folderId }
    is RssSource.Feed -> feeds.filter { it.id == source.feedId }
  }
  val visibleItems: List<RssItem> = items.filter { item ->
    visibleFeeds.any { it.id == item.feedId }
  }
}

sealed interface RssSource {
  data object All : RssSource
  data class Folder(val folderId: String) : RssSource
  data class Feed(val feedId: String) : RssSource
}
