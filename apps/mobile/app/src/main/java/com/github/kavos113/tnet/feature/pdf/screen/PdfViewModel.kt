package com.github.kavos113.tnet.feature.pdf.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.core.workspace.WorkspaceRoot
import com.github.kavos113.tnet.core.workspace.findWorkspaceFile
import com.github.kavos113.tnet.core.workspace.loadWorkspaceFileTree
import com.github.kavos113.tnet.core.workspace.workspaceNameFromTreeUri
import com.github.kavos113.tnet.feature.pdf.model.renderPdfPage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PdfViewModel(application: Application) : AndroidViewModel(application) {
  private val settingsRepository = TnetSettingsRepository(application)
  private val mutableUiState = MutableStateFlow(PdfUiState())
  val uiState: StateFlow<PdfUiState> = mutableUiState.asStateFlow()

  init {
    viewModelScope.launch {
      settingsRepository.settings.collect { settings ->
        val roots = settings.pdfWorkspaceUris.map { uri ->
          WorkspaceRoot(uri = uri, name = workspaceNameFromTreeUri(Uri.parse(uri)))
        }
        val active = settings.activePdfWorkspaceUri?.let { uri ->
          roots.firstOrNull { it.uri == uri } ?: WorkspaceRoot(uri, workspaceNameFromTreeUri(Uri.parse(uri)))
        }
        mutableUiState.update {
          it.copy(
            workspaceRoots = roots,
            activeWorkspace = active,
            openedFiles = settings.pdfOpenedFiles,
            activeIndex = settings.activePdfIndex,
            scrollOffset = settings.pdfViewerPosition
          )
        }
        if (active != null) loadWorkspace(active)
      }
    }
  }

  fun selectWorkspace(uri: Uri) {
    val root = WorkspaceRoot(uri = uri.toString(), name = workspaceNameFromTreeUri(uri))
    mutableUiState.update { it.copy(activeWorkspace = root) }
    viewModelScope.launch {
      settingsRepository.savePdfWorkspaceUri(root.uri)
      loadWorkspace(root)
    }
  }

  fun openWorkspaceFile(file: WorkspaceFileItem) {
    if (file.isDirectory) return
    val openedFiles = (mutableUiState.value.openedFiles + file.relativePath).distinct()
    mutableUiState.update {
      it.copy(
        openedFiles = openedFiles,
        activeIndex = openedFiles.indexOf(file.relativePath),
        selectedPath = file.relativePath
      )
    }
    persistSession()
    openPdf(Uri.parse(file.documentUri), selectedPath = file.relativePath)
  }

  fun reopenPath(relativePath: String) {
    val file = findWorkspaceFile(mutableUiState.value.fileTree, relativePath) ?: return
    openWorkspaceFile(file)
  }

  fun openPdf(uri: Uri) {
    openPdf(uri, selectedPath = null)
  }

  private fun openPdf(uri: Uri, selectedPath: String?) {
    renderPage(uri = uri, pageIndex = 0, resetViewerState = true, selectedPath = selectedPath)
  }

  fun goToPreviousPage() {
    val state = mutableUiState.value
    val uri = state.selectedUri?.let(Uri::parse) ?: return
    if (!state.canGoToPreviousPage) return
    renderPage(uri = uri, pageIndex = state.pageIndex - 1, resetViewerState = false, selectedPath = state.selectedPath)
  }

  fun goToNextPage() {
    val state = mutableUiState.value
    val uri = state.selectedUri?.let(Uri::parse) ?: return
    if (!state.canGoToNextPage) return
    renderPage(uri = uri, pageIndex = state.pageIndex + 1, resetViewerState = false, selectedPath = state.selectedPath)
  }

  fun zoomOut() {
    mutableUiState.update { it.copy(zoom = (it.zoom - 0.25f).coerceAtLeast(0.5f)) }
    persistSession()
  }

  fun zoomIn() {
    mutableUiState.update { it.copy(zoom = (it.zoom + 0.25f).coerceAtMost(3f)) }
    persistSession()
  }

  fun rotateClockwise() {
    mutableUiState.update { it.copy(rotation = (it.rotation + 90) % 360) }
    persistSession()
  }

  private fun renderPage(
    uri: Uri,
    pageIndex: Int,
    resetViewerState: Boolean,
    selectedPath: String?
  ) {
    mutableUiState.update {
      it.copy(
        selectedPath = selectedPath ?: it.selectedPath,
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

  private suspend fun loadWorkspace(root: WorkspaceRoot) {
    val result = withContext(Dispatchers.IO) {
      loadWorkspaceFileTree(
        contentResolver = getApplication<Application>().contentResolver,
        workspaceUri = Uri.parse(root.uri),
        allowedExtensions = setOf(".pdf")
      )
    }
    mutableUiState.update { state ->
      result.fold(
        onSuccess = { state.copy(fileTree = it, error = null) },
        onFailure = {
          state.copy(
            fileTree = emptyList(),
            error = it.message ?: "Permission lost or workspace unavailable. Re-select the workspace in Settings."
          )
        }
      )
    }
  }

  private fun persistSession() {
    val state = mutableUiState.value
    viewModelScope.launch {
      settingsRepository.savePdfSession(
        openedFiles = state.openedFiles,
        activeIndex = state.activeIndex,
        viewerPosition = state.scrollOffset
      )
    }
  }
}
