package com.github.kavos113.tnet.feature.pdf.screen

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
fun PdfScreen(
  modifier: Modifier = Modifier,
  viewModel: PdfViewModel = viewModel()
) {
  val context = LocalContext.current
  val uiState by viewModel.uiState.collectAsState()
  val openPdf = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult
    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectWorkspace(uri)
  }

  PdfScreenContent(
    uiState = uiState,
    onOpenWorkspace = { openPdf.launch(null) },
    onOpenFile = viewModel::openWorkspaceFile,
    onReopenPath = viewModel::reopenPath,
    onPreviousPage = viewModel::goToPreviousPage,
    onNextPage = viewModel::goToNextPage,
    onZoomOut = viewModel::zoomOut,
    onZoomIn = viewModel::zoomIn,
    onRotate = viewModel::rotateClockwise,
    modifier = modifier
  )
}
