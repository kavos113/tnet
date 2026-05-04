package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssItemList(
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
            text = if (item.isRead) item.title else "Unread - ${item.title}",
            style = MaterialTheme.typography.bodyLarge,
            color = if (item.isRead) TnetTextMuted else MaterialTheme.colorScheme.onSurface
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
internal fun RssItemDetail(
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
private fun RssItemListPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemList(
        selectedFeedTitle = "Mobile Android",
        items = previewRssItems,
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
        item = previewRssItems.first(),
        onBack = {}
      )
    }
  }
}
