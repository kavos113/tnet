package com.github.kavos113.tnet.feature.pdf.screen

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PdfUiStateTest {
  @Test
  fun exposesPageNavigationAvailability() {
    val middlePage = PdfUiState(pageIndex = 1, pageCount = 3)

    assertTrue(middlePage.canGoToPreviousPage)
    assertTrue(middlePage.canGoToNextPage)
  }

  @Test
  fun disablesUnavailablePageNavigation() {
    val firstPage = PdfUiState(pageIndex = 0, pageCount = 1)

    assertFalse(firstPage.canGoToPreviousPage)
    assertFalse(firstPage.canGoToNextPage)
  }
}
