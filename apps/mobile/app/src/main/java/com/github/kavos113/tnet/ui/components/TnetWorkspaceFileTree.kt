package com.github.kavos113.tnet.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
fun TnetWorkspaceFileTree(
  items: List<WorkspaceFileItem>,
  selectedPath: String?,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier,
  title: String = "Workspace files",
  expandedPaths: Set<String> = emptySet(),
  loadingDirectoryPaths: Set<String> = emptySet(),
  alwaysExpanded: Boolean = false,
  emptyDirectoryText: String = "No files.",
  onToggleDirectory: ((WorkspaceFileItem) -> Unit)? = null
) {
  if (items.isEmpty()) return
  TnetPanel(modifier = modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text(
        text = title,
        style = MaterialTheme.typography.titleMedium
      )
      items.forEach { item ->
        TnetWorkspaceFileTreeItem(
          item = item,
          selectedPath = selectedPath,
          expandedPaths = expandedPaths,
          loadingDirectoryPaths = loadingDirectoryPaths,
          alwaysExpanded = alwaysExpanded,
          emptyDirectoryText = emptyDirectoryText,
          onOpenFile = onOpenFile,
          onToggleDirectory = onToggleDirectory
        )
      }
    }
  }
}

@Composable
private fun TnetWorkspaceFileTreeItem(
  item: WorkspaceFileItem,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  alwaysExpanded: Boolean,
  emptyDirectoryText: String,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: ((WorkspaceFileItem) -> Unit)?
) {
  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
    if (item.isDirectory) {
      val isExpanded = alwaysExpanded || item.relativePath in expandedPaths
      if (alwaysExpanded || onToggleDirectory == null) {
        Text(
          text = item.relativePath,
          style = MaterialTheme.typography.labelSmall,
          color = TnetTextMuted
        )
      } else {
        TnetSecondaryButton(
          text = "${if (isExpanded) "v" else ">"} ${item.name}",
          onClick = { onToggleDirectory(item) },
          modifier = Modifier.fillMaxWidth()
        )
      }
      if (isExpanded) {
        if (item.relativePath in loadingDirectoryPaths) {
          Text(
            text = "Loading...",
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = TnetSpace3)
          )
        } else if (item.isChildrenLoaded && item.children.isEmpty()) {
          Text(
            text = emptyDirectoryText,
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = TnetSpace3)
          )
        }
        item.children.forEach { child ->
          TnetWorkspaceFileTreeItem(
            item = child,
            selectedPath = selectedPath,
            expandedPaths = expandedPaths,
            loadingDirectoryPaths = loadingDirectoryPaths,
            alwaysExpanded = alwaysExpanded,
            emptyDirectoryText = emptyDirectoryText,
            onOpenFile = onOpenFile,
            onToggleDirectory = onToggleDirectory
          )
        }
      }
    } else {
      TnetSecondaryButton(
        text = item.relativePath,
        selected = selectedPath == item.relativePath,
        onClick = { onOpenFile(item) },
        modifier = Modifier.fillMaxWidth()
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TnetWorkspaceFileTreePreview() {
  TnetTheme {
    TnetWorkspaceFileTree(
      items = listOf(
        WorkspaceFileItem(
          name = "docs",
          relativePath = "docs",
          documentUri = "content://workspace/docs",
          isDirectory = true,
          children = listOf(
            WorkspaceFileItem(
              name = "mobile.md",
              relativePath = "docs/mobile.md",
              documentUri = "content://workspace/docs/mobile.md",
              isDirectory = false
            )
          ),
          isChildrenLoaded = true
        )
      ),
      selectedPath = "docs/mobile.md",
      expandedPaths = setOf("docs"),
      onOpenFile = {},
      onToggleDirectory = {},
      modifier = Modifier.padding(16.dp)
    )
  }
}
