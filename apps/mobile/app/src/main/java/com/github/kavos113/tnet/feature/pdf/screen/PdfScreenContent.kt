package com.github.kavos113.tnet.feature.pdf.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.tooling.preview.Preview
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
internal fun PdfScreenContent(
  uiState: PdfUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  onOpenDrawer: () -> Unit,
  onCloseDrawer: () -> Unit,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  val drawerState = rememberDrawerState(
    initialValue = if (uiState.isDrawerOpen) DrawerValue.Open else DrawerValue.Closed
  )

  LaunchedEffect(uiState.activeWorkspace) {
    if (uiState.activeWorkspace == null) onOpenDrawer()
  }
  LaunchedEffect(uiState.isDrawerOpen) {
    if (uiState.isDrawerOpen) drawerState.open() else drawerState.close()
  }
  LaunchedEffect(drawerState.currentValue) {
    when {
      drawerState.currentValue == DrawerValue.Open && !uiState.isDrawerOpen -> onOpenDrawer()
      drawerState.currentValue == DrawerValue.Closed && uiState.isDrawerOpen -> onCloseDrawer()
    }
  }

  ModalNavigationDrawer(
    drawerState = drawerState,
    gesturesEnabled = true,
    drawerContent = {
      ModalDrawerSheet(modifier = Modifier.fillMaxWidth(0.86f)) {
        PdfWorkspacePanel(
          uiState = uiState,
          onOpenWorkspace = onOpenWorkspace,
          onOpenFile = onOpenFile,
          onReopenPath = onReopenPath,
          onToggleDirectory = onToggleDirectory,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace3, vertical = TnetSpace3)
        )
      }
    }
  ) {
    PdfDocumentSurface(
      uiState = uiState,
      onOpenDrawer = onOpenDrawer,
      onPreviousPage = onPreviousPage,
      onNextPage = onNextPage,
      onZoomOut = onZoomOut,
      onZoomIn = onZoomIn,
      onRotate = onRotate,
      modifier = modifier
    )
  }
}

@Composable
private fun PdfWorkspacePanel(
  uiState: PdfUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "PDF",
      style = MaterialTheme.typography.titleLarge
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
      expandedPaths = uiState.expandedPaths,
      loadingDirectoryPaths = uiState.loadingDirectoryPaths,
      onOpenFile = onOpenFile,
      onToggleDirectory = onToggleDirectory
    )
    if (uiState.isWorkspaceLoading) {
      TnetStateMessage(
        title = "Loading workspace...",
        detail = "Reading top-level PDF folders."
      )
    }
  }
}

@Composable
private fun PdfDocumentSurface(
  uiState: PdfUiState,
  onOpenDrawer: () -> Unit,
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
    TnetSecondaryButton(
      text = if (uiState.pageBitmap == null) "Workspace" else "Files",
      onClick = onOpenDrawer
    )
    uiState.selectedUri?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    Box(modifier = Modifier.weight(1f)) {
      when {
        uiState.isLoading -> TnetStateMessage(title = "Rendering PDF...")

        uiState.error != null -> TnetStateMessage(
          title = "PDF render error",
          detail = uiState.error,
          isError = true
        )

        uiState.pageBitmap == null -> TnetStateMessage(
          title = "No PDF selected",
          detail = "Swipe from the left edge or open the files panel."
        )

        else -> PdfPagePreview(
          uiState = uiState,
          onPreviousPage = onPreviousPage,
          onNextPage = onNextPage,
          onZoomOut = onZoomOut,
          onZoomIn = onZoomIn,
          onRotate = onRotate,
          modifier = Modifier.fillMaxSize()
        )
      }
    }
  }
}

@Composable
internal fun PdfPagePreview(
  uiState: PdfUiState,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  val bitmap = uiState.pageBitmap ?: return
  TnetPanel(
    modifier = modifier
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
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {},
      onPreviousPage = {},
      onNextPage = {},
      onZoomOut = {},
      onZoomIn = {},
      onRotate = {}
    )
  }
}
