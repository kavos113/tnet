package com.github.kavos113.tnet.ui

import android.app.Application
import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test

class SettingsViewModelInstrumentedTest {
  @Test
  fun selectDatabaseUpdatesUiState() {
    val application = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as Application
    val viewModel = SettingsViewModel(application)
    val uri = Uri.parse("content://papers/papers.db")

    viewModel.selectDatabase(uri)

    assertEquals(uri.toString(), viewModel.uiState.value.selectedDatabaseUri)
  }
}
