package com.github.kavos113.tnet.feature.markdown.screen

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
import com.github.kavos113.tnet.feature.markdown.model.parseMarkdownBlocks
import com.github.kavos113.tnet.feature.markdown.model.readMarkdownDocument
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MarkdownViewModel(application: Application) : AndroidViewModel(application) {
  private val settingsRepository = TnetSettingsRepository(application)
  private val mutableUiState = MutableStateFlow(MarkdownUiState())
  val uiState: StateFlow<MarkdownUiState> = mutableUiState.asStateFlow()

  init {
    viewModelScope.launch {
      settingsRepository.settings.collect { settings ->
        val roots = settings.markdownWorkspaceUris.map { uri ->
          WorkspaceRoot(uri = uri, name = workspaceNameFromTreeUri(Uri.parse(uri)))
        }
        val active = settings.activeMarkdownWorkspaceUri?.let { uri ->
          roots.firstOrNull { it.uri == uri } ?: WorkspaceRoot(uri, workspaceNameFromTreeUri(Uri.parse(uri)))
        }
        mutableUiState.update {
          it.copy(
            workspaceRoots = roots,
            activeWorkspace = active,
            openedFiles = settings.markdownOpenedFiles,
            viewerPosition = settings.markdownViewerPosition
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
      settingsRepository.saveMarkdownWorkspaceUri(root.uri)
      loadWorkspace(root)
    }
  }

  fun openWorkspaceFile(file: WorkspaceFileItem) {
    if (file.isDirectory) return
    val normalizedUri = Uri.parse(file.documentUri)
    mutableUiState.update {
      it.copy(
        selectedPath = file.relativePath,
        selectedUri = file.documentUri,
        openedFiles = (listOf(file.relativePath) + it.openedFiles).distinct(),
        recentUris = (listOf(file.relativePath) + it.recentUris).distinct().take(10),
        blocks = emptyList(),
        error = null,
        isLoading = true
      )
    }
    persistSession()
    openDocument(normalizedUri, selectedPath = file.relativePath)
  }

  fun reopenPath(relativePath: String) {
    val file = findWorkspaceFile(mutableUiState.value.fileTree, relativePath) ?: return
    openWorkspaceFile(file)
  }

  fun openDocument(uri: Uri) {
    openDocument(uri, selectedPath = null)
  }

  private fun openDocument(uri: Uri, selectedPath: String?) {
    val uriText = uri.toString()
    mutableUiState.update {
      it.copy(
        selectedPath = selectedPath ?: it.selectedPath,
        selectedUri = uriText,
        recentUris = (listOf(selectedPath ?: uriText) + it.recentUris).distinct().take(10),
        blocks = emptyList(),
        error = null,
        isLoading = true
      )
    }

    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        readMarkdownDocument(getApplication(), uri)
      }
      mutableUiState.update { state ->
        result.fold(
          onSuccess = {
            state.copy(
              blocks = parseMarkdownBlocks(it),
              error = null,
              isLoading = false
            )
          },
          onFailure = {
            state.copy(
              blocks = emptyList(),
              error = it.message ?: "Unable to read document.",
              isLoading = false
            )
          }
        )
      }
    }
  }

  fun updateSearchQuery(value: String) {
    mutableUiState.update { it.copy(searchQuery = value) }
  }

  fun saveViewerPosition(position: Int) {
    mutableUiState.update { it.copy(viewerPosition = position.coerceAtLeast(0)) }
    persistSession()
  }

  private suspend fun loadWorkspace(root: WorkspaceRoot) {
    val result = withContext(Dispatchers.IO) {
      loadWorkspaceFileTree(
        contentResolver = getApplication<Application>().contentResolver,
        workspaceUri = Uri.parse(root.uri),
        allowedExtensions = setOf(".md", ".markdown")
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
      settingsRepository.saveMarkdownSession(
        openedFiles = state.openedFiles,
        viewerPosition = state.viewerPosition
      )
    }
  }
}
