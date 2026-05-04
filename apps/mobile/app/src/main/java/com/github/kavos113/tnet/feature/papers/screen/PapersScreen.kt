package com.github.kavos113.tnet.feature.papers.screen

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.github.kavos113.tnet.feature.papers.model.PaperAiOutput
import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PaperPdfPathState
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.feature.papers.model.resolvePaperPdfPath
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
fun PapersScreen(
  modifier: Modifier = Modifier,
  viewModel: PapersViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  PapersScreenContent(
    uiState = uiState,
    onPaperSelected = viewModel::selectPaper,
    onBack = viewModel::closeDetail,
    modifier = modifier
  )
}

@Composable
private fun PapersScreenContent(
  uiState: PapersUiState,
  onPaperSelected: (PaperListItem) -> Unit,
  onBack: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Papers",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Read-only papers from a synced desktop workspace.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    PapersWorkspaceStatus(
      workspaceUri = uiState.workspaceUri,
      validation = uiState.validation
    )
    if (uiState.selectedPaperId == null) {
      PapersListPreview(
        papers = uiState.papers,
        onPaperSelected = onPaperSelected
      )
    } else {
      PaperDetailPreview(
        paper = uiState.selectedPaper,
        onBack = onBack
      )
    }
  }
}

@Composable
private fun PapersWorkspaceStatus(
  workspaceUri: String?,
  validation: PapersWorkspaceValidation?
) {
  TnetPanel {
    Column(
      verticalArrangement = Arrangement.spacedBy(TnetSpace2)
    ) {
      Text(
        text = "Workspace",
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = workspaceUri ?: "Select a Papers workspace in Settings.",
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
      val status = when (validation) {
        null -> if (workspaceUri == null) "Not configured" else "Checking workspace..."
        is PapersWorkspaceValidation.Valid -> "Ready: ${validation.databaseUri}"
        is PapersWorkspaceValidation.Invalid -> validation.reason
      }
      val statusColor = when (validation) {
        is PapersWorkspaceValidation.Valid -> TnetPrimary
        is PapersWorkspaceValidation.Invalid -> MaterialTheme.colorScheme.error
        null -> TnetTextMuted
      }
      Text(
        text = status,
        style = MaterialTheme.typography.bodyMedium,
        color = statusColor
      )
    }
  }
}

@Composable
private fun PapersListPreview(
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

@Composable
private fun PaperDetailPreview(
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

private val previewPaperListItem = PaperListItem(
  id = "paper-preview",
  title = "Component previews for read-only research tools",
  publishedYear = 2026,
  venue = "Mobile Systems Notes",
  pdfPath = "papers/previews.pdf"
)

private val previewPaperDetail = PaperDetail(
  id = "paper-preview",
  title = "Component previews for read-only research tools",
  abstract = "A sample paper used to preview smaller Papers UI components.",
  publishedYear = 2026,
  venue = "Mobile Systems Notes",
  doi = "10.0000/example",
  arxivId = "2605.00001",
  url = "https://example.com/papers/preview",
  pdfPath = "papers/previews.pdf",
  directoryPath = "papers",
  authors = listOf("Ada Lovelace", "Grace Hopper"),
  tags = listOf("Android", "Preview"),
  note = "This note is read-only on mobile.",
  aiOutputs = listOf(
    PaperAiOutput(
      operation = "summary",
      inputMode = "abstract",
      targetLanguage = "ja",
      provider = "local",
      model = "sample",
      content = "Sample summary for preview."
    )
  )
)

@Preview(showBackground = true)
@Composable
private fun PapersWorkspaceStatusPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PapersWorkspaceStatus(
        workspaceUri = "content://workspace/root",
        validation = PapersWorkspaceValidation.Valid(
          databaseUri = Uri.parse("content://workspace/root/.tnet/papers/papers.db")
        )
      )
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

@Preview(showBackground = true)
@Composable
private fun PapersScreenContentPreview() {
  TnetTheme {
    PapersScreenContent(
      uiState = PapersUiState(
        workspaceUri = "content://workspace/root",
        papers = Result.success(
          listOf(
            previewPaperListItem,
            previewPaperListItem.copy(
              id = "paper-2",
              title = "SQLite workspace sharing on Android",
              publishedYear = 2025,
              venue = "Local-first Workshop",
              pdfPath = null
            )
          )
        )
      ),
      onPaperSelected = {},
      onBack = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun PaperDetailScreenPreview() {
  TnetTheme {
    PapersScreenContent(
      uiState = PapersUiState(
        workspaceUri = "content://workspace/root",
        selectedPaperId = "paper-preview",
        selectedPaper = Result.success(previewPaperDetail)
      ),
      onPaperSelected = {},
      onBack = {}
    )
  }
}
