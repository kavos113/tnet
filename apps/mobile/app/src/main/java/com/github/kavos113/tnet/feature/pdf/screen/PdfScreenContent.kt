package com.github.kavos113.tnet.feature.pdf.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.tooling.preview.Preview
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PdfScreenContent(
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
