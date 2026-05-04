package com.github.kavos113.tnet.feature.markdown.screen

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetWorkspaceFileTree

@Composable
internal fun WorkspaceFileTree(
  items: List<WorkspaceFileItem>,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  TnetWorkspaceFileTree(
    items = items,
    selectedPath = selectedPath,
    expandedPaths = expandedPaths,
    loadingDirectoryPaths = loadingDirectoryPaths,
    emptyDirectoryText = "No Markdown files.",
    onOpenFile = onOpenFile,
    onToggleDirectory = onToggleDirectory,
    modifier = modifier
  )
}
