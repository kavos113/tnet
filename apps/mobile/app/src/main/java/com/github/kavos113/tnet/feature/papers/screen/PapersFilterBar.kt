package com.github.kavos113.tnet.feature.papers.screen

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersFilterBar(
  uiState: PapersUiState,
  onSearchQueryChange: (String) -> Unit,
  onDirectoryFilterChange: (String) -> Unit,
  onSortModeChange: (PapersSortMode) -> Unit
) {
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetCompactTextField(
        value = uiState.searchQuery,
        onValueChange = onSearchQueryChange,
        label = "Search"
      )
      TnetCompactTextField(
        value = uiState.directoryFilter,
        onValueChange = onDirectoryFilterChange,
        label = "Directory"
      )
      Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
        PapersSortMode.entries.forEach { mode ->
          TnetSecondaryButton(
            text = mode.name,
            onClick = { onSortModeChange(mode) },
            selected = uiState.sortMode == mode
          )
        }
      }
      Text(
        text = "FTS search uses the same search input when the synced database exposes paper_search.",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
  }
}

@Composable
internal fun PapersWorkspaceStatus(
  workspaceUri: String?,
  databaseUri: String?,
  isSqliteOnlyMode: Boolean,
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
        text = workspaceUri
          ?: databaseUri
          ?: "Select a Papers workspace or SQLite file in Settings.",
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
      val status = when (validation) {
        null -> when {
          isSqliteOnlyMode -> "SQLite-only mode: metadata is available, workspace PDFs are unavailable."
          workspaceUri == null -> "Not configured"
          else -> "Checking workspace..."
        }
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

@Preview(showBackground = true)
@Composable
private fun PapersWorkspaceStatusPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PapersWorkspaceStatus(
        workspaceUri = "content://workspace/root",
        databaseUri = null,
        isSqliteOnlyMode = false,
        validation = PapersWorkspaceValidation.Valid(
          databaseUri = Uri.parse("content://workspace/root/.tnet/papers/papers.db")
        )
      )
    }
  }
}
