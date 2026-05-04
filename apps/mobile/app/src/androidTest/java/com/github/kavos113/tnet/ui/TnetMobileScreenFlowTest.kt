package com.github.kavos113.tnet.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.github.kavos113.tnet.ui.theme.TnetTheme
import org.junit.Rule
import org.junit.Test

class TnetMobileScreenFlowTest {
  @get:Rule
  val composeRule = createComposeRule()

  @Test
  fun navigatesBetweenTopLevelScreens() {
    composeRule.setContent {
      TnetTheme {
        TnetMobileApp()
      }
    }

    composeRule.onNodeWithText("RSS").performClick()
    composeRule.onNodeWithText("Feeds").assertExists()
    composeRule.onNodeWithText("Papers").performClick()
    composeRule.onNodeWithText("Read-only papers from a synced desktop workspace.").assertExists()
  }
}
