package com.github.kavos113.tnet.feature.markdown.screen

import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
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
      recentUris = listOf("content://workspace/docs/mobile.md"),
      searchQuery = "viewer"
    )

    assertEquals(listOf("mobile.md"), state.fileTreeEntries)
    assertEquals(listOf("Mobile Plan"), state.outline)
    assertEquals(1, state.searchMatches)
  }
}
