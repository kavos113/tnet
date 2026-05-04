package com.github.kavos113.tnet.feature.pdf.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetWorkspaceFileTree

@Composable
internal fun PdfOpenedFiles(
  uiState: PdfUiState,
  onReopenPath: (String) -> Unit
) {
  if (uiState.openedFiles.isEmpty()) return
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace3)) {
      Text(
        text = "Opened files",
        style = MaterialTheme.typography.titleMedium
      )
      uiState.openedFiles.forEach { path ->
        TnetSecondaryButton(
          text = path.substringAfterLast('/'),
          selected = path == uiState.selectedPath,
          onClick = { onReopenPath(path) }
        )
      }
    }
  }
}

@Composable
internal fun PdfWorkspaceFileTree(
  items: List<WorkspaceFileItem>,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit
) {
  TnetWorkspaceFileTree(
    items = items,
    selectedPath = selectedPath,
    expandedPaths = expandedPaths,
    loadingDirectoryPaths = loadingDirectoryPaths,
    emptyDirectoryText = "No PDF files.",
    onOpenFile = onOpenFile,
    onToggleDirectory = onToggleDirectory
  )
}
