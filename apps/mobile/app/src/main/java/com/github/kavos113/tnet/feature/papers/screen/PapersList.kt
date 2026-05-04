package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersListPreview(
  papers: Result<List<PaperListItem>>?,
  onPaperSelected: (PaperListItem) -> Unit,
  modifier: Modifier = Modifier
) {
  when {
    papers == null -> return
    papers.isFailure -> Text(
      text = papers.exceptionOrNull()?.message ?: "Unable to read papers.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.error
    )

    else -> {
      val items = papers.getOrDefault(emptyList())
      if (items.isEmpty()) {
        Text(
          text = "No papers found.",
          style = MaterialTheme.typography.bodyMedium,
          color = TnetTextMuted
        )
      } else {
        LazyColumn(
          modifier = modifier.fillMaxWidth(),
          verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
          item {
            PapersTableHeader()
          }
          items(items, key = { it.id }) { paper ->
            PaperRow(
              paper = paper,
              onClick = { onPaperSelected(paper) }
            )
          }
        }
      }
    }
  }
}

@Composable
private fun PapersTableHeader() {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .background(TnetSurface)
      .border(BorderStroke(0.5.dp, TnetBorder))
      .padding(horizontal = TnetSpace2, vertical = TnetSpace1),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Text(text = "Title", style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(1f))
    Text(text = "Year", style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(0.24f))
    Text(text = "Venue", style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(0.58f))
  }
}

@Composable
private fun PaperRow(
  paper: PaperListItem,
  onClick: () -> Unit
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .heightIn(min = 34.dp)
      .background(MaterialTheme.colorScheme.surface)
      .border(BorderStroke(0.5.dp, TnetBorder))
      .clickable(onClick = onClick)
      .padding(horizontal = TnetSpace2, vertical = TnetSpace1),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
      Text(
        text = paper.title,
        style = MaterialTheme.typography.bodyMedium,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
      )
      paper.pdfPath?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis
        )
      }
    }
    Text(
      text = paper.publishedYear?.toString() ?: "-",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted,
      maxLines = 1,
      modifier = Modifier.weight(0.24f)
    )
    Text(
      text = paper.venue ?: "-",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis,
      modifier = Modifier.weight(0.58f)
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun PaperRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PaperRow(
        paper = previewPaperListItem,
        onClick = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PapersListPreviewComponentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PapersListPreview(
        papers = Result.success(
          listOf(
            previewPaperListItem,
            previewPaperListItem.copy(
              id = "paper-no-pdf",
              title = "SQLite-only metadata mode",
              pdfPath = null
            )
          )
        ),
        onPaperSelected = {}
      )
    }
  }
}
