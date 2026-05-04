package com.github.kavos113.tnet.feature.papers.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.core.workspace.findWorkspaceDocumentByRelativePath
import com.github.kavos113.tnet.core.workspace.loadWorkspaceDirectoryChildren
import com.github.kavos113.tnet.core.workspace.loadWorkspaceRootFileTree
import com.github.kavos113.tnet.core.workspace.replaceWorkspaceDirectoryChildren
import com.github.kavos113.tnet.feature.papers.model.PaperPdfPathState
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.feature.papers.model.loadPaperDetail
import com.github.kavos113.tnet.feature.papers.model.loadPaperList
import com.github.kavos113.tnet.feature.papers.model.resolvePaperPdfPath
import com.github.kavos113.tnet.feature.pdf.model.renderPdfPage
import com.github.kavos113.tnet.feature.papers.model.validatePapersWorkspace
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PapersViewModel(application: Application) : AndroidViewModel(application) {
  private val settingsRepository = TnetSettingsRepository(application)
  private val mutableUiState = MutableStateFlow(PapersUiState())
  private var loadedWorkspaceUri: String? = null
  val uiState: StateFlow<PapersUiState> = mutableUiState.asStateFlow()

  init {
    viewModelScope.launch {
      settingsRepository.settings.collect { settings ->
        loadPapersSource(
          workspaceUri = settings.papersWorkspaceUri,
          databaseUri = settings.papersDatabaseUri
        )
      }
    }
  }

  fun selectPaper(paper: PaperListItem) {
    mutableUiState.update {
      it.copy(
        selectedPaperId = paper.id,
        selectedPaper = null,
        detailTab = if (paper.pdfPath.isNullOrBlank() || mutableUiState.value.isSqliteOnlyMode) {
          PapersDetailTab.Metadata
        } else {
          PapersDetailTab.Pdf
        },
        selectedPdfUri = null,
        pageBitmap = null,
        pageIndex = 0,
        pageCount = 0,
        zoom = 1f,
        rotation = 0,
        isPdfLoading = false,
        pdfError = null
      )
    }
    loadPaperDetailFor(paper.id)
  }

  fun closeDetail() {
    mutableUiState.update {
      it.copy(
        selectedPaperId = null,
        selectedPaper = null,
        selectedPdfUri = null,
        pageBitmap = null,
        isPdfLoading = false,
        pdfError = null
      )
    }
  }

  fun selectDirectory(directory: WorkspaceFileItem?) {
    mutableUiState.update {
      it.copy(
        selectedDirectoryPath = directory?.relativePath,
        directoryFilter = "",
        isDrawerOpen = false
      )
    }
  }

  fun openDrawer() {
    mutableUiState.update { it.copy(isDrawerOpen = true) }
  }

  fun closeDrawer() {
    mutableUiState.update { it.copy(isDrawerOpen = false) }
  }

  fun selectDetailTab(tab: PapersDetailTab) {
    mutableUiState.update { it.copy(detailTab = tab) }
    if (tab == PapersDetailTab.Pdf && mutableUiState.value.pageBitmap == null) {
      mutableUiState.value.selectedPaper?.getOrNull()?.let { openPaperPdf(it.pdfPath) }
    }
  }

  fun toggleDirectory(directory: WorkspaceFileItem) {
    if (!directory.isDirectory) return
    val state = mutableUiState.value
    if (directory.relativePath in state.expandedPaths) {
      mutableUiState.update { it.copy(expandedPaths = it.expandedPaths - directory.relativePath) }
      return
    }

    mutableUiState.update {
      it.copy(
        expandedPaths = it.expandedPaths + directory.relativePath,
        loadingDirectoryPaths = if (directory.isChildrenLoaded) {
          it.loadingDirectoryPaths
        } else {
          it.loadingDirectoryPaths + directory.relativePath
        }
      )
    }
    if (directory.isChildrenLoaded) return

    val workspaceUri = state.workspaceUri ?: return
    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        loadWorkspaceDirectoryChildren(
          contentResolver = getApplication<Application>().contentResolver,
          workspaceUri = Uri.parse(workspaceUri),
          directory = directory,
          allowedExtensions = emptySet()
        ).map { children -> children.visibleDirectories() }
      }
      mutableUiState.update { current ->
        result.fold(
          onSuccess = { children ->
            current.copy(
              fileTree = replaceWorkspaceDirectoryChildren(
                items = current.fileTree,
                relativePath = directory.relativePath,
                children = children
              ),
              loadingDirectoryPaths = current.loadingDirectoryPaths - directory.relativePath
            )
          },
          onFailure = {
            current.copy(
              validation = PapersWorkspaceValidation.Invalid(
                it.message ?: "Unable to load workspace directory."
              ),
              loadingDirectoryPaths = current.loadingDirectoryPaths - directory.relativePath
            )
          }
        )
      }
    }
  }

  fun goToPreviousPage() {
    val state = mutableUiState.value
    val uri = state.selectedPdfUri?.let(Uri::parse) ?: return
    if (!state.canGoToPreviousPage) return
    renderSelectedPdfPage(uri, state.pageIndex - 1, resetViewerState = false)
  }

  fun goToNextPage() {
    val state = mutableUiState.value
    val uri = state.selectedPdfUri?.let(Uri::parse) ?: return
    if (!state.canGoToNextPage) return
    renderSelectedPdfPage(uri, state.pageIndex + 1, resetViewerState = false)
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

  fun updateSearchQuery(value: String) {
    mutableUiState.update { it.copy(searchQuery = value) }
  }

  fun updateTagFilter(value: String) {
    mutableUiState.update { it.copy(tagFilter = value) }
  }

  fun updateDirectoryFilter(value: String) {
    mutableUiState.update { it.copy(directoryFilter = value) }
  }

  fun updateSortMode(value: PapersSortMode) {
    mutableUiState.update { it.copy(sortMode = value) }
  }

  internal fun replacePapersForTest(papers: List<PaperListItem>) {
    mutableUiState.update { it.copy(papers = Result.success(papers)) }
  }

  private suspend fun loadPapersSource(
    workspaceUri: String?,
    databaseUri: String?
  ) {
    mutableUiState.update {
      it.copy(
        workspaceUri = workspaceUri,
        databaseUri = databaseUri,
        isSqliteOnlyMode = workspaceUri == null && databaseUri != null,
        validation = null,
        papers = null,
        selectedPaperId = null,
        selectedPaper = null,
        fileTree = if (workspaceUri == it.workspaceUri) it.fileTree else emptyList(),
        selectedDirectoryPath = null,
        expandedPaths = emptySet(),
        loadingDirectoryPaths = emptySet(),
        selectedPdfUri = null,
        pageBitmap = null,
        isPdfLoading = false,
        pdfError = null
      )
    }
    if (workspaceUri == null) loadedWorkspaceUri = null

    val context = getApplication<Application>()
    if (workspaceUri == null && databaseUri != null) {
      val papers = withContext(Dispatchers.IO) {
        loadPaperList(context, Uri.parse(databaseUri))
      }
      mutableUiState.update { it.copy(papers = papers) }
      return
    }

    val uri = workspaceUri ?: return
    if (uri != loadedWorkspaceUri) loadWorkspaceFolders(uri)
    val validation = withContext(Dispatchers.IO) {
      validatePapersWorkspace(context.contentResolver, Uri.parse(uri))
    }
    mutableUiState.update { it.copy(validation = validation) }

    if (validation is PapersWorkspaceValidation.Valid) {
      val papers = withContext(Dispatchers.IO) {
        loadPaperList(context, validation.databaseUri)
      }
      mutableUiState.update { it.copy(papers = papers) }
    }
  }

  private fun loadPaperDetailFor(paperId: String) {
    val state = mutableUiState.value
    val databaseUri = when {
      state.isSqliteOnlyMode && state.databaseUri != null -> Uri.parse(state.databaseUri)
      state.validation is PapersWorkspaceValidation.Valid -> state.validation.databaseUri
      else -> return
    }
    val context = getApplication<Application>()

    viewModelScope.launch {
      val paper = withContext(Dispatchers.IO) {
        loadPaperDetail(context, databaseUri, paperId)
      }
      mutableUiState.update { it.copy(selectedPaper = paper) }
      paper.getOrNull()?.let { detail ->
        if (mutableUiState.value.detailTab == PapersDetailTab.Pdf) {
          openPaperPdf(detail.pdfPath)
        }
      }
    }
  }

  private suspend fun loadWorkspaceFolders(workspaceUri: String) {
    loadedWorkspaceUri = workspaceUri
    mutableUiState.update {
      it.copy(
        isWorkspaceLoading = true,
        fileTree = emptyList(),
        expandedPaths = emptySet(),
        loadingDirectoryPaths = emptySet()
      )
    }
    val result = withContext(Dispatchers.IO) {
      loadWorkspaceRootFileTree(
        contentResolver = getApplication<Application>().contentResolver,
        workspaceUri = Uri.parse(workspaceUri),
        allowedExtensions = emptySet()
      ).map { it.visibleDirectories() }
    }
    mutableUiState.update { state ->
      result.fold(
        onSuccess = { state.copy(fileTree = it, isWorkspaceLoading = false) },
        onFailure = {
          state.copy(
            fileTree = emptyList(),
            validation = PapersWorkspaceValidation.Invalid(
              it.message ?: "Permission lost or workspace unavailable. Re-select the workspace in Settings."
            ),
            isWorkspaceLoading = false
          )
        }
      )
    }
  }

  private fun openPaperPdf(pdfPath: String?) {
    val state = mutableUiState.value
    val workspaceUri = state.workspaceUri
    if (workspaceUri == null || state.isSqliteOnlyMode) {
      mutableUiState.update {
        it.copy(
          pageBitmap = null,
          selectedPdfUri = null,
          pdfError = "PDF preview requires a Papers workspace.",
          isPdfLoading = false
        )
      }
      return
    }

    when (val pathState = resolvePaperPdfPath(pdfPath)) {
      PaperPdfPathState.Missing -> mutableUiState.update {
        it.copy(pageBitmap = null, selectedPdfUri = null, pdfError = "PDF is unavailable.", isPdfLoading = false)
      }
      is PaperPdfPathState.Rejected -> mutableUiState.update {
        it.copy(pageBitmap = null, selectedPdfUri = null, pdfError = pathState.reason, isPdfLoading = false)
      }
      is PaperPdfPathState.Available -> {
        mutableUiState.update { it.copy(isPdfLoading = true, pdfError = null, pageBitmap = null) }
        viewModelScope.launch {
          val uriResult = withContext(Dispatchers.IO) {
            findWorkspaceDocumentByRelativePath(
              contentResolver = getApplication<Application>().contentResolver,
              workspaceUri = Uri.parse(workspaceUri),
              relativePath = pathState.relativePath
            )
          }
          val documentUri = uriResult.getOrNull()
          if (documentUri == null) {
            mutableUiState.update {
              it.copy(
                pageBitmap = null,
                selectedPdfUri = null,
                pdfError = uriResult.exceptionOrNull()?.message ?: "PDF file was not found in the workspace.",
                isPdfLoading = false
              )
            }
            return@launch
          }
          renderSelectedPdfPage(documentUri, pageIndex = 0, resetViewerState = true)
        }
      }
    }
  }

  private fun renderSelectedPdfPage(
    uri: Uri,
    pageIndex: Int,
    resetViewerState: Boolean
  ) {
    mutableUiState.update {
      it.copy(
        selectedPdfUri = uri.toString(),
        pageBitmap = null,
        pageIndex = pageIndex.coerceAtLeast(0),
        isPdfLoading = true,
        pdfError = null,
        zoom = if (resetViewerState) 1f else it.zoom,
        rotation = if (resetViewerState) 0 else it.rotation
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
              isPdfLoading = false,
              pdfError = null
            )
          },
          onFailure = {
            state.copy(
              pageBitmap = null,
              isPdfLoading = false,
              pdfError = it.message ?: "Unable to render PDF."
            )
          }
        )
      }
    }
  }
}

private fun List<WorkspaceFileItem>.visibleDirectories(): List<WorkspaceFileItem> {
  return filter { it.isDirectory && !it.name.startsWith('.') }
    .map { it.copy(children = it.children.visibleDirectories()) }
}
