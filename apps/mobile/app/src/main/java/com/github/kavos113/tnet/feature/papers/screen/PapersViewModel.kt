package com.github.kavos113.tnet.feature.papers.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.feature.papers.model.loadPaperDetail
import com.github.kavos113.tnet.feature.papers.model.loadPaperList
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
        selectedPaper = null
      )
    }
    loadPaperDetailFor(paper.id)
  }

  fun closeDetail() {
    mutableUiState.update {
      it.copy(
        selectedPaperId = null,
        selectedPaper = null
      )
    }
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
        selectedPaper = null
      )
    }

    val context = getApplication<Application>()
    if (workspaceUri == null && databaseUri != null) {
      val papers = withContext(Dispatchers.IO) {
        loadPaperList(context, Uri.parse(databaseUri))
      }
      mutableUiState.update { it.copy(papers = papers) }
      return
    }

    val uri = workspaceUri ?: return
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
    }
  }
}
