package com.github.kavos113.tnet.feature.markdown.screen

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetTextMuted

@Composable
internal fun MarkdownScreenContent(
  uiState: MarkdownUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  onOpenDrawer: () -> Unit,
  onCloseDrawer: () -> Unit,
  modifier: Modifier = Modifier
) {
  val drawerState = rememberDrawerState(
    initialValue = if (uiState.isDrawerOpen) DrawerValue.Open else DrawerValue.Closed
  )

  LaunchedEffect(uiState.activeWorkspace) {
    if (uiState.activeWorkspace == null) onOpenDrawer()
  }
  LaunchedEffect(uiState.isDrawerOpen) {
    if (uiState.isDrawerOpen) {
      drawerState.open()
    } else {
      drawerState.close()
    }
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
        MarkdownWorkspacePanel(
          uiState = uiState,
          onOpenWorkspace = onOpenWorkspace,
          onOpenFile = onOpenFile,
          onReopenPath = onReopenPath,
          onSearchQueryChange = onSearchQueryChange,
          onToggleDirectory = onToggleDirectory,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace4, vertical = TnetSpace3)
        )
      }
    }
  ) {
    MarkdownDocumentSurface(
      uiState = uiState,
      onOpenDrawer = onOpenDrawer,
      modifier = modifier
    )
  }
}

@Composable
private fun MarkdownWorkspacePanel(
  uiState: MarkdownUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Markdown",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Open Markdown files from a synced desktop workspace in read-only mode.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    TnetPrimaryButton(text = "Open workspace", onClick = onOpenWorkspace)
    Text(
      text = uiState.activeWorkspace?.name ?: "No Markdown workspace selected.",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    TnetCompactTextField(
      value = uiState.searchQuery,
      onValueChange = onSearchQueryChange,
      label = "Search document"
    )
    MarkdownNavigationSummary(
      uiState = uiState,
      onReopenPath = onReopenPath
    )
    WorkspaceFileTree(
      items = uiState.fileTree,
      selectedPath = uiState.selectedPath,
      expandedPaths = uiState.expandedPaths,
      loadingDirectoryPaths = uiState.loadingDirectoryPaths,
      onOpenFile = onOpenFile,
      onToggleDirectory = onToggleDirectory
    )
  }
}

@Composable
private fun MarkdownDocumentSurface(
  uiState: MarkdownUiState,
  onOpenDrawer: () -> Unit,
  modifier: Modifier = Modifier
) {
  Box(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3)
  ) {
    when {
      uiState.isWorkspaceLoading -> TnetStateMessage(
        title = "Loading workspace...",
        detail = "Reading top-level Markdown files.",
        modifier = Modifier.fillMaxWidth()
      )

      uiState.isLoading -> TnetStateMessage(
        title = "Loading document...",
        detail = uiState.selectedPath ?: uiState.selectedUri,
        modifier = Modifier.fillMaxWidth()
      )

      uiState.error != null -> TnetStateMessage(
        title = "Markdown error",
        detail = uiState.error,
        isError = true,
        modifier = Modifier.fillMaxWidth()
      )

      uiState.blocks.isNotEmpty() -> MarkdownBlocksPreview(
        blocks = uiState.blocks,
        modifier = Modifier.fillMaxSize()
      )

      else -> TnetStateMessage(
        title = "No Markdown file selected",
        detail = "Swipe from the left edge or open the workspace panel.",
        modifier = Modifier.fillMaxWidth()
      )
    }
    if (uiState.blocks.isEmpty() && !uiState.isLoading && !uiState.isWorkspaceLoading) {
      TnetSecondaryButton(
        text = "Workspace",
        onClick = onOpenDrawer,
        modifier = Modifier.align(Alignment.BottomStart)
      )
    }
  }
}

@Composable
private fun MarkdownNavigationSummary(
  uiState: MarkdownUiState,
  onReopenPath: (String) -> Unit
) {
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      Text(
        text = "Opened files",
        style = MaterialTheme.typography.titleMedium
      )
      if (uiState.openedFiles.isEmpty()) {
        Text(
          text = "No files opened.",
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
      }
      uiState.openedFiles.forEach { path ->
        TnetSecondaryButton(
          text = path.substringAfterLast('/'),
          selected = uiState.selectedPath == path,
          onClick = { onReopenPath(path) }
        )
      }
      Text(
        text = "Outline: ${uiState.outline.joinToString(" > ").ifBlank { "No headings" }}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
      Text(
        text = "Search matches: ${uiState.searchMatches}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
  }
}
