package com.github.kavos113.tnet.feature.markdown.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.core.workspace.WorkspaceRoot
import com.github.kavos113.tnet.core.workspace.loadWorkspaceDirectoryChildren
import com.github.kavos113.tnet.core.workspace.loadWorkspaceRootFileTree
import com.github.kavos113.tnet.core.workspace.replaceWorkspaceDirectoryChildren
import com.github.kavos113.tnet.core.workspace.workspaceNameFromTreeUri
import com.github.kavos113.tnet.feature.markdown.model.parseMarkdownBlocks
import com.github.kavos113.tnet.feature.markdown.model.readMarkdownDocument
import com.github.kavos113.tnet.feature.markdown.model.renderMarkdownHtml
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
  private var loadedWorkspaceUri: String? = null
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
            selectedPath = it.selectedPath ?: settings.activeMarkdownPath,
            selectedUri = it.selectedUri ?: settings.activeMarkdownUri,
            viewerPosition = settings.markdownViewerPosition
          )
        }
        if (active == null) {
          loadedWorkspaceUri = null
        } else if (active.uri != loadedWorkspaceUri) {
          loadWorkspace(active)
        }
        val selectedUri = settings.activeMarkdownUri
        if (
          selectedUri != null &&
          mutableUiState.value.selectedUri == selectedUri &&
          mutableUiState.value.renderedHtml.isBlank() &&
          !mutableUiState.value.isLoading
        ) {
          openDocument(Uri.parse(selectedUri), selectedPath = settings.activeMarkdownPath)
        }
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
        blocks = emptyList(),
        renderedHtml = "",
        error = null,
        isLoading = true,
        isDrawerOpen = false
      )
    }
    persistSession()
    openDocument(normalizedUri, selectedPath = file.relativePath)
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
        blocks = emptyList(),
        renderedHtml = "",
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
              renderedHtml = renderMarkdownHtml(it),
              error = null,
              isLoading = false
            )
          },
          onFailure = {
            state.copy(
              blocks = emptyList(),
              renderedHtml = "",
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

  fun selectDrawerPanel(panel: MarkdownDrawerPanel) {
    mutableUiState.update { it.copy(drawerPanel = panel) }
  }

  fun openDrawer() {
    mutableUiState.update { it.copy(isDrawerOpen = true) }
  }

  fun closeDrawer() {
    mutableUiState.update { it.copy(isDrawerOpen = false) }
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

    val root = state.activeWorkspace ?: return
    viewModelScope.launch {
      val result = withContext(Dispatchers.IO) {
        loadWorkspaceDirectoryChildren(
          contentResolver = getApplication<Application>().contentResolver,
          workspaceUri = Uri.parse(root.uri),
          directory = directory,
          allowedExtensions = setOf(".md", ".markdown")
        )
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
              error = null,
              loadingDirectoryPaths = current.loadingDirectoryPaths - directory.relativePath
            )
          },
          onFailure = {
            current.copy(
              error = it.message ?: "Unable to load workspace directory.",
              loadingDirectoryPaths = current.loadingDirectoryPaths - directory.relativePath
            )
          }
        )
      }
    }
  }

  fun saveViewerPosition(position: Int) {
    mutableUiState.update { it.copy(viewerPosition = position.coerceAtLeast(0)) }
    persistSession()
  }

  private suspend fun loadWorkspace(root: WorkspaceRoot) {
    loadedWorkspaceUri = root.uri
    mutableUiState.update {
      it.copy(
        isWorkspaceLoading = true,
        fileTree = emptyList(),
        expandedPaths = emptySet(),
        loadingDirectoryPaths = emptySet(),
        error = null
      )
    }
    val result = withContext(Dispatchers.IO) {
      loadWorkspaceRootFileTree(
        contentResolver = getApplication<Application>().contentResolver,
        workspaceUri = Uri.parse(root.uri),
        allowedExtensions = setOf(".md", ".markdown")
      )
    }
    mutableUiState.update { state ->
      result.fold(
        onSuccess = {
          state.copy(
            fileTree = it,
            error = null,
            isWorkspaceLoading = false
          )
        },
        onFailure = {
          state.copy(
            fileTree = emptyList(),
            error = it.message ?: "Permission lost or workspace unavailable. Re-select the workspace in Settings.",
            isWorkspaceLoading = false
          )
        }
      )
    }
  }

  private fun persistSession() {
    val state = mutableUiState.value
    viewModelScope.launch {
      settingsRepository.saveMarkdownSession(
        selectedPath = state.selectedPath,
        selectedUri = state.selectedUri,
        viewerPosition = state.viewerPosition
      )
    }
  }
}
