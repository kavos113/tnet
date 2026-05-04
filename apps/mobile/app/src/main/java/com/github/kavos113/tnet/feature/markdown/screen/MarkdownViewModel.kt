package com.github.kavos113.tnet.feature.markdown.screen

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
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
  private val mutableUiState = MutableStateFlow(MarkdownUiState())
  val uiState: StateFlow<MarkdownUiState> = mutableUiState.asStateFlow()

  fun openDocument(uri: Uri) {
    val uriText = uri.toString()
    mutableUiState.update {
      it.copy(
        selectedUri = uriText,
        recentUris = (listOf(uriText) + it.recentUris).distinct().take(10),
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
  }
}
