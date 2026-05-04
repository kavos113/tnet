package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
fun RssScreen(
  modifier: Modifier = Modifier,
  viewModel: RssViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  RssScreenContent(
    uiState = uiState,
    onTitleChange = viewModel::updateTitleDraft,
    onUrlChange = viewModel::updateUrlDraft,
    onSave = viewModel::saveFeed,
    onCancel = viewModel::cancelEditing,
    onRefresh = viewModel::refreshFeed,
    onEdit = viewModel::editFeed,
    onRemove = viewModel::removeFeed,
    onItemSelected = viewModel::selectItem,
    onItemBack = viewModel::closeItem,
    modifier = modifier
  )
}

@Composable
private fun RssScreenContent(
  uiState: RssUiState,
  onTitleChange: (String) -> Unit,
  onUrlChange: (String) -> Unit,
  onSave: () -> Unit,
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
    TnetPanel {
      Column(verticalArrangement = Arrangement.spacedBy(TnetSpace2)) {
        TnetCompactTextField(
          value = uiState.titleDraft,
          onValueChange = onTitleChange,
          modifier = Modifier.fillMaxWidth(),
          label = "Title"
        )
        TnetCompactTextField(
          value = uiState.urlDraft,
          onValueChange = onUrlChange,
          modifier = Modifier.fillMaxWidth(),
          label = "Feed URL"
        )
    uiState.editingFeedId?.let {
      Text(
        text = "Editing feed",
        style = MaterialTheme.typography.bodySmall,
        color = TnetPrimary
      )
    }
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetPrimaryButton(text = if (uiState.isEditing) "Save feed" else "Add feed", onClick = onSave)
      if (uiState.isEditing) {
        TnetSecondaryButton(text = "Cancel", onClick = onCancel)
      }
    }
      }
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

@Composable
private fun RssFeedRow(
  feed: RssFeed,
  onRefresh: () -> Unit,
  onEdit: () -> Unit,
  onRemove: () -> Unit
) {
  TnetListRow {
    Column(
      verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      Text(
        text = feed.title,
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = feed.url,
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
      feed.lastRefreshLabel?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = TnetPrimary
        )
      }
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        TnetSecondaryButton(text = "Refresh", onClick = onRefresh)
        TnetSecondaryButton(text = "Edit", onClick = onEdit)
        TnetSecondaryButton(text = "Remove", onClick = onRemove)
      }
    }
  }
}

@Composable
private fun RssItemList(
  selectedFeedTitle: String?,
  items: List<RssItem>,
  onItemSelected: (RssItem) -> Unit
) {
  if (selectedFeedTitle == null || items.isEmpty()) return

  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    Text(
      text = selectedFeedTitle,
      style = MaterialTheme.typography.titleMedium
    )
    items.take(20).forEach { item ->
      TnetListRow(onClick = { onItemSelected(item) }) {
        Column(
          verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Text(
            text = item.title,
            style = MaterialTheme.typography.bodyLarge
          )
          item.publishedAt?.let {
            Text(
              text = it,
              style = MaterialTheme.typography.bodySmall,
              color = TnetTextMuted
            )
          }
        }
      }
    }
  }
}

@Composable
private fun RssItemDetail(
  item: RssItem?,
  onBack: () -> Unit
) {
  if (item == null) return

  TnetSecondaryButton(text = "Back to articles", onClick = onBack)
  TnetPanel {
    Column(
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Text(
        text = item.title,
        style = MaterialTheme.typography.titleMedium
      )
      item.publishedAt?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
      }
      item.link?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodyMedium,
          color = TnetPrimary
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssFeedRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssFeedRow(
        feed = RssFeed(
          id = "feed-preview",
          title = "Mobile Android",
          url = "https://example.com/android.xml",
          lastRefreshLabel = "Fetched 8 items"
        ),
        onRefresh = {},
        onEdit = {},
        onRemove = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemListPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemList(
        selectedFeedTitle = "Mobile Android",
        items = listOf(
          RssItem(
            title = "Compose state hoisting with ViewModel",
            link = "https://example.com/compose-state",
            publishedAt = "2026-05-04"
          ),
          RssItem(
            title = "Local-first RSS reader notes",
            link = "https://example.com/local-first-rss",
            publishedAt = "2026-05-03"
          )
        ),
        onItemSelected = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemDetailComponentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemDetail(
        item = RssItem(
          title = "Component-level RSS detail",
          link = "https://example.com/rss-detail",
          publishedAt = "2026-05-04"
        ),
        onBack = {}
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
        feeds = listOf(
          RssFeed(
            id = "feed-1",
            title = "Research updates",
            url = "https://example.com/research.xml",
            lastRefreshLabel = "Fetched 12 items"
          ),
          RssFeed(
            id = "feed-2",
            title = "Engineering",
            url = "https://example.com/engineering.xml"
          )
        ),
        titleDraft = "New feed",
        urlDraft = "https://example.com/feed.xml",
        selectedFeedTitle = "Research updates",
        items = listOf(
          RssItem(
            title = "A practical note on offline-first readers",
            link = "https://example.com/articles/offline-first",
            publishedAt = "2026-05-04"
          ),
          RssItem(
            title = "SQLite sharing constraints on Android",
            link = "https://example.com/articles/sqlite-android",
            publishedAt = "2026-05-03"
          )
        )
      ),
      onTitleChange = {},
      onUrlChange = {},
      onSave = {},
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
        feeds = listOf(
          RssFeed(
            id = "feed-1",
            title = "Research updates",
            url = "https://example.com/research.xml"
          )
        ),
        selectedFeedTitle = "Research updates",
        selectedItem = RssItem(
          title = "Read-only mobile workspace sharing",
          link = "https://example.com/articles/workspace-sharing",
          publishedAt = "2026-05-04"
        )
      ),
      onTitleChange = {},
      onUrlChange = {},
      onSave = {},
      onCancel = {},
      onRefresh = {},
      onEdit = {},
      onRemove = {},
      onItemSelected = {},
      onItemBack = {}
    )
  }
}
