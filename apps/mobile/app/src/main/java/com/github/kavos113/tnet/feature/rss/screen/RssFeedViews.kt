package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssFeedForm(
  uiState: RssUiState,
  onTitleChange: (String) -> Unit,
  onUrlChange: (String) -> Unit,
  onFolderSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit
) {
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
      RssFolderPicker(
        folders = uiState.folders,
        selectedFolderId = uiState.selectedFolderIdDraft,
        onFolderSelected = onFolderSelected
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
      if (!uiState.isEditing) {
        TnetCompactTextField(
          value = uiState.bulkImportDraft,
          onValueChange = onBulkImportChange,
          modifier = Modifier.fillMaxWidth(),
          label = "Bulk import URLs",
          singleLine = false,
          minLines = 4
        )
        Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
          TnetSecondaryButton(text = "Import URLs", onClick = onImportBulk)
          TnetSecondaryButton(text = "Import .txt", onClick = onImportTextFile)
        }
      }
    }
  }
}

@Composable
internal fun RssFolderForm(
  title: String,
  onTitleChange: (String) -> Unit,
  onSave: () -> Unit
) {
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetCompactTextField(
        value = title,
        onValueChange = onTitleChange,
        modifier = Modifier.fillMaxWidth(),
        label = "Folder title"
      )
      TnetSecondaryButton(text = "Create folder", onClick = onSave)
    }
  }
}

@Composable
private fun RssFolderPicker(
  folders: List<RssFolder>,
  selectedFolderId: String?,
  onFolderSelected: (String?) -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
    Text(
      text = "Folder",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      FilterChip(
        selected = selectedFolderId == null,
        onClick = { onFolderSelected(null) },
        label = { Text("None") }
      )
    }
    folders.forEach { folder ->
      FilterChip(
        selected = selectedFolderId == folder.id,
        onClick = { onFolderSelected(folder.id) },
        label = { Text(folder.title, maxLines = 1) }
      )
    }
  }
}

@Composable
internal fun RssFeedRow(
  feed: RssFeed,
  selected: Boolean = false,
  isSyncing: Boolean = false,
  onClick: (() -> Unit)? = null,
  onRefresh: () -> Unit,
  onEdit: () -> Unit,
  onRemove: () -> Unit
) {
  TnetListRow(selected = selected, onClick = onClick) {
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
          text = if (isSyncing) "Syncing..." else it,
          style = MaterialTheme.typography.bodySmall,
          color = TnetPrimary
        )
      }
      if (isSyncing && feed.lastRefreshLabel == null) {
        Text(
          text = "Syncing...",
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

@Preview(showBackground = true)
@Composable
private fun RssFeedRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssFeedRow(
        feed = previewRssFeed,
        onClick = {},
        onRefresh = {},
        onEdit = {},
        onRemove = {}
      )
    }
  }
}
