package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssScreenContent(
  uiState: RssUiState,
  onTitleChange: (String) -> Unit,
  onUrlChange: (String) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit,
  onRefresh: (RssFeed) -> Unit,
  onEdit: (RssFeed) -> Unit,
  onRemove: (RssFeed) -> Unit,
  onItemSelected: (RssItem) -> Unit,
  onItemBack: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "RSS",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Manage feeds and fetch articles on this device.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    RssFeedForm(
      uiState = uiState,
      onTitleChange = onTitleChange,
      onUrlChange = onUrlChange,
      onBulkImportChange = onBulkImportChange,
      onSave = onSave,
      onImportBulk = onImportBulk,
      onImportTextFile = onImportTextFile,
      onCancel = onCancel
    )
    uiState.importMessage?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
    }
    uiState.error?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error
      )
    }
    if (uiState.feeds.isEmpty()) {
      Text(
        text = "No feeds yet.",
        color = TnetTextMuted
      )
    } else {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        uiState.feeds.forEach { feed ->
          RssFeedRow(
            feed = feed,
            onRefresh = { onRefresh(feed) },
            onEdit = { onEdit(feed) },
            onRemove = { onRemove(feed) }
          )
        }
      }
    }
    if (uiState.selectedItem == null) {
      RssItemList(
        selectedFeedTitle = uiState.selectedFeedTitle,
        items = uiState.items,
        onItemSelected = onItemSelected
      )
    } else {
      RssItemDetail(
        item = uiState.selectedItem,
        onBack = onItemBack
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssScreenContentPreview() {
  TnetTheme {
    RssScreenContent(
      uiState = RssUiState(
        feeds = listOf(previewRssFeed, previewRssFeed.copy(id = "feed-2", title = "Engineering")),
        titleDraft = "New feed",
        urlDraft = "https://example.com/feed.xml",
        selectedFeedTitle = "Research updates",
        items = previewRssItems
      ),
      onTitleChange = {},
      onUrlChange = {},
      onBulkImportChange = {},
      onSave = {},
      onImportBulk = {},
      onImportTextFile = {},
      onCancel = {},
      onRefresh = {},
      onEdit = {},
      onRemove = {},
      onItemSelected = {},
      onItemBack = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemDetailPreview() {
  TnetTheme {
    RssScreenContent(
      uiState = RssUiState(
        feeds = listOf(previewRssFeed),
        selectedFeedTitle = "Research updates",
        selectedItem = previewRssItems.first()
      ),
      onTitleChange = {},
      onUrlChange = {},
      onBulkImportChange = {},
      onSave = {},
      onImportBulk = {},
      onImportTextFile = {},
      onCancel = {},
      onRefresh = {},
      onEdit = {},
      onRemove = {},
      onItemSelected = {},
      onItemBack = {}
    )
  }
}
