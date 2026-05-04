package com.github.kavos113.tnet.feature.papers.screen

import android.app.Application
import androidx.test.platform.app.InstrumentationRegistry
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import org.junit.Assert.assertEquals
import org.junit.Test

class PapersViewModelInstrumentedTest {
  @Test
  fun searchQueryFiltersVisiblePapers() {
    val application = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as Application
    val viewModel = PapersViewModel(application)
    viewModel.replacePapersForTest(
      listOf(
        PaperListItem(
          id = "paper-1",
          title = "Android SQLite",
          publishedYear = 2026,
          venue = "Notes",
          pdfPath = "papers/a.pdf",
          directoryPath = "papers"
        ),
        PaperListItem(
          id = "paper-2",
          title = "Desktop Sync",
          publishedYear = 2025,
          venue = "Notes",
          pdfPath = "papers/b.pdf",
          directoryPath = "papers"
        )
      )
    )

    viewModel.updateSearchQuery("sqlite")

    val visible = viewModel.uiState.value.visiblePapers?.getOrThrow().orEmpty()
    assertEquals(listOf("paper-1"), visible.map { it.id })
  }
}
