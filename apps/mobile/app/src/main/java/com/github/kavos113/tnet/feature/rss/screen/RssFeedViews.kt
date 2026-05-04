package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
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
  onSave: () -> Unit,
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
}

@Composable
internal fun RssFeedRow(
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

@Preview(showBackground = true)
@Composable
private fun RssFeedRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssFeedRow(
        feed = previewRssFeed,
        onRefresh = {},
        onEdit = {},
        onRemove = {}
      )
    }
  }
}
