package com.github.kavos113.tnet.feature.papers.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.rounded.LibraryBooks
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.KeyboardArrowDown
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.pdf.screen.PdfPagePreview
import com.github.kavos113.tnet.feature.pdf.screen.PdfUiState
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetSurfaceHover
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersScreenContent(
  uiState: PapersUiState,
  onPaperSelected: (PaperListItem) -> Unit,
  onBack: () -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onDirectoryFilterChange: (String) -> Unit,
  onSortModeChange: (PapersSortMode) -> Unit,
  onSelectDirectory: (WorkspaceFileItem?) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  onOpenDrawer: () -> Unit,
  onCloseDrawer: () -> Unit,
  onDetailTabSelected: (PapersDetailTab) -> Unit,
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
        PapersFolderDrawer(
          uiState = uiState,
          onSelectDirectory = onSelectDirectory,
          onToggleDirectory = onToggleDirectory,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace2, vertical = TnetSpace2)
        )
      }
    }
  ) {
    Box(modifier = modifier.fillMaxSize()) {
      PapersListSurface(
        uiState = uiState,
        onPaperSelected = onPaperSelected,
        onSearchQueryChange = onSearchQueryChange,
        onDirectoryFilterChange = onDirectoryFilterChange,
        onSortModeChange = onSortModeChange,
        onOpenDrawer = onOpenDrawer,
        modifier = Modifier.fillMaxSize()
      )
      if (uiState.isDetailPanelOpen) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.22f))
        )
      }
      AnimatedVisibility(
        visible = uiState.isDetailPanelOpen,
        enter = slideInHorizontally(animationSpec = tween(220), initialOffsetX = { it }),
        exit = slideOutHorizontally(animationSpec = tween(180), targetOffsetX = { it }),
        modifier = Modifier.align(Alignment.CenterEnd)
      ) {
        Box(
          modifier = Modifier
            .fillMaxHeight()
            .fillMaxWidth()
            .background(TnetSurface)
        ) {
          PapersDetailPanel(
            uiState = uiState,
            onBack = onBack,
            onDetailTabSelected = onDetailTabSelected,
            onPreviousPage = onPreviousPage,
            onNextPage = onNextPage,
            onZoomOut = onZoomOut,
            onZoomIn = onZoomIn,
            onRotate = onRotate,
            modifier = Modifier
              .fillMaxSize()
              .padding(if (uiState.detailTab == PapersDetailTab.Pdf) 0.dp else TnetSpace2)
          )
        }
      }
    }
  }
}

@Composable
private fun PapersFolderDrawer(
  uiState: PapersUiState,
  onSelectDirectory: (WorkspaceFileItem?) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace1)
  ) {
    Text(text = "Papers", style = MaterialTheme.typography.titleLarge)
    PapersWorkspaceStatus(
      workspaceUri = uiState.workspaceUri,
      databaseUri = uiState.databaseUri,
      isSqliteOnlyMode = uiState.isSqliteOnlyMode,
      validation = uiState.validation
    )
    PapersFolderRow(
      title = "All papers",
      depth = 0,
      selected = uiState.selectedDirectoryPath == null,
      iconOpen = true,
      hasChildren = false,
      isLoading = false,
      onClick = { onSelectDirectory(null) }
    )
    if (uiState.isWorkspaceLoading) {
      TnetStateMessage(title = "Loading folders...", detail = "Reading top-level paper folders.")
    }
    uiState.fileTree.forEach { item ->
      PapersFolderTreeItem(
        item = item,
        depth = 0,
        selectedPath = uiState.selectedDirectoryPath,
        expandedPaths = uiState.expandedPaths,
        loadingDirectoryPaths = uiState.loadingDirectoryPaths,
        onSelectDirectory = onSelectDirectory,
        onToggleDirectory = onToggleDirectory
      )
    }
    if (!uiState.isWorkspaceLoading && uiState.fileTree.isEmpty() && uiState.workspaceUri != null) {
      Text(text = "No folders.", style = MaterialTheme.typography.bodySmall, color = TnetTextMuted)
    }
  }
}

@Composable
private fun PapersFolderTreeItem(
  item: WorkspaceFileItem,
  depth: Int,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  onSelectDirectory: (WorkspaceFileItem?) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit
) {
  if (!item.isDirectory) return
  val expanded = item.relativePath in expandedPaths
  Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
    PapersFolderRow(
      title = item.name,
      depth = depth,
      selected = selectedPath == item.relativePath,
      iconOpen = expanded,
      hasChildren = true,
      isLoading = item.relativePath in loadingDirectoryPaths,
      onClick = {
        onSelectDirectory(item)
        onToggleDirectory(item)
      }
    )
    if (expanded) {
      if (item.relativePath in loadingDirectoryPaths) {
        Text(
          text = "Loading...",
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted,
          modifier = Modifier.padding(start = ((depth + 1) * 10).dp)
        )
      }
      item.children.forEach { child ->
        PapersFolderTreeItem(
          item = child,
          depth = depth + 1,
          selectedPath = selectedPath,
          expandedPaths = expandedPaths,
          loadingDirectoryPaths = loadingDirectoryPaths,
          onSelectDirectory = onSelectDirectory,
          onToggleDirectory = onToggleDirectory
        )
      }
    }
  }
}

