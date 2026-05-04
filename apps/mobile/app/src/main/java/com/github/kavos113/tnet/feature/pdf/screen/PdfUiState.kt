package com.github.kavos113.tnet.feature.pdf.screen

import android.graphics.Bitmap
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.core.workspace.WorkspaceRoot

data class PdfUiState(
  val workspaceRoots: List<WorkspaceRoot> = emptyList(),
  val activeWorkspace: WorkspaceRoot? = null,
  val fileTree: List<WorkspaceFileItem> = emptyList(),
  val openedFiles: List<String> = emptyList(),
  val activeIndex: Int = -1,
  val selectedPath: String? = null,
  val selectedUri: String? = null,
  val pageBitmap: Bitmap? = null,
  val pageIndex: Int = 0,
  val pageCount: Int = 0,
  val zoom: Float = 1f,
  val rotation: Int = 0,
  val scrollOffset: Int = 0,
  val error: String? = null,
  val isLoading: Boolean = false
) {
  val canGoToPreviousPage: Boolean = pageIndex > 0 && !isLoading
  val canGoToNextPage: Boolean = pageIndex + 1 < pageCount && !isLoading
}
