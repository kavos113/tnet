package com.github.kavos113.tnet.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class TnetMobileViewModelTest {
  @Test
  fun selectDestinationUpdatesCurrentDestination() {
    val viewModel = TnetMobileViewModel()

    viewModel.selectDestination(TnetMobileDestination.Rss)

    assertEquals(TnetMobileDestination.Rss, viewModel.uiState.value.selectedDestination)
  }
}
