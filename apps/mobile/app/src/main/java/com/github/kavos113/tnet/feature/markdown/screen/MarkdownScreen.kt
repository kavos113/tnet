package com.github.kavos113.tnet.feature.markdown.screen

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun MarkdownScreen(
  modifier: Modifier = Modifier,
  viewModel: MarkdownViewModel = viewModel()
) {
  val context = LocalContext.current
  val uiState by viewModel.uiState.collectAsState()
  val openMarkdown = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectWorkspace(uri)
  }

  MarkdownScreenContent(
    uiState = uiState,
    onOpenWorkspace = { openMarkdown.launch(null) },
    onOpenFile = viewModel::openWorkspaceFile,
    onSearchQueryChange = viewModel::updateSearchQuery,
    onDrawerPanelSelected = viewModel::selectDrawerPanel,
    onToggleDirectory = viewModel::toggleDirectory,
    onOpenDrawer = viewModel::openDrawer,
    onCloseDrawer = viewModel::closeDrawer,
    modifier = modifier
  )
}
