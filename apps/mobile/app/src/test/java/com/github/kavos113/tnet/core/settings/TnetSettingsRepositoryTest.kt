package com.github.kavos113.tnet.core.settings

import org.junit.Assert.assertEquals
import org.junit.Test

class TnetSettingsRepositoryTest {
  @Test
  fun selectActiveMarkdownPathPrefersSingleActiveFile() {
    assertEquals(
      "docs/current.md",
      selectActiveMarkdownPath(
        activePath = "docs/current.md",
        legacyOpenedFiles = listOf("docs/old.md")
      )
    )
  }

  @Test
  fun selectActiveMarkdownPathFallsBackToLegacyFirstOpenedFile() {
    assertEquals(
      "docs/old.md",
      selectActiveMarkdownPath(
        activePath = null,
        legacyOpenedFiles = listOf("docs/old.md", "docs/older.md")
      )
    )
  }
}
