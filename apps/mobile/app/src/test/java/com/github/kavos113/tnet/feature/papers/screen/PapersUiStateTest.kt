package com.github.kavos113.tnet.feature.papers.screen

import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import org.junit.Assert.assertEquals
import org.junit.Test

class PapersUiStateTest {
  @Test
  fun visiblePapersFiltersAndSortsList() {
    val state = PapersUiState(
      papers = Result.success(
        listOf(
          PaperListItem(id = "old", title = "Desktop Sync", publishedYear = 2024, venue = "Workshop", pdfPath = "papers/sync.pdf"),
          PaperListItem(id = "new", title = "Android SQLite", publishedYear = 2026, venue = "Notes", pdfPath = "papers/sqlite.pdf")
        )
      ),
      searchQuery = "sqlite",
      sortMode = PapersSortMode.Year
    )

    assertEquals(listOf("new"), state.visiblePapers?.getOrThrow()?.map { it.id })
  }
}
