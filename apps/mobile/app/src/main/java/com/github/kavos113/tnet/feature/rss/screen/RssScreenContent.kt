package com.github.kavos113.tnet.feature.rss.screen

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
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material.icons.rounded.MarkEmailUnread
import androidx.compose.material.icons.rounded.RssFeed
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material3.DrawerValue
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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssFolder
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetRadiusSmall
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetSurfaceHover
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssScreenContent(
  uiState: RssUiState,
  onUrlChange: (String) -> Unit,
  onFolderTitleChange: (String) -> Unit,
  onFolderDraftSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSearchQueryChange: (String) -> Unit,
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
          onUrlChange = onUrlChange,
          onFolderTitleChange = onFolderTitleChange,
          onFolderDraftSelected = onFolderDraftSelected,
          onBulkImportChange = onBulkImportChange,
          onSave = onSave,
          onSaveFolder = onSaveFolder,
          onImportBulk = onImportBulk,
          onImportTextFile = onImportTextFile,
          onCancel = onCancel,
          onSyncAll = onRefreshSelected,
          onSourceSelected = onSourceSelected,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace2, vertical = TnetSpace1)
        )
      }
    }
  ) {
    Box(modifier = modifier.fillMaxSize()) {
      RssArticleListSurface(
        uiState = uiState,
        onOpenDrawer = onOpenDrawer,
        onRefreshSelected = onRefreshSelected,
        onRefresh = onRefresh,
        onEdit = onEdit,
        onRemove = onRemove,
        onSearchQueryChange = onSearchQueryChange,
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
            .background(TnetSurface)
        ) {
          Box(
            modifier = Modifier
              .fillMaxSize()
              .padding(TnetSpace2)
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

@Composable
private fun RssDrawerPanel(
  uiState: RssUiState,
  onUrlChange: (String) -> Unit,
  onFolderTitleChange: (String) -> Unit,
  onFolderDraftSelected: (String?) -> Unit,
  onBulkImportChange: (String) -> Unit,
  onSave: () -> Unit,
  onSaveFolder: () -> Unit,
  onImportBulk: () -> Unit,
  onImportTextFile: () -> Unit,
  onCancel: () -> Unit,
  onSyncAll: () -> Unit,
  onSourceSelected: (RssSource) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace1)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2),
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text(text = "RSS Feeds", modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
      TnetPrimaryButton(text = if (uiState.isRefreshing) "Syncing" else "Sync All", onClick = onSyncAll)
    }
    RssSourceRow(
      title = "All (${uiState.items.count { !it.isRead }})",
      icon = { Icon(Icons.Rounded.Inbox, contentDescription = null) },
      selected = uiState.selectedSource == RssSource.All,
      onClick = { onSourceSelected(RssSource.All) }
    )
    RssSourceRow(
      title = "Unread (${uiState.items.count { !it.isRead }})",
      icon = { Icon(Icons.Rounded.MarkEmailUnread, contentDescription = null) },
      selected = uiState.selectedSource == RssSource.Unread,
      onClick = { onSourceSelected(RssSource.Unread) }
    )
    if (uiState.isFeedListLoading) {
      Text(
        text = "Loading feeds...",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    uiState.folders.forEach { folder ->
      RssSourceRow(
        title = "${folder.title} (${uiState.unreadCountForFolder(folder.id)})",
        icon = {
          Icon(
            if (uiState.selectedSource == RssSource.Folder(folder.id)) {
              Icons.Rounded.FolderOpen
            } else {
              Icons.Rounded.Folder
            },
            contentDescription = null
          )
        },
        selected = uiState.selectedSource == RssSource.Folder(folder.id),
        onClick = { onSourceSelected(RssSource.Folder(folder.id)) }
      )
      uiState.feeds.filter { it.folderId == folder.id }.forEach { feed ->
        RssFeedTreeRow(
          feed = feed,
          selected = uiState.selectedSource == RssSource.Feed(feed.id),
          indent = true,
          isSyncing = feed.id in uiState.syncingFeedIds,
          unreadCount = uiState.unreadCount(feed.id),
          onClick = { onSourceSelected(RssSource.Feed(feed.id)) }
        )
      }
    }
    RssFolderForm(
      title = uiState.folderTitleDraft,
      onTitleChange = onFolderTitleChange,
      onSave = onSaveFolder
    )
    RssFeedForm(
      uiState = uiState,
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
    Text(text = "Feeds", style = MaterialTheme.typography.labelLarge)
    if (uiState.feeds.isEmpty()) {
      Text(text = "No feeds yet.", color = TnetTextMuted)
    } else {
      uiState.feeds.filter { it.folderId == null }.forEach { feed ->
        RssFeedTreeRow(
          feed = feed,
          selected = uiState.selectedSource == RssSource.Feed(feed.id),
          isSyncing = feed.id in uiState.syncingFeedIds,
          unreadCount = uiState.unreadCount(feed.id),
          indent = false,
          onClick = { onSourceSelected(RssSource.Feed(feed.id)) },
        )
      }
    }
  }
}

@Composable
private fun RssSourceRow(
  title: String,
  icon: @Composable () -> Unit,
  selected: Boolean,
  onClick: () -> Unit
) {
  RssCompactTreeRow(selected = selected, onClick = onClick) {
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      Box(modifier = Modifier.size(18.dp)) {
        icon()
      }
      Text(text = title, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
    }
  }
}

@Composable
private fun RssFeedTreeRow(
  feed: RssFeed,
  selected: Boolean,
  indent: Boolean,
  isSyncing: Boolean,
  unreadCount: Int,
  onClick: () -> Unit
) {
  RssCompactTreeRow(selected = selected, onClick = onClick) {
    Row(
      modifier = Modifier.padding(start = if (indent) TnetSpace4 else 0.dp),
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2)
    ) {
      Icon(
        if (isSyncing) Icons.Rounded.Sync else Icons.Rounded.RssFeed,
        contentDescription = null,
        modifier = Modifier.size(18.dp)
      )
      Text(text = "${feed.title} ($unreadCount)", style = MaterialTheme.typography.bodyMedium, maxLines = 1)
    }
  }
}

@Composable
private fun RssCompactTreeRow(
  selected: Boolean,
  onClick: () -> Unit,
  content: @Composable () -> Unit
) {
  Box(
    modifier = Modifier
      .fillMaxWidth()
      .background(
        color = if (selected) TnetSurfaceHover else TnetSurface,
        shape = RoundedCornerShape(TnetRadiusSmall)
      )
      .clickable(onClick = onClick)
      .defaultMinSize(minHeight = 24.dp)
      .padding(horizontal = TnetSpace2, vertical = 1.dp),
    contentAlignment = Alignment.CenterStart
  ) {
    content()
  }
}

@Composable
private fun RssArticleListSurface(
  uiState: RssUiState,
  onOpenDrawer: () -> Unit,
  onRefreshSelected: () -> Unit,
  onRefresh: (RssFeed) -> Unit,
  onEdit: (RssFeed) -> Unit,
  onRemove: (RssFeed) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onItemSelected: (RssItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(0.dp),
    verticalArrangement = Arrangement.spacedBy(TnetSpace1)
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = TnetSpace2, vertical = TnetSpace1),
      horizontalArrangement = Arrangement.spacedBy(TnetSpace2),
      verticalAlignment = Alignment.CenterVertically
    ) {
      TnetSecondaryButton(text = "Feeds", onClick = onOpenDrawer)
      Text(text = uiState.selectedSourceTitle, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
    }
    TnetCompactTextField(
      value = uiState.searchQuery,
      onValueChange = onSearchQueryChange,
      label = "Search items",
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = TnetSpace2)
    )
    uiState.selectedFeed?.let { feed ->
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = TnetSpace2),
        horizontalArrangement = Arrangement.spacedBy(TnetSpace2)
      ) {
        TnetSecondaryButton(text = if (feed.id in uiState.syncingFeedIds) "Syncing" else "Refresh", onClick = { onRefresh(feed) })
        TnetSecondaryButton(text = "Edit", onClick = { onEdit(feed) })
        TnetSecondaryButton(text = "Delete", onClick = { onRemove(feed) })
      }
    }
    when {
      uiState.visibleFeeds.isEmpty() -> TnetStateMessage(
        title = "No feeds selected",
        detail = "Swipe from the left edge or open the feeds panel.",
        modifier = Modifier.fillMaxWidth()
      )

      uiState.isItemsLoading -> TnetStateMessage(
        title = "Loading cached RSS items...",
        detail = "Feeds are available while article counts load.",
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
        modifier = Modifier
          .fillMaxWidth()
          .weight(1f),
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
      uiState = previewRssUiState(isDrawerOpen = false),
      onUrlChange = {},
      onFolderTitleChange = {},
      onFolderDraftSelected = {},
      onBulkImportChange = {},
      onSearchQueryChange = {},
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

@Preview(showBackground = true)
@Composable
private fun RssScreenContentDrawerPreview() {
  TnetTheme {
    RssScreenContent(
      uiState = previewRssUiState(isDrawerOpen = true, syncingFeedIds = setOf("feed-preview")),
      onUrlChange = {},
      onFolderTitleChange = {},
      onFolderDraftSelected = {},
      onBulkImportChange = {},
      onSearchQueryChange = {},
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

@Preview(showBackground = true)
@Composable
private fun RssScreenContentDetailPreview() {
  TnetTheme {
    RssScreenContent(
      uiState = previewRssUiState(
        isDrawerOpen = false,
        selectedItem = previewRssItems.first(),
        isArticlePanelOpen = true
      ),
      onUrlChange = {},
      onFolderTitleChange = {},
      onFolderDraftSelected = {},
      onBulkImportChange = {},
      onSearchQueryChange = {},
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

@Preview(showBackground = true)
@Composable
private fun RssDrawerPanelPreview() {
  TnetTheme {
    RssDrawerPanel(
      uiState = previewRssUiState(syncingFeedIds = setOf("feed-preview")),
      onUrlChange = {},
      onFolderTitleChange = {},
      onFolderDraftSelected = {},
      onBulkImportChange = {},
      onSave = {},
      onSaveFolder = {},
      onImportBulk = {},
      onImportTextFile = {},
      onCancel = {},
      onSyncAll = {},
      onSourceSelected = {},
      modifier = Modifier.padding(16.dp)
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun RssArticleListSurfacePreview() {
  TnetTheme {
    RssArticleListSurface(
      uiState = previewRssUiState(isDrawerOpen = false),
      onOpenDrawer = {},
      onRefreshSelected = {},
      onRefresh = {},
      onEdit = {},
      onRemove = {},
      onSearchQueryChange = {},
      onItemSelected = {},
      modifier = Modifier.fillMaxSize()
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun RssArticleListSurfaceEmptyPreview() {
  TnetTheme {
    RssArticleListSurface(
      uiState = RssUiState(isFeedListLoading = false, isItemsLoading = false, isDrawerOpen = false),
      onOpenDrawer = {},
      onRefreshSelected = {},
      onRefresh = {},
      onEdit = {},
      onRemove = {},
      onSearchQueryChange = {},
      onItemSelected = {},
      modifier = Modifier.fillMaxSize()
    )
  }
}

private fun previewRssUiState(
  isDrawerOpen: Boolean = false,
  syncingFeedIds: Set<String> = emptySet(),
  selectedItem: RssItem? = null,
  isArticlePanelOpen: Boolean = false
): RssUiState {
  val folder = RssFolder(id = "folder-research", title = "Research")
  val feed = previewRssFeed.copy(folderId = folder.id)
  val engineeringFeed = previewRssFeed.copy(
    id = "feed-2",
    title = "Engineering",
    url = "https://example.com/engineering.xml"
  )
  return RssUiState(
    feeds = listOf(feed, engineeringFeed),
    folders = listOf(folder),
    urlDraft = "https://example.com/feed.xml",
    folderTitleDraft = "Product",
    bulkImportDraft = "https://example.com/news.xml",
    selectedSource = RssSource.Feed(feed.id),
    selectedItem = selectedItem,
    items = previewRssItems.mapIndexed { index, item ->
      item.copy(
        id = "item-$index",
        feedId = feed.id,
        isRead = index == 1
      )
    },
    isDrawerOpen = isDrawerOpen,
    isFeedListLoading = false,
    isItemsLoading = false,
    isRefreshing = syncingFeedIds.isNotEmpty(),
    syncingFeedIds = syncingFeedIds,
    isArticlePanelOpen = isArticlePanelOpen
  )
}
