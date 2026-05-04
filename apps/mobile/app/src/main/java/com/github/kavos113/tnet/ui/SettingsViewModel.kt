package com.github.kavos113.tnet.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.feature.papers.model.validatePapersWorkspace
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
  private val settingsRepository = TnetSettingsRepository(application)
  private val mutableUiState = MutableStateFlow(SettingsUiState())
  val uiState: StateFlow<SettingsUiState> = mutableUiState.asStateFlow()

  init {
    viewModelScope.launch {
      settingsRepository.settings.collect {
        val uri = it.papersWorkspaceUri
        mutableUiState.update { state ->
          state.copy(
            selectedWorkspaceUri = uri,
            selectedDatabaseUri = it.papersDatabaseUri
          )
        }
        if (uri != null) validateWorkspace(uri)
      }
    }
  }

  fun selectWorkspace(uri: Uri) {
    val uriText = uri.toString()
    mutableUiState.update {
      it.copy(
        selectedWorkspaceUri = uriText,
        workspaceValidation = null
      )
    }
    viewModelScope.launch {
      settingsRepository.savePapersWorkspaceUri(uriText)
      validateWorkspace(uriText)
    }
  }

  fun selectDatabase(uri: Uri) {
    val uriText = uri.toString()
    mutableUiState.update { it.copy(selectedDatabaseUri = uriText) }
    viewModelScope.launch {
      settingsRepository.savePapersDatabaseUri(uriText)
    }
  }

  private suspend fun validateWorkspace(uriText: String) {
    val validation = withContext(Dispatchers.IO) {
      validatePapersWorkspace(getApplication<Application>().contentResolver, Uri.parse(uriText))
    }
    mutableUiState.update { it.copy(workspaceValidation = validation) }
  }
}
