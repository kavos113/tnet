package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetRadiusSmall
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssFeedForm(
  uiState: RssUiState,
  onUrlChange: (String) -> Unit,
  onFolderSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(TnetSpace1)) {
    RssCompactInput(
      value = uiState.urlDraft,
      onValueChange = onUrlChange,
      modifier = Modifier.fillMaxWidth(),
      placeholder = "Feed URL"
    )
    RssFolderPicker(
      folders = uiState.folders,
      selectedFolderId = uiState.selectedFolderIdDraft,
      onFolderSelected = onFolderSelected
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetPrimaryButton(text = if (uiState.isEditing) "Save feed" else "Add feed", onClick = onSave)
      if (uiState.isEditing) {
        TnetSecondaryButton(text = "Cancel", onClick = onCancel)
      }
      uiState.editingFeedId?.let {
        Text(text = "Editing feed", style = MaterialTheme.typography.bodySmall, color = TnetPrimary)
      }
    }
    if (!uiState.isEditing) {
      RssCompactInput(
        value = uiState.bulkImportDraft,
        onValueChange = onBulkImportChange,
        modifier = Modifier.fillMaxWidth(),
        placeholder = "Bulk import URLs",
        singleLine = false
      )
      Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
        TnetSecondaryButton(text = "Import URLs", onClick = onImportBulk)
        TnetSecondaryButton(text = "Import .txt", onClick = onImportTextFile)
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
  Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
    RssCompactInput(
      value = title,
      onValueChange = onTitleChange,
      modifier = Modifier
        .weight(1f),
      placeholder = "Folder title"
    )
    TnetSecondaryButton(text = "Create folder", onClick = onSave)
  }
}

@Composable
private fun RssCompactInput(
  value: String,
  onValueChange: (String) -> Unit,
  placeholder: String,
  modifier: Modifier = Modifier,
  singleLine: Boolean = true
) {
  val inputHeight = if (singleLine) 30.dp else 54.dp
  BasicTextField(
    value = value,
    onValueChange = onValueChange,
    modifier = modifier
      .height(inputHeight)
      .background(TnetSurface, RoundedCornerShape(TnetRadiusSmall))
      .border(BorderStroke(1.dp, TnetBorder), RoundedCornerShape(TnetRadiusSmall))
      .padding(horizontal = 8.dp, vertical = 4.dp),
    singleLine = singleLine,
    textStyle = MaterialTheme.typography.bodySmall.copy(color = TnetText),
    cursorBrush = SolidColor(TnetPrimary),
    decorationBox = { innerTextField ->
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .heightIn(min = 20.dp)
          .defaultMinSize(minHeight = 20.dp)
      ) {
        if (value.isEmpty()) {
          Text(text = placeholder, style = MaterialTheme.typography.bodySmall, color = TnetTextMuted)
        }
        innerTextField()
      }
    }
  )
}

@Composable
private fun RssFolderPicker(
  folders: List<RssFolder>,
  selectedFolderId: String?,
  onFolderSelected: (String?) -> Unit
) {
  Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
    Text(text = "Folder", style = MaterialTheme.typography.bodySmall, color = TnetTextMuted)
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace1)) {
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
      verticalArrangement = Arrangement.spacedBy(TnetSpace1)
    ) {
      Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
        Text(
          text = feed.title,
          modifier = Modifier.weight(0.35f),
          style = MaterialTheme.typography.titleSmall,
          maxLines = 1
        )
        Text(
          text = feed.url,
          modifier = Modifier.weight(0.65f),
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted,
          maxLines = 1
        )
      }
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        val refreshText = if (isSyncing) "Syncing..." else feed.lastRefreshLabel ?: "Refresh"
        Text(
          text = refreshText,
          modifier = Modifier.weight(1f),
          style = MaterialTheme.typography.bodySmall,
          color = if (isSyncing || feed.lastRefreshLabel != null) TnetPrimary else TnetTextMuted,
          maxLines = 1
        )
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
    Box(modifier = Modifier.padding(16.dp)) {
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

@Preview(showBackground = true)
@Composable
private fun RssFeedRowSyncingPreview() {
  TnetTheme {
    Box(modifier = Modifier.padding(16.dp)) {
      RssFeedRow(
        feed = previewRssFeed.copy(lastRefreshLabel = "Fetched 12 items"),
        selected = true,
        isSyncing = true,
        onClick = {},
        onRefresh = {},
        onEdit = {},
        onRemove = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssFeedFormPreview() {
  TnetTheme {
    Box(modifier = Modifier.padding(16.dp)) {
      RssFeedForm(
        uiState = RssUiState(
          urlDraft = "https://example.com/feed.xml",
          bulkImportDraft = "https://example.com/news.xml\nhttps://example.com/blog.xml"
        ),
        onUrlChange = {},
        onFolderSelected = {},
        onBulkImportChange = {},
        onSave = {},
        onImportBulk = {},
        onImportTextFile = {},
        onCancel = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssFeedFormEditingPreview() {
  TnetTheme {
    Box(modifier = Modifier.padding(16.dp)) {
      RssFeedForm(
        uiState = RssUiState(
          urlDraft = "https://example.com/research.xml",
          editingFeedId = "feed-preview"
        ),
        onUrlChange = {},
        onFolderSelected = {},
        onBulkImportChange = {},
        onSave = {},
        onImportBulk = {},
        onImportTextFile = {},
        onCancel = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssFolderFormPreview() {
  TnetTheme {
    Box(modifier = Modifier.padding(16.dp)) {
      RssFolderForm(
        title = "Research",
        onTitleChange = {},
        onSave = {}
      )
    }
  }
}
