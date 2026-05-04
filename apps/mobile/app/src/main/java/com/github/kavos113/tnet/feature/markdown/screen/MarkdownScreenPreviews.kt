package com.github.kavos113.tnet.feature.markdown.screen

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.feature.markdown.model.TaskListItem
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Preview(showBackground = true)
@Composable
private fun MarkdownScreenContentPreview() {
  TnetTheme {
    MarkdownScreenContent(
      uiState = MarkdownUiState(
        selectedUri = "content://workspace/docs/mobile-plan.md",
        searchQuery = "viewer",
        blocks = previewMarkdownBlocks
      ),
      onOpenWorkspace = {},
      onOpenFile = {},
      onReopenPath = {},
      onSearchQueryChange = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun MarkdownLoadingPreview() {
  TnetTheme {
    MarkdownScreenContent(
      uiState = MarkdownUiState(
        selectedUri = "content://workspace/loading.md",
        isLoading = true
      ),
      onOpenWorkspace = {},
      onOpenFile = {},
      onReopenPath = {},
      onSearchQueryChange = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {}
    )
  }
}

internal val previewMarkdownBlocks = listOf(
  MarkdownBlock.Heading(level = 1, text = "Mobile Plan"),
  MarkdownBlock.Paragraph("Kotlin + Jetpack Compose read-only viewer."),
  MarkdownBlock.TaskList(
    listOf(
      TaskListItem(text = "Use ViewModel and UiState", checked = true),
      TaskListItem(text = "Render Mermaid with bundled assets", checked = false)
    )
  ),
  MarkdownBlock.Table(
    headers = listOf("Feature", "Status"),
    rows = listOf(
      listOf("Markdown", "Read-only"),
      listOf("Papers", "SQLite workspace")
    )
  ),
  MarkdownBlock.CodeBlock(
    language = "kotlin",
    code = "data class MarkdownUiState(val blocks: List<MarkdownBlock>)"
  ),
  MarkdownBlock.MermaidBlock("graph TD\n  App-->Viewer")
)
