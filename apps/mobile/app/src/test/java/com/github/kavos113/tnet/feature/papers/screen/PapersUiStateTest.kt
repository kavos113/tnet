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
          PaperListItem(
            id = "old",
            title = "Desktop Sync",
            publishedYear = 2024,
            venue = "Workshop",
            pdfPath = "papers/sync.pdf",
            directoryPath = "papers"
          ),
          PaperListItem(
            id = "new",
            title = "Android SQLite",
            publishedYear = 2026,
            venue = "Notes",
            pdfPath = "sqlite/sqlite.pdf",
            directoryPath = "sqlite"
          )
        )
      ),
      searchQuery = "sqlite",
      sortMode = PapersSortMode.Year
    )

    assertEquals(listOf("new"), state.visiblePapers?.getOrThrow()?.map { it.id })
  }

  @Test
  fun visiblePapersFiltersBySelectedDirectoryPath() {
    val state = PapersUiState(
      papers = Result.success(
        listOf(
          PaperListItem(
            id = "logic",
            title = "Logic",
            publishedYear = 2025,
            venue = null,
            pdfPath = "logic/paper.pdf",
            directoryPath = "logic"
          ),
          PaperListItem(
            id = "systems",
            title = "Systems",
            publishedYear = 2026,
            venue = null,
            pdfPath = "systems/paper.pdf",
            directoryPath = "systems"
          )
        )
      ),
      selectedDirectoryPath = "logic"
    )

    assertEquals(listOf("logic"), state.visiblePapers?.getOrThrow()?.map { it.id })
  }
}
