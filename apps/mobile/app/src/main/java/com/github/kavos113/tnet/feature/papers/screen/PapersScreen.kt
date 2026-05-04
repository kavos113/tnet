package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation

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
      .padding(horizontal = 20.dp, vertical = 18.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    Text(
      text = "Papers",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Read-only papers from a synced desktop workspace.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
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
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Text(
        text = "Workspace",
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = workspaceUri ?: "Select a Papers workspace in Settings.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      val status = when (validation) {
        null -> if (workspaceUri == null) "Not configured" else "Checking workspace..."
        is PapersWorkspaceValidation.Valid -> "Ready: ${validation.databaseUri}"
        is PapersWorkspaceValidation.Invalid -> validation.reason
      }
      val statusColor = when (validation) {
        is PapersWorkspaceValidation.Valid -> MaterialTheme.colorScheme.primary
        is PapersWorkspaceValidation.Invalid -> MaterialTheme.colorScheme.error
        null -> MaterialTheme.colorScheme.onSurfaceVariant
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
          color = MaterialTheme.colorScheme.onSurfaceVariant
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
  Surface(
    modifier = Modifier.fillMaxWidth(),
    onClick = onClick,
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(14.dp),
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
          color = MaterialTheme.colorScheme.onSurfaceVariant
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
  Button(onClick = onBack) {
    Text("Back to list")
  }

  when {
    paper == null -> Text(
      text = "Loading paper...",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )

    paper.isFailure -> Text(
      text = paper.exceptionOrNull()?.message ?: "Unable to read paper.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.error
    )

    paper.getOrNull() == null -> Text(
      text = "Paper not found.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )

    else -> PaperDetailCard(requireNotNull(paper.getOrThrow()))
  }
}

@Composable
private fun PaperDetailCard(paper: PaperDetail) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier
        .padding(14.dp)
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
      DetailLine("PDF", paper.pdfPath ?: "Unavailable")
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
private fun DetailLine(
  label: String,
  value: String?
) {
  if (value.isNullOrBlank()) return
  Text(
    text = "$label: $value",
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.onSurfaceVariant
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
