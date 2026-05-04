package com.github.kavos113.tnet.feature.markdown.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
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
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetTextMuted

@Composable
internal fun MarkdownScreenContent(
  uiState: MarkdownUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onDrawerPanelSelected: (MarkdownDrawerPanel) -> Unit,
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
          onSearchQueryChange = onSearchQueryChange,
          onDrawerPanelSelected = onDrawerPanelSelected,
          onToggleDirectory = onToggleDirectory,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace3, vertical = TnetSpace2)
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
  onSearchQueryChange: (String) -> Unit,
  onDrawerPanelSelected: (MarkdownDrawerPanel) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Text(
      text = "Markdown",
      style = MaterialTheme.typography.titleLarge
    )
    Row(
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2),
      verticalAlignment = Alignment.CenterVertically
    ) {
      TnetPrimaryButton(text = "Open workspace", onClick = onOpenWorkspace)
      Text(
        text = uiState.activeWorkspace?.name ?: "No workspace",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted,
        maxLines = 1,
        modifier = Modifier.weight(1f)
      )
    }

    MarkdownDrawerPanelSwitch(
      selectedPanel = uiState.drawerPanel,
      onPanelSelected = onDrawerPanelSelected
    )

    when (uiState.drawerPanel) {
      MarkdownDrawerPanel.Files -> {
        uiState.selectedPath?.let { path ->
          Text(
            text = path.substringAfterLast('/'),
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted
          )
        }
        WorkspaceFileTree(
          items = uiState.fileTree,
          selectedPath = uiState.selectedPath,
          expandedPaths = uiState.expandedPaths,
          loadingDirectoryPaths = uiState.loadingDirectoryPaths,
          onOpenFile = onOpenFile,
          onToggleDirectory = onToggleDirectory
        )
      }

      MarkdownDrawerPanel.Search -> {
        TnetCompactTextField(
          value = uiState.searchQuery,
          onValueChange = onSearchQueryChange,
          label = "Search document",
          modifier = Modifier.fillMaxWidth()
        )
        Text(
          text = "Matches: ${uiState.searchMatches}",
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
        Text(
          text = "Outline: ${uiState.outline.joinToString(" > ").ifBlank { "No headings" }}",
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
      }
    }
  }
}

@Composable
private fun MarkdownDrawerPanelSwitch(
  selectedPanel: MarkdownDrawerPanel,
  onPanelSelected: (MarkdownDrawerPanel) -> Unit,
  modifier: Modifier = Modifier
) {
  Row(
    modifier = modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    FilterChip(
      selected = selectedPanel == MarkdownDrawerPanel.Files,
      onClick = { onPanelSelected(MarkdownDrawerPanel.Files) },
      label = { Text("Files") },
      leadingIcon = {
        Icon(
          imageVector = Icons.Rounded.FolderOpen,
          contentDescription = null
        )
      },
      modifier = Modifier.weight(1f)
    )
    FilterChip(
      selected = selectedPanel == MarkdownDrawerPanel.Search,
      onClick = { onPanelSelected(MarkdownDrawerPanel.Search) },
      label = { Text("Search") },
      leadingIcon = {
        Icon(
          imageVector = Icons.Rounded.Search,
          contentDescription = null
        )
      },
      modifier = Modifier.weight(1f)
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

      uiState.renderedHtml.isNotBlank() -> MarkdownHtmlPreview(
        html = uiState.renderedHtml,
        modifier = Modifier.fillMaxSize()
      )

      else -> TnetStateMessage(
        title = "No Markdown file selected",
        detail = "Swipe from the left edge or open the workspace panel.",
        modifier = Modifier.fillMaxWidth()
      )
    }
    if (!uiState.isLoading && !uiState.isWorkspaceLoading) {
      TnetSecondaryButton(
        text = if (uiState.renderedHtml.isBlank()) "Workspace" else "Files",
        onClick = onOpenDrawer,
        modifier = Modifier.align(Alignment.BottomStart)
      )
    }
  }
}
