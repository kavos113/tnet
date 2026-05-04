package com.github.kavos113.tnet.feature.papers.screen

import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation

data class PapersUiState(
  val workspaceUri: String? = null,
  val databaseUri: String? = null,
  val isSqliteOnlyMode: Boolean = false,
  val validation: PapersWorkspaceValidation? = null,
  val papers: Result<List<PaperListItem>>? = null,
  val searchQuery: String = "",
  val tagFilter: String = "",
  val directoryFilter: String = "",
  val sortMode: PapersSortMode = PapersSortMode.Updated,
  val selectedPaperId: String? = null,
  val selectedPaper: Result<PaperDetail?>? = null
) {
  val visiblePapers: Result<List<PaperListItem>>? = papers?.map { items ->
    items
      .filter { paper ->
        val query = searchQuery.trim()
        query.isBlank() ||
          paper.title.contains(query, ignoreCase = true) ||
          paper.venue.orEmpty().contains(query, ignoreCase = true) ||
          paper.pdfPath.orEmpty().contains(query, ignoreCase = true)
      }
      .filter { paper ->
        directoryFilter.isBlank() || paper.pdfPath.orEmpty().contains(directoryFilter, ignoreCase = true)
      }
      .sortedWith(
        when (sortMode) {
          PapersSortMode.Updated -> compareBy<PaperListItem> { it.title.lowercase() }
          PapersSortMode.Title -> compareBy { it.title.lowercase() }
          PapersSortMode.Year -> compareByDescending<PaperListItem> { it.publishedYear ?: 0 }
        }
      )
  }
}

enum class PapersSortMode {
  Updated,
  Title,
  Year
}
