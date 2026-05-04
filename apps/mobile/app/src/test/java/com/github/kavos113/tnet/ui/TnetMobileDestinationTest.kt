package com.github.kavos113.tnet.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TnetMobileDestinationTest {
  @Test
  fun primaryDestinationsKeepExpectedOrder() {
    val labels = TnetMobileDestination.primaryDestinations.map { it.label }

    assertEquals(listOf("Tasks", "RSS", "Markdown", "PDF", "Papers", "Settings"), labels)
  }

  @Test
  fun primaryDestinationsHaveReadableCopy() {
    TnetMobileDestination.primaryDestinations.forEach { destination ->
      assertTrue(destination.headline.isNotBlank())
      assertTrue(destination.supportingText.isNotBlank())
    }
  }
}
