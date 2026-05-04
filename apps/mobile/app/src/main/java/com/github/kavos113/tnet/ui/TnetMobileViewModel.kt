package com.github.kavos113.tnet.ui

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class TnetMobileViewModel : ViewModel() {
  private val mutableUiState = MutableStateFlow(TnetMobileUiState())
  val uiState: StateFlow<TnetMobileUiState> = mutableUiState.asStateFlow()

  fun selectDestination(destination: TnetMobileDestination) {
    mutableUiState.update { it.copy(selectedDestination = destination) }
  }
}
