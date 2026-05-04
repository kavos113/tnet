package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun RssScreen(
  modifier: Modifier = Modifier,
  viewModel: RssViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  RssScreenContent(
    uiState = uiState,
    onTitleChange = viewModel::updateTitleDraft,
    onUrlChange = viewModel::updateUrlDraft,
    onSave = viewModel::saveFeed,
    onCancel = viewModel::cancelEditing,
    onRefresh = viewModel::refreshFeed,
    onEdit = viewModel::editFeed,
    onRemove = viewModel::removeFeed,
    onItemSelected = viewModel::selectItem,
    onItemBack = viewModel::closeItem,
    modifier = modifier
  )
}
