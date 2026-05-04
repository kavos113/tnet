package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperPdfPathState
import com.github.kavos113.tnet.feature.papers.model.resolvePaperPdfPath
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PaperDetailPreview(
  paper: Result<PaperDetail?>?,
  onBack: () -> Unit
) {
  TnetSecondaryButton(text = "Back to list", onClick = onBack)

  when {
    paper == null -> Text(
      text = "Loading paper...",
      style = MaterialTheme.typography.bodyMedium,
      color = TnetTextMuted
    )

    paper.isFailure -> Text(
      text = paper.exceptionOrNull()?.message ?: "Unable to read paper.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.error
    )

    paper.getOrNull() == null -> Text(
      text = "Paper not found.",
      style = MaterialTheme.typography.bodyMedium,
      color = TnetTextMuted
    )

    else -> PaperDetailCard(requireNotNull(paper.getOrThrow()))
  }
}

@Composable
private fun PaperDetailCard(paper: PaperDetail) {
  TnetPanel {
    Column(
      modifier = Modifier
        .verticalScroll(rememberScrollState()),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Text(
        text = paper.title,
        style = MaterialTheme.typography.titleLarge
      )
      DetailLine("Authors", paper.authors.joinToString(", "))
      DetailLine("Tags", paper.tags.joinToString(", "))
      DetailLine("Year", paper.publishedYear?.toString())
      DetailLine("Venue", paper.venue)
      DetailLine("DOI", paper.doi)
      DetailLine("arXiv", paper.arxivId)
      DetailLine("URL", paper.url)
      DetailLine("Directory", paper.directoryPath.ifBlank { null })
      PaperPdfPathLine(resolvePaperPdfPath(paper.pdfPath))
      DetailSection("Abstract", paper.abstract)
      DetailSection("Note", paper.note)
      if (paper.aiOutputs.isNotEmpty()) {
        Text(
          text = "AI outputs",
          style = MaterialTheme.typography.titleMedium
        )
        paper.aiOutputs.forEach { output ->
          DetailSection(
            title = "${output.operation} / ${output.model}",
            body = output.content
          )
        }
      }
    }
  }
}

@Composable
private fun PaperPdfPathLine(state: PaperPdfPathState) {
  val text = when (state) {
    is PaperPdfPathState.Available -> "PDF: ${state.relativePath}"
    PaperPdfPathState.Missing -> "PDF: Unavailable in SQLite-only mode."
    is PaperPdfPathState.Rejected -> "PDF: ${state.reason}"
  }
  val color = when (state) {
    is PaperPdfPathState.Rejected -> MaterialTheme.colorScheme.error
    else -> TnetTextMuted
  }
  Text(
    text = text,
    style = MaterialTheme.typography.bodyMedium,
    color = color
  )
}

@Composable
private fun DetailLine(
  label: String,
  value: String?
) {
  if (value.isNullOrBlank()) return
  Text(
    text = "$label: $value",
    style = MaterialTheme.typography.bodyMedium,
    color = TnetTextMuted
  )
}

@Composable
private fun DetailSection(
  title: String,
  body: String?
) {
  if (body.isNullOrBlank()) return
  Text(
    text = title,
    style = MaterialTheme.typography.titleMedium
  )
  Text(
    text = body,
    style = MaterialTheme.typography.bodyMedium
  )
}

@Preview(showBackground = true)
@Composable
private fun PaperDetailCardPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PaperDetailCard(previewPaperDetail)
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PaperPdfPathLinePreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        PaperPdfPathLine(PaperPdfPathState.Available("papers/previews.pdf"))
        PaperPdfPathLine(PaperPdfPathState.Missing)
        PaperPdfPathLine(PaperPdfPathState.Rejected("PDF path escapes the selected workspace."))
      }
    }
  }
}
