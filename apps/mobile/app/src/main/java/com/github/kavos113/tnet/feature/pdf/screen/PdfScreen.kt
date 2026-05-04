package com.github.kavos113.tnet.feature.pdf.screen

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

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

@Composable
private fun PdfScreenContent(
  uiState: PdfUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "PDF",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Open PDF files from a synced desktop workspace in read-only mode.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    TnetPrimaryButton(text = "Open workspace", onClick = onOpenWorkspace)
    Text(
      text = uiState.activeWorkspace?.name ?: "No PDF workspace selected.",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    PdfOpenedFiles(
      uiState = uiState,
      onReopenPath = onReopenPath
    )
    PdfWorkspaceFileTree(
      items = uiState.fileTree,
      selectedPath = uiState.selectedPath,
      onOpenFile = onOpenFile
    )
    uiState.selectedUri?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    if (uiState.isLoading) {
      TnetStateMessage(title = "Rendering PDF...")
    }
    uiState.error?.let {
      TnetStateMessage(title = "PDF render error", detail = it, isError = true)
    }
    if (!uiState.isLoading && uiState.error == null && uiState.pageBitmap == null) {
      TnetStateMessage(
        title = "No PDF selected",
        detail = "Choose a PDF from a workspace to open it in read-only mode."
      )
    }
    uiState.pageBitmap?.let { bitmap ->
      TnetPanel(
        modifier = Modifier
          .fillMaxWidth()
          .verticalScroll(rememberScrollState())
      ) {
        Column(verticalArrangement = Arrangement.spacedBy(TnetSpace3)) {
          PdfToolbar(
            uiState = uiState,
            onPreviousPage = onPreviousPage,
            onNextPage = onNextPage,
            onZoomOut = onZoomOut,
            onZoomIn = onZoomIn,
            onRotate = onRotate
          )
          Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "PDF page ${uiState.pageIndex + 1}",
            modifier = Modifier
              .fillMaxWidth()
              .graphicsLayer {
                scaleX = uiState.zoom
                scaleY = uiState.zoom
                rotationZ = uiState.rotation.toFloat()
              }
          )
        }
      }
    }
  }
}

@Composable
private fun PdfOpenedFiles(
  uiState: PdfUiState,
  onReopenPath: (String) -> Unit
) {
  if (uiState.openedFiles.isEmpty()) return
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace3)) {
      Text(
        text = "Opened files",
        style = MaterialTheme.typography.titleMedium
      )
      uiState.openedFiles.forEach { path ->
        TnetSecondaryButton(
          text = path.substringAfterLast('/'),
          selected = path == uiState.selectedPath,
          onClick = { onReopenPath(path) }
        )
      }
    }
  }
}

@Composable
private fun PdfWorkspaceFileTree(
  items: List<WorkspaceFileItem>,
  selectedPath: String?,
  onOpenFile: (WorkspaceFileItem) -> Unit
) {
  if (items.isEmpty()) return
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace3)) {
      Text(
        text = "Workspace files",
        style = MaterialTheme.typography.titleMedium
      )
      items.forEach { item ->
        PdfWorkspaceFileTreeItem(item, selectedPath, onOpenFile)
      }
    }
  }
}

@Composable
private fun PdfWorkspaceFileTreeItem(
  item: WorkspaceFileItem,
  selectedPath: String?,
  onOpenFile: (WorkspaceFileItem) -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
    if (item.isDirectory) {
      Text(
        text = item.relativePath,
        style = MaterialTheme.typography.labelSmall,
        color = TnetTextMuted
      )
      item.children.forEach { child ->
        PdfWorkspaceFileTreeItem(child, selectedPath, onOpenFile)
      }
    } else {
      TnetSecondaryButton(
        text = item.relativePath,
        selected = selectedPath == item.relativePath,
        onClick = { onOpenFile(item) }
      )
    }
  }
}

@Composable
private fun PdfToolbar(
  uiState: PdfUiState,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier.fillMaxWidth(),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Page ${uiState.pageIndex + 1} / ${uiState.pageCount}  Zoom ${(uiState.zoom * 100).toInt()}%  Rotate ${uiState.rotation}deg",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace3)) {
      TnetSecondaryButton(
        text = "Prev",
        onClick = onPreviousPage,
        modifier = Modifier.widthIn(min = 64.dp)
      )
      TnetSecondaryButton(
        text = "Next",
        onClick = onNextPage,
        modifier = Modifier.widthIn(min = 64.dp)
      )
      TnetSecondaryButton(text = "-", onClick = onZoomOut)
      TnetSecondaryButton(text = "+", onClick = onZoomIn)
      TnetSecondaryButton(text = "Rotate", onClick = onRotate)
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PdfScreenContentPreview() {
  TnetTheme {
    PdfScreenContent(
      uiState = PdfUiState(
        selectedUri = "content://workspace/papers/sample.pdf",
        pageIndex = 0,
        pageCount = 12
      ),
      onOpenWorkspace = {},
      onOpenFile = {},
      onReopenPath = {},
      onPreviousPage = {},
      onNextPage = {},
      onZoomOut = {},
      onZoomIn = {},
      onRotate = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun PdfToolbarPreview() {
  TnetTheme {
    PdfToolbar(
      uiState = PdfUiState(pageIndex = 2, pageCount = 12, zoom = 1.25f, rotation = 90),
      onPreviousPage = {},
      onNextPage = {},
      onZoomOut = {},
      onZoomIn = {},
      onRotate = {}
    )
  }
}
