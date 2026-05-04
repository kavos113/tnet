package com.github.kavos113.tnet.core.workspace

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WorkspaceModelTest {
  @Test
  fun normalizeWorkspaceRelativePathRejectsTraversal() {
    assertTrue(normalizeWorkspaceRelativePath("../outside.md").isFailure)
    assertTrue(normalizeWorkspaceRelativePath("docs/../outside.md").isFailure)
  }

  @Test
  fun normalizeWorkspaceRelativePathUsesSlashSeparatedRelativePath() {
    assertEquals("docs/file.md", normalizeWorkspaceRelativePath("/docs\\file.md").getOrThrow())
  }

  @Test
  fun findWorkspaceFileSearchesNestedTree() {
    val file = WorkspaceFileItem(
      name = "note.md",
      relativePath = "docs/note.md",
      documentUri = "content://workspace/docs/note.md",
      isDirectory = false
    )
    val tree = listOf(
      WorkspaceFileItem(
        name = "docs",
        relativePath = "docs",
        documentUri = "content://workspace/docs",
        isDirectory = true,
        children = listOf(file)
      )
    )

    assertEquals(file, findWorkspaceFile(tree, "docs/note.md"))
    assertNull(findWorkspaceFile(tree, "docs/missing.md"))
  }
}
