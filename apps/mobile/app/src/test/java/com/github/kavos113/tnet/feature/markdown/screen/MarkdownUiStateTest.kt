package com.github.kavos113.tnet.feature.markdown.screen

import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import org.junit.Assert.assertEquals
import org.junit.Test

class MarkdownUiStateTest {
  @Test
  fun derivesOutlineAndSearchMatches() {
    val state = MarkdownUiState(
      blocks = listOf(
        MarkdownBlock.Heading(level = 1, text = "Mobile Plan"),
        MarkdownBlock.Paragraph("Read-only viewer state")
      ),
      fileTree = listOf(
        WorkspaceFileItem(
          name = "mobile.md",
          relativePath = "docs/mobile.md",
          documentUri = "content://workspace/docs/mobile.md",
          isDirectory = false
        )
      ),
      searchQuery = "viewer"
    )

    assertEquals(listOf("docs/mobile.md"), state.fileTreeEntries)
    assertEquals(listOf("Mobile Plan"), state.outline)
    assertEquals(1, state.searchMatches)
  }
}
