package com.github.kavos113.tnet.feature.papers.screen

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
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersListPreview(
  papers: Result<List<PaperListItem>>?,
  onPaperSelected: (PaperListItem) -> Unit
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
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
          items.forEach { paper ->
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
private fun PaperRow(
  paper: PaperListItem,
  onClick: () -> Unit
) {
  TnetListRow(onClick = onClick) {
    Column(
      verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      Text(
        text = paper.title,
        style = MaterialTheme.typography.titleMedium
      )
      val details = listOfNotNull(
        paper.publishedYear?.toString(),
        paper.venue,
        paper.pdfPath?.let { "PDF" }
      )
      if (details.isNotEmpty()) {
        Text(
          text = details.joinToString(" - "),
          style = MaterialTheme.typography.bodyMedium,
          color = TnetTextMuted
        )
      }
    }
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
