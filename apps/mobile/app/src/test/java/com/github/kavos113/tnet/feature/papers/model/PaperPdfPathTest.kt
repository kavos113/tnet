package com.github.kavos113.tnet.feature.papers.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PaperPdfPathTest {
  @Test
  fun resolvesWorkspaceRelativePdfPath() {
    assertEquals(
      PaperPdfPathState.Available("papers/sample.pdf"),
      resolvePaperPdfPath("/papers/sample.pdf")
    )
  }

  @Test
  fun reportsMissingPdfPath() {
    assertEquals(PaperPdfPathState.Missing, resolvePaperPdfPath(null))
    assertEquals(PaperPdfPathState.Missing, resolvePaperPdfPath(" "))
  }

  @Test
  fun rejectsPathTraversal() {
    val state = resolvePaperPdfPath("../outside.pdf")

    assertTrue(state is PaperPdfPathState.Rejected)
  }
}
