package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersScreenContent(
  uiState: PapersUiState,
  onPaperSelected: (PaperListItem) -> Unit,
  onBack: () -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onDirectoryFilterChange: (String) -> Unit,
  onSortModeChange: (PapersSortMode) -> Unit,
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
      databaseUri = uiState.databaseUri,
      isSqliteOnlyMode = uiState.isSqliteOnlyMode,
      validation = uiState.validation
    )
    if (uiState.selectedPaperId == null) {
      PapersFilterBar(
        uiState = uiState,
        onSearchQueryChange = onSearchQueryChange,
        onDirectoryFilterChange = onDirectoryFilterChange,
        onSortModeChange = onSortModeChange
      )
      PapersListPreview(
        papers = uiState.visiblePapers,
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
      onBack = {},
      onSearchQueryChange = {},
      onDirectoryFilterChange = {},
      onSortModeChange = {}
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
      onBack = {},
      onSearchQueryChange = {},
      onDirectoryFilterChange = {},
      onSortModeChange = {}
    )
  }
}
