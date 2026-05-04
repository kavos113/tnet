package com.github.kavos113.tnet.feature.rss.screen

import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem

data class RssUiState(
  val feeds: List<RssFeed> = emptyList(),
  val nextFeedNumber: Int = 1,
  val titleDraft: String = "",
  val urlDraft: String = "",
  val bulkImportDraft: String = "",
  val importMessage: String? = null,
  val error: String? = null,
  val selectedFeedTitle: String? = null,
  val editingFeedId: String? = null,
  val selectedItem: RssItem? = null,
  val items: List<RssItem> = emptyList()
) {
  val isEditing: Boolean = editingFeedId != null
}
