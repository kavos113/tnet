package com.github.kavos113.tnet.feature.papers.screen

import android.graphics.Bitmap
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
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
  val selectedPaper: Result<PaperDetail?>? = null,
  val fileTree: List<WorkspaceFileItem> = emptyList(),
  val selectedDirectoryPath: String? = null,
  val isWorkspaceLoading: Boolean = false,
  val isDrawerOpen: Boolean = false,
  val expandedPaths: Set<String> = emptySet(),
  val loadingDirectoryPaths: Set<String> = emptySet(),
  val detailTab: PapersDetailTab = PapersDetailTab.Metadata,
  val selectedPdfUri: String? = null,
  val pageBitmap: Bitmap? = null,
  val pageIndex: Int = 0,
  val pageCount: Int = 0,
  val zoom: Float = 1f,
  val rotation: Int = 0,
  val isPdfLoading: Boolean = false,
  val pdfError: String? = null
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
        val selectedDirectory = selectedDirectoryPath?.trim().orEmpty()
        when {
          selectedDirectory.isNotBlank() -> paper.directoryPath == selectedDirectory
          directoryFilter.isBlank() -> true
          else -> paper.directoryPath.contains(directoryFilter, ignoreCase = true) ||
            paper.pdfPath.orEmpty().contains(directoryFilter, ignoreCase = true)
        }
      }
      .sortedWith(
        when (sortMode) {
          PapersSortMode.Updated -> compareBy<PaperListItem> { it.title.lowercase() }
          PapersSortMode.Title -> compareBy { it.title.lowercase() }
          PapersSortMode.Year -> compareByDescending<PaperListItem> { it.publishedYear ?: 0 }
        }
      )
  }
  val isDetailPanelOpen: Boolean = selectedPaperId != null
  val canGoToPreviousPage: Boolean = pageIndex > 0 && !isPdfLoading
  val canGoToNextPage: Boolean = pageIndex + 1 < pageCount && !isPdfLoading
}

enum class PapersSortMode {
  Updated,
  Title,
  Year
}

enum class PapersDetailTab {
  Pdf,
  Metadata
}
