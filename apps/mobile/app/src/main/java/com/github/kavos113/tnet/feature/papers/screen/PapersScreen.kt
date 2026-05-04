package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.pdf.screen.openPdfInExternalViewer

@Composable
fun PapersScreen(
  modifier: Modifier = Modifier,
  viewModel: PapersViewModel = viewModel()
) {
  val context = LocalContext.current
  val uiState by viewModel.uiState.collectAsState()
  PapersScreenContent(
    uiState = uiState,
    onPaperSelected = viewModel::selectPaper,
    onBack = viewModel::closeDetail,
    onSearchQueryChange = viewModel::updateSearchQuery,
    onDirectoryFilterChange = viewModel::updateDirectoryFilter,
    onSortModeChange = viewModel::updateSortMode,
    onSelectDirectory = viewModel::selectDirectory,
    onToggleDirectory = viewModel::toggleDirectory,
    onOpenDrawer = viewModel::openDrawer,
    onCloseDrawer = viewModel::closeDrawer,
    onDetailTabSelected = viewModel::selectDetailTab,
    onPreviousPage = viewModel::goToPreviousPage,
    onNextPage = viewModel::goToNextPage,
    onZoomOut = viewModel::zoomOut,
    onZoomIn = viewModel::zoomIn,
    onZoomChange = viewModel::setZoom,
    onRotate = viewModel::rotateClockwise,
    onOpenExternal = { openPdfInExternalViewer(context, uiState.selectedPdfUri) },
    modifier = modifier
  )
}
