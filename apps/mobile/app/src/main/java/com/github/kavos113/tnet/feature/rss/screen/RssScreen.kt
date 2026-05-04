package com.github.kavos113.tnet.feature.rss.screen

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun RssScreen(
  modifier: Modifier = Modifier,
  viewModel: RssViewModel = viewModel()
) {
  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()
  val uiState by viewModel.uiState.collectAsState()
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
      viewModel.importFeedsFromText(text.orEmpty())
    }
  }

  RssScreenContent(
    uiState = uiState,
    onTitleChange = viewModel::updateTitleDraft,
    onUrlChange = viewModel::updateUrlDraft,
    onBulkImportChange = viewModel::updateBulkImportDraft,
    onSave = viewModel::saveFeed,
    onImportBulk = { viewModel.importFeedsFromText() },
    onImportTextFile = { openTextFile.launch(arrayOf("text/plain", "text/*")) },
    onCancel = viewModel::cancelEditing,
    onRefresh = viewModel::refreshFeed,
    onEdit = viewModel::editFeed,
    onRemove = viewModel::removeFeed,
    onItemSelected = viewModel::selectItem,
    onItemBack = viewModel::closeItem,
    modifier = modifier
  )
}
