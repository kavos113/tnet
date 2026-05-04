package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun PapersScreen(
  modifier: Modifier = Modifier,
  viewModel: PapersViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  PapersScreenContent(
    uiState = uiState,
    onPaperSelected = viewModel::selectPaper,
    onBack = viewModel::closeDetail,
    onSearchQueryChange = viewModel::updateSearchQuery,
    onDirectoryFilterChange = viewModel::updateDirectoryFilter,
    onSortModeChange = viewModel::updateSortMode,
    modifier = modifier
  )
}
