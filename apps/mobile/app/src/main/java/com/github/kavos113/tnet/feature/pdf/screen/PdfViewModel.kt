package com.github.kavos113.tnet.feature.pdf.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.feature.pdf.model.renderPdfPage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PdfViewModel(application: Application) : AndroidViewModel(application) {
  private val mutableUiState = MutableStateFlow(PdfUiState())
  val uiState: StateFlow<PdfUiState> = mutableUiState.asStateFlow()

  fun openPdf(uri: Uri) {
    renderPage(uri = uri, pageIndex = 0, resetViewerState = true)
  }

  fun goToPreviousPage() {
    val state = mutableUiState.value
    val uri = state.selectedUri?.let(Uri::parse) ?: return
    if (!state.canGoToPreviousPage) return
    renderPage(uri = uri, pageIndex = state.pageIndex - 1, resetViewerState = false)
  }

  fun goToNextPage() {
    val state = mutableUiState.value
    val uri = state.selectedUri?.let(Uri::parse) ?: return
    if (!state.canGoToNextPage) return
    renderPage(uri = uri, pageIndex = state.pageIndex + 1, resetViewerState = false)
  }

  fun zoomOut() {
    mutableUiState.update { it.copy(zoom = (it.zoom - 0.25f).coerceAtLeast(0.5f)) }
  }

  fun zoomIn() {
    mutableUiState.update { it.copy(zoom = (it.zoom + 0.25f).coerceAtMost(3f)) }
  }

  fun rotateClockwise() {
    mutableUiState.update { it.copy(rotation = (it.rotation + 90) % 360) }
  }

  private fun renderPage(
    uri: Uri,
    pageIndex: Int,
    resetViewerState: Boolean
  ) {
    mutableUiState.update {
      it.copy(
        selectedUri = uri.toString(),
        pageBitmap = null,
        pageIndex = pageIndex.coerceAtLeast(0),
        error = null,
        isLoading = true,
        zoom = if (resetViewerState) 1f else it.zoom,
        rotation = if (resetViewerState) 0 else it.rotation,
        scrollOffset = 0
      )
    }

    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        renderPdfPage(getApplication(), uri, pageIndex)
      }
      mutableUiState.update { state ->
        result.fold(
          onSuccess = {
            state.copy(
              pageBitmap = it.bitmap,
              pageIndex = it.pageIndex,
              pageCount = it.pageCount,
              error = null,
              isLoading = false
            )
          },
          onFailure = {
            state.copy(
              pageBitmap = null,
              error = it.message ?: "Unable to render PDF.",
              isLoading = false
            )
          }
        )
      }
    }
  }
}
