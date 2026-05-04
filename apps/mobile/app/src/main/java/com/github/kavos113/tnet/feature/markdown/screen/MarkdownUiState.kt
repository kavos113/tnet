package com.github.kavos113.tnet.feature.markdown.screen

import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.core.workspace.WorkspaceRoot

data class MarkdownUiState(
  val workspaceRoots: List<WorkspaceRoot> = emptyList(),
  val activeWorkspace: WorkspaceRoot? = null,
  val fileTree: List<WorkspaceFileItem> = emptyList(),
  val openedFiles: List<String> = emptyList(),
  val selectedPath: String? = null,
  val selectedUri: String? = null,
  val blocks: List<MarkdownBlock> = emptyList(),
  val recentUris: List<String> = emptyList(),
  val searchQuery: String = "",
  val viewerPosition: Int = 0,
  val error: String? = null,
  val isLoading: Boolean = false,
  val isWorkspaceLoading: Boolean = false,
  val isDrawerOpen: Boolean = false,
  val expandedPaths: Set<String> = emptySet(),
  val loadingDirectoryPaths: Set<String> = emptySet()
) {
  val fileTreeEntries: List<String> = fileTree.flatMap { it.flattenedNames() }
  val outline: List<String> = blocks.filterIsInstance<MarkdownBlock.Heading>().map { it.text }
  val searchMatches: Int = if (searchQuery.isBlank()) {
    0
  } else {
    blocks.count { block ->
      when (block) {
        is MarkdownBlock.Heading -> block.text.contains(searchQuery, ignoreCase = true)
        is MarkdownBlock.Paragraph -> block.text.contains(searchQuery, ignoreCase = true)
        is MarkdownBlock.BulletList -> block.items.any { it.contains(searchQuery, ignoreCase = true) }
        is MarkdownBlock.TaskList -> block.items.any { it.text.contains(searchQuery, ignoreCase = true) }
        is MarkdownBlock.Table -> block.headers.any { it.contains(searchQuery, ignoreCase = true) } ||
          block.rows.flatten().any { it.contains(searchQuery, ignoreCase = true) }
        is MarkdownBlock.CodeBlock -> block.code.contains(searchQuery, ignoreCase = true)
        is MarkdownBlock.ImageBlock -> block.altText.contains(searchQuery, ignoreCase = true) ||
          block.source.contains(searchQuery, ignoreCase = true)
        is MarkdownBlock.LinkBlock -> block.label.contains(searchQuery, ignoreCase = true) ||
          block.target.contains(searchQuery, ignoreCase = true)
        is MarkdownBlock.MermaidBlock -> block.source.contains(searchQuery, ignoreCase = true)
      }
    }
  }
}

private fun WorkspaceFileItem.flattenedNames(): List<String> {
  return if (isDirectory) {
    children.flatMap { it.flattenedNames() }
  } else {
    listOf(relativePath)
  }
}
