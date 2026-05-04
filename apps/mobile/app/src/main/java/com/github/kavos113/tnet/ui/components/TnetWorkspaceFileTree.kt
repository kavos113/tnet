package com.github.kavos113.tnet.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.theme.TnetSurfaceHover
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
    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
      Text(
        text = title,
        style = MaterialTheme.typography.titleMedium
      )
      items.forEach { item ->
        TnetWorkspaceFileTreeItem(
          item = item,
          depth = 0,
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
  depth: Int,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  alwaysExpanded: Boolean,
  emptyDirectoryText: String,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: ((WorkspaceFileItem) -> Unit)?
) {
  Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
    if (item.isDirectory) {
      val isExpanded = alwaysExpanded || item.relativePath in expandedPaths
      TnetWorkspaceTreeRow(
        name = item.name,
        depth = depth,
        selected = false,
        icon = if (isExpanded) Icons.Rounded.FolderOpen else Icons.Rounded.Folder,
        leadingIcon = if (isExpanded) Icons.Rounded.KeyboardArrowDown else Icons.AutoMirrored.Rounded.KeyboardArrowRight,
        onClick = if (alwaysExpanded || onToggleDirectory == null) null else {
          { onToggleDirectory(item) }
        }
      )
      if (isExpanded) {
        if (item.relativePath in loadingDirectoryPaths) {
          Text(
            text = "Loading...",
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = ((depth + 1) * 10).dp)
          )
        } else if (item.isChildrenLoaded && item.children.isEmpty()) {
          Text(
            text = emptyDirectoryText,
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = ((depth + 1) * 10).dp)
          )
        }
        item.children.forEach { child ->
          TnetWorkspaceFileTreeItem(
            item = child,
            depth = depth + 1,
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
      TnetWorkspaceTreeRow(
        name = item.name,
        depth = depth,
        selected = selectedPath == item.relativePath,
        icon = Icons.Rounded.Description,
        leadingIcon = null,
        onClick = { onOpenFile(item) }
      )
    }
  }
}

@Composable
private fun TnetWorkspaceTreeRow(
  name: String,
  depth: Int,
  selected: Boolean,
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  leadingIcon: androidx.compose.ui.graphics.vector.ImageVector?,
  onClick: (() -> Unit)?
) {
  val rowModifier = Modifier
    .fillMaxWidth()
    .padding(start = (depth * 10).dp)
    .background(if (selected) TnetSurfaceHover else Color.Transparent)
    .let { modifier ->
      if (onClick == null) modifier else modifier.clickable(onClick = onClick)
    }

  Row(
    modifier = rowModifier
      .padding(horizontal = 2.dp, vertical = 2.dp),
    horizontalArrangement = Arrangement.spacedBy(2.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    if (leadingIcon == null) {
      Icon(
        imageVector = Icons.AutoMirrored.Rounded.KeyboardArrowRight,
        contentDescription = null,
        tint = TnetTextMuted.copy(alpha = 0f),
        modifier = Modifier.size(16.dp)
      )
    } else {
      Icon(
        imageVector = leadingIcon,
        contentDescription = null,
        tint = TnetTextMuted,
        modifier = Modifier.size(16.dp)
      )
    }
    Icon(
      imageVector = icon,
      contentDescription = null,
      tint = TnetTextMuted,
      modifier = Modifier.size(16.dp)
    )
    Text(
      text = name,
      style = MaterialTheme.typography.bodySmall,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis
    )
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


@Preview(showBackground = true)
@Composable
private fun TnetWorkspaceTreeRowPreview() {
  TnetTheme {
    TnetWorkspaceTreeRow(
      name = "mobile.md",
      depth = 2,
      selected = true,
      icon = Icons.Rounded.Description,
      leadingIcon = null,
      onClick = {}
    )
  }
}