@Composable
private fun PapersFolderRow(
  title: String,
  depth: Int,
  selected: Boolean,
  iconOpen: Boolean,
  hasChildren: Boolean,
  isLoading: Boolean,
  onClick: () -> Unit
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(start = (depth * 10).dp)
      .background(if (selected) TnetSurfaceHover else Color.Transparent)
      .clickable(onClick = onClick)
      .padding(horizontal = TnetSpace1, vertical = 2.dp),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace1),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Icon(
      imageVector = when {
        !hasChildren -> Icons.AutoMirrored.Rounded.LibraryBooks
        iconOpen -> Icons.Rounded.KeyboardArrowDown
        else -> Icons.AutoMirrored.Rounded.KeyboardArrowRight
      },
      contentDescription = null,
      tint = TnetTextMuted,
      modifier = Modifier.size(16.dp)
    )
    Icon(
      imageVector = if (iconOpen) Icons.Rounded.FolderOpen else Icons.Rounded.Folder,
      contentDescription = null,
      tint = TnetTextMuted,
      modifier = Modifier.size(16.dp)
    )
    Text(text = if (isLoading) "$title..." else title, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
  }
}

@Composable
private fun PapersListSurface(
  uiState: PapersUiState,
  onPaperSelected: (PaperListItem) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onDirectoryFilterChange: (String) -> Unit,
  onSortModeChange: (PapersSortMode) -> Unit,
  onOpenDrawer: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace2, vertical = TnetSpace1),
    verticalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2),
      verticalAlignment = Alignment.CenterVertically
    ) {
      TnetSecondaryButton(text = "Folders", onClick = onOpenDrawer)
      Text(
        text = uiState.selectedDirectoryPath ?: "All papers",
        style = MaterialTheme.typography.titleMedium,
        modifier = Modifier.weight(1f)
      )
    }
    PapersFilterBar(
      uiState = uiState,
      onSearchQueryChange = onSearchQueryChange,
      onDirectoryFilterChange = onDirectoryFilterChange,
      onSortModeChange = onSortModeChange
    )
    PapersListPreview(
      papers = uiState.visiblePapers,
      onPaperSelected = onPaperSelected,
      modifier = Modifier.weight(1f)
    )
  }
}

@Composable
private fun PapersDetailPanel(
  uiState: PapersUiState,
  onBack: () -> Unit,
  onDetailTabSelected: (PapersDetailTab) -> Unit,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Row(
      modifier = Modifier.padding(
        horizontal = if (uiState.detailTab == PapersDetailTab.Pdf) TnetSpace2 else 0.dp,
        vertical = if (uiState.detailTab == PapersDetailTab.Pdf) TnetSpace1 else 0.dp
      ),
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2),
      verticalAlignment = Alignment.CenterVertically
    ) {
      TnetSecondaryButton(text = "Back", onClick = onBack)
      FilterChip(
        selected = uiState.detailTab == PapersDetailTab.Pdf,
        onClick = { onDetailTabSelected(PapersDetailTab.Pdf) },
        label = { Text("PDF") }
      )
      FilterChip(
        selected = uiState.detailTab == PapersDetailTab.Metadata,
        onClick = { onDetailTabSelected(PapersDetailTab.Metadata) },
        label = { Text("Metadata") }
      )
    }

    when (uiState.detailTab) {
      PapersDetailTab.Pdf -> PapersPdfDetail(
        uiState = uiState,
        onPreviousPage = onPreviousPage,
        onNextPage = onNextPage,
        onZoomOut = onZoomOut,
        onZoomIn = onZoomIn,
        onRotate = onRotate,
        modifier = Modifier.weight(1f)
      )

      PapersDetailTab.Metadata -> Box(modifier = Modifier.weight(1f)) {
        PaperDetailPreview(
          paper = uiState.selectedPaper,
          onBack = onBack,
          showBackButton = false
        )
      }
    }
  }
}

@Composable
private fun PapersPdfDetail(
  uiState: PapersUiState,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  Box(modifier = modifier.fillMaxSize()) {
    when {
      uiState.isPdfLoading -> TnetStateMessage(title = "Rendering PDF...")
      uiState.pdfError != null -> TnetStateMessage(
        title = "PDF preview unavailable",
        detail = uiState.pdfError,
        isError = true
      )
      uiState.pageBitmap == null -> TnetStateMessage(
        title = "No PDF",
        detail = "Metadata is still available for this paper."
      )
      else -> PdfPagePreview(
        uiState = PdfUiState(
          selectedUri = uiState.selectedPdfUri,
          pageBitmap = uiState.pageBitmap,
          pageIndex = uiState.pageIndex,
          pageCount = uiState.pageCount,
          zoom = uiState.zoom,
          rotation = uiState.rotation,
          isLoading = uiState.isPdfLoading
        ),
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

@Preview(showBackground = true)
@Composable
private fun PapersScreenContentPreview() {
  TnetTheme {
    PapersScreenContent(
      uiState = PapersUiState(
        workspaceUri = "content://workspace/root",
        papers = Result.success(
          listOf(
            previewPaperListItem,
            previewPaperListItem.copy(
              id = "paper-2",
              title = "SQLite workspace sharing on Android",
              publishedYear = 2025,
              venue = "Local-first Workshop",
              pdfPath = null
            )
          )
        )
      ),
      onPaperSelected = {},
      onBack = {},
      onSearchQueryChange = {},
      onDirectoryFilterChange = {},
      onSortModeChange = {},
      onSelectDirectory = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {},
      onDetailTabSelected = {},
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
private fun PaperDetailScreenPreview() {
  TnetTheme {
    PapersScreenContent(
      uiState = PapersUiState(
        workspaceUri = "content://workspace/root",
        selectedPaperId = "paper-preview",
        selectedPaper = Result.success(previewPaperDetail),
        detailTab = PapersDetailTab.Metadata
      ),
      onPaperSelected = {},
      onBack = {},
      onSearchQueryChange = {},
      onDirectoryFilterChange = {},
      onSortModeChange = {},
      onSelectDirectory = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {},
      onDetailTabSelected = {},
      onPreviousPage = {},
      onNextPage = {},
      onZoomOut = {},
      onZoomIn = {},
      onRotate = {}
    )
  }
}
