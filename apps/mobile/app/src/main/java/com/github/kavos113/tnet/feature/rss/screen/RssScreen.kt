package com.github.kavos113.tnet.feature.rss.screen

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.room.Room
import com.github.kavos113.tnet.feature.rss.model.RoomRssRepository
import com.github.kavos113.tnet.feature.rss.model.RssDatabase
import com.github.kavos113.tnet.feature.rss.model.RSS_MIGRATION_1_2
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun RssScreen(
  modifier: Modifier = Modifier,
  providedViewModel: RssViewModel? = null
) {
  val context = LocalContext.current
  val database = remember {
    Room.databaseBuilder(
      context.applicationContext,
      RssDatabase::class.java,
      "tnet-rss.db"
    ).addMigrations(RSS_MIGRATION_1_2).build()
  }
  val rssViewModel: RssViewModel = providedViewModel ?: viewModel(
    factory = viewModelFactory {
      initializer {
        RssViewModel(RoomRssRepository(database.rssDao()))
      }
    }
  )
  val coroutineScope = rememberCoroutineScope()
  val uiState by rssViewModel.uiState.collectAsState()
  val openTextFile = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    coroutineScope.launch {
      val text = withContext(Dispatchers.IO) {
        context.contentResolver.openInputStream(uri)?.use { input ->
          input.bufferedReader().use { it.readText() }
        }
      }
      rssViewModel.importFeedsFromText(text.orEmpty())
    }
  }

  RssScreenContent(
    uiState = uiState,
    onUrlChange = rssViewModel::updateUrlDraft,
    onFolderTitleChange = rssViewModel::updateFolderTitleDraft,
    onFolderDraftSelected = rssViewModel::selectFolderDraft,
    onBulkImportChange = rssViewModel::updateBulkImportDraft,
    onSearchQueryChange = rssViewModel::updateSearchQuery,
    onSave = rssViewModel::saveFeed,
    onSaveFolder = rssViewModel::saveFolder,
    onImportBulk = { rssViewModel.importFeedsFromText() },
    onImportTextFile = { openTextFile.launch(arrayOf("text/plain", "text/*")) },
    onCancel = rssViewModel::cancelEditing,
    onRefresh = rssViewModel::refreshFeed,
    onRefreshSelected = rssViewModel::refreshSelectedSource,
    onEdit = rssViewModel::editFeed,
    onRemove = rssViewModel::removeFeed,
    onSourceSelected = rssViewModel::selectSource,
    onOpenDrawer = rssViewModel::openDrawer,
    onCloseDrawer = rssViewModel::closeDrawer,
    onItemSelected = rssViewModel::selectItem,
    onItemBack = rssViewModel::closeItem,
    modifier = modifier
  )
}
