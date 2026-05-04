package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssScreenContent(
  uiState: RssUiState,
  onTitleChange: (String) -> Unit,
  onUrlChange: (String) -> Unit,
  onFolderTitleChange: (String) -> Unit,
  onFolderDraftSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onSaveFolder: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit,
  onRefresh: (RssFeed) -> Unit,
  onRefreshSelected: () -> Unit,
  onEdit: (RssFeed) -> Unit,
  onRemove: (RssFeed) -> Unit,
  onSourceSelected: (RssSource) -> Unit,
  onOpenDrawer: () -> Unit,
  onCloseDrawer: () -> Unit,
  onItemSelected: (RssItem) -> Unit,
  onItemBack: () -> Unit,
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
      ModalDrawerSheet(modifier = Modifier.fillMaxWidth(0.88f)) {
        RssDrawerPanel(
          uiState = uiState,
          onTitleChange = onTitleChange,
          onUrlChange = onUrlChange,
          onFolderTitleChange = onFolderTitleChange,
          onFolderDraftSelected = onFolderDraftSelected,
          onBulkImportChange = onBulkImportChange,
          onSave = onSave,
          onSaveFolder = onSaveFolder,
          onImportBulk = onImportBulk,
          onImportTextFile = onImportTextFile,
          onCancel = onCancel,
          onRefresh = onRefresh,
          onEdit = onEdit,
          onRemove = onRemove,
          onSourceSelected = onSourceSelected,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace3, vertical = TnetSpace2)
        )
      }
    }
  ) {
    Box(modifier = modifier.fillMaxSize()) {
      RssArticleListSurface(
        uiState = uiState,
        onOpenDrawer = onOpenDrawer,
        onRefreshSelected = onRefreshSelected,
        onItemSelected = onItemSelected,
        modifier = Modifier.fillMaxSize()
      )
      AnimatedVisibility(
        visible = uiState.isArticlePanelOpen,
        enter = slideInHorizontally(animationSpec = tween(220), initialOffsetX = { it }),
        exit = slideOutHorizontally(animationSpec = tween(180), targetOffsetX = { it }),
        modifier = Modifier.align(Alignment.CenterEnd)
      ) {
        Box(
          modifier = Modifier
            .fillMaxHeight()
            .fillMaxWidth(0.94f)
            .padding(start = TnetSpace2)
        ) {
          androidx.compose.material3.Surface(
            modifier = Modifier.fillMaxSize(),
            color = TnetSurface,
            tonalElevation = 6.dp,
            shadowElevation = 8.dp
          ) {
            Box(
              modifier = Modifier
                .fillMaxSize()
                .padding(TnetSpace3)
            ) {
              RssItemDetail(
                item = uiState.selectedItem,
                onBack = onItemBack
              )
            }
          }
        }
      }
    }
  }
}

@Composable
private fun RssDrawerPanel(
  uiState: RssUiState,
  onTitleChange: (String) -> Unit,
  onUrlChange: (String) -> Unit,
  onFolderTitleChange: (String) -> Unit,
  onFolderDraftSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onSaveFolder: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit,
  onRefresh: (RssFeed) -> Unit,
  onEdit: (RssFeed) -> Unit,
  onRemove: (RssFeed) -> Unit,
  onSourceSelected: (RssSource) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    Text(text = "RSS", style = MaterialTheme.typography.titleLarge)
    RssSourceRow(
      title = "All feeds",
      selected = uiState.selectedSource == RssSource.All,
      onClick = { onSourceSelected(RssSource.All) }
    )
    uiState.folders.forEach { folder ->
      RssSourceRow(
        title = folder.title,
        selected = uiState.selectedSource == RssSource.Folder(folder.id),
        onClick = { onSourceSelected(RssSource.Folder(folder.id)) }
      )
    }
    RssFolderForm(
      title = uiState.folderTitleDraft,
      onTitleChange = onFolderTitleChange,
      onSave = onSaveFolder
    )
    RssFeedForm(
      uiState = uiState,
      onTitleChange = onTitleChange,
      onUrlChange = onUrlChange,
      onFolderSelected = onFolderDraftSelected,
      onBulkImportChange = onBulkImportChange,
      onSave = onSave,
      onImportBulk = onImportBulk,
      onImportTextFile = onImportTextFile,
      onCancel = onCancel
    )
    uiState.importMessage?.let {
      Text(text = it, style = MaterialTheme.typography.bodyMedium, color = TnetTextMuted)
    }
    uiState.error?.let {
      Text(text = it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
    }
    Text(text = "Feeds", style = MaterialTheme.typography.titleMedium)
    if (uiState.feeds.isEmpty()) {
      Text(text = "No feeds yet.", color = TnetTextMuted)
    } else {
      uiState.feeds.forEach { feed ->
        RssFeedRow(
          feed = feed,
          selected = uiState.selectedSource == RssSource.Feed(feed.id),
          onClick = { onSourceSelected(RssSource.Feed(feed.id)) },
          onRefresh = { onRefresh(feed) },
          onEdit = { onEdit(feed) },
          onRemove = { onRemove(feed) }
        )
      }
    }
  }
}

@Composable
private fun RssSourceRow(
  title: String,
  selected: Boolean,
  onClick: () -> Unit
) {
  TnetListRow(selected = selected, onClick = onClick) {
    Text(text = title, style = MaterialTheme.typography.bodyLarge)
  }
}

@Composable
private fun RssArticleListSurface(
  uiState: RssUiState,
  onOpenDrawer: () -> Unit,
  onRefreshSelected: () -> Unit,
  onItemSelected: (RssItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .verticalScroll(rememberScrollState())
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace2)
  ) {
    TnetSecondaryButton(text = "Feeds", onClick = onOpenDrawer)
    Text(text = uiState.selectedSourceTitle, style = MaterialTheme.typography.headlineSmall)
    TnetPrimaryButton(
      text = if (uiState.isRefreshing) "Refreshing..." else "Refresh",
      onClick = onRefreshSelected
    )
    when {
      uiState.visibleFeeds.isEmpty() -> TnetStateMessage(
        title = "No feeds selected",
        detail = "Swipe from the left edge or open the feeds panel.",
        modifier = Modifier.fillMaxWidth()
      )

      uiState.visibleItems.isEmpty() -> TnetStateMessage(
        title = "No RSS items yet",
        detail = "Refresh this source to fetch articles.",
        modifier = Modifier.fillMaxWidth()
      )

      else -> RssItemList(
        selectedFeedTitle = uiState.selectedSourceTitle,
        items = uiState.visibleItems,
        onItemSelected = onItemSelected
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssScreenContentPreview() {
  TnetTheme {
    RssScreenContent(
      uiState = RssUiState(
        feeds = listOf(previewRssFeed, previewRssFeed.copy(id = "feed-2", title = "Engineering")),
        titleDraft = "New feed",
        urlDraft = "https://example.com/feed.xml",
        items = previewRssItems.map { it.copy(feedId = "feed-preview") },
        isDrawerOpen = false
      ),
      onTitleChange = {},
      onUrlChange = {},
      onFolderTitleChange = {},
      onFolderDraftSelected = {},
      onBulkImportChange = {},
      onSave = {},
      onSaveFolder = {},
      onImportBulk = {},
      onImportTextFile = {},
      onCancel = {},
      onRefresh = {},
      onRefreshSelected = {},
      onEdit = {},
      onRemove = {},
      onSourceSelected = {},
      onOpenDrawer = {},
      onCloseDrawer = {},
      onItemSelected = {},
      onItemBack = {}
    )
  }
}
