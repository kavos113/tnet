package com.github.kavos113.tnet.core.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.tnetSettingsDataStore by preferencesDataStore(name = "tnet_mobile_settings")

class TnetSettingsRepository(
  private val context: Context
) {
  val settings: Flow<TnetSettings> = context.tnetSettingsDataStore.data.map { preferences ->
    TnetSettings(
      papersWorkspaceUri = preferences[PAPERS_WORKSPACE_URI],
      papersDatabaseUri = preferences[PAPERS_DATABASE_URI],
      markdownWorkspaceUris = preferences[MARKDOWN_WORKSPACE_URIS].decodeList(),
      activeMarkdownWorkspaceUri = preferences[ACTIVE_MARKDOWN_WORKSPACE_URI],
      pdfWorkspaceUris = preferences[PDF_WORKSPACE_URIS].decodeList(),
      activePdfWorkspaceUri = preferences[ACTIVE_PDF_WORKSPACE_URI],
      markdownOpenedFiles = preferences[MARKDOWN_OPENED_FILES].decodeList(),
      activeMarkdownPath = selectActiveMarkdownPath(
        activePath = preferences[ACTIVE_MARKDOWN_PATH],
        legacyOpenedFiles = preferences[MARKDOWN_OPENED_FILES].decodeList()
      ),
      activeMarkdownUri = preferences[ACTIVE_MARKDOWN_URI],
      pdfOpenedFiles = preferences[PDF_OPENED_FILES].decodeList(),
      activePdfIndex = preferences[ACTIVE_PDF_INDEX] ?: -1,
      lastOpenedDestination = preferences[LAST_OPENED_DESTINATION],
      theme = preferences[THEME] ?: "light",
      markdownViewerPosition = preferences[MARKDOWN_VIEWER_POSITION] ?: 0,
      pdfViewerPosition = preferences[PDF_VIEWER_POSITION] ?: 0
    )
  }

  suspend fun savePapersWorkspaceUri(uri: String) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[PAPERS_WORKSPACE_URI] = uri
    }
  }

  suspend fun savePapersDatabaseUri(uri: String) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[PAPERS_DATABASE_URI] = uri
    }
  }

  suspend fun saveLastOpenedDestination(destination: String) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[LAST_OPENED_DESTINATION] = destination
    }
  }

  suspend fun saveMarkdownWorkspaceUri(uri: String) {
    context.tnetSettingsDataStore.edit { preferences ->
      val roots = (preferences[MARKDOWN_WORKSPACE_URIS].decodeList() + uri).distinct()
      preferences[MARKDOWN_WORKSPACE_URIS] = roots.encodeList()
      preferences[ACTIVE_MARKDOWN_WORKSPACE_URI] = uri
    }
  }

  suspend fun savePdfWorkspaceUri(uri: String) {
    context.tnetSettingsDataStore.edit { preferences ->
      val roots = (preferences[PDF_WORKSPACE_URIS].decodeList() + uri).distinct()
      preferences[PDF_WORKSPACE_URIS] = roots.encodeList()
      preferences[ACTIVE_PDF_WORKSPACE_URI] = uri
    }
  }

  suspend fun saveMarkdownSession(
    selectedPath: String?,
    selectedUri: String?,
    viewerPosition: Int
  ) {
    context.tnetSettingsDataStore.edit { preferences ->
      if (selectedPath.isNullOrBlank()) {
        preferences.remove(ACTIVE_MARKDOWN_PATH)
      } else {
        preferences[ACTIVE_MARKDOWN_PATH] = selectedPath
      }
      if (selectedUri.isNullOrBlank()) {
        preferences.remove(ACTIVE_MARKDOWN_URI)
      } else {
        preferences[ACTIVE_MARKDOWN_URI] = selectedUri
      }
      preferences[MARKDOWN_VIEWER_POSITION] = viewerPosition.coerceAtLeast(0)
    }
  }

  suspend fun savePdfSession(
    openedFiles: List<String>,
    activeIndex: Int,
    viewerPosition: Int
  ) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[PDF_OPENED_FILES] = openedFiles.distinct().encodeList()
      preferences[ACTIVE_PDF_INDEX] = activeIndex
      preferences[PDF_VIEWER_POSITION] = viewerPosition.coerceAtLeast(0)
    }
  }

  suspend fun saveMarkdownViewerPosition(position: Int) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[MARKDOWN_VIEWER_POSITION] = position.coerceAtLeast(0)
    }
  }

  suspend fun savePdfViewerPosition(position: Int) {
    context.tnetSettingsDataStore.edit { preferences ->
      preferences[PDF_VIEWER_POSITION] = position.coerceAtLeast(0)
    }
  }

  private companion object {
    val PAPERS_WORKSPACE_URI = stringPreferencesKey("papers_workspace_uri")
    val PAPERS_DATABASE_URI = stringPreferencesKey("papers_database_uri")
    val MARKDOWN_WORKSPACE_URIS = stringPreferencesKey("markdown_workspace_uris")
    val ACTIVE_MARKDOWN_WORKSPACE_URI = stringPreferencesKey("active_markdown_workspace_uri")
    val ACTIVE_MARKDOWN_PATH = stringPreferencesKey("active_markdown_path")
    val ACTIVE_MARKDOWN_URI = stringPreferencesKey("active_markdown_uri")
    val PDF_WORKSPACE_URIS = stringPreferencesKey("pdf_workspace_uris")
    val ACTIVE_PDF_WORKSPACE_URI = stringPreferencesKey("active_pdf_workspace_uri")
    val MARKDOWN_OPENED_FILES = stringPreferencesKey("markdown_opened_files")
    val PDF_OPENED_FILES = stringPreferencesKey("pdf_opened_files")
    val ACTIVE_PDF_INDEX = intPreferencesKey("active_pdf_index")
    val LAST_OPENED_DESTINATION = stringPreferencesKey("last_opened_destination")
    val THEME = stringPreferencesKey("theme")
    val MARKDOWN_VIEWER_POSITION = intPreferencesKey("markdown_viewer_position")
    val PDF_VIEWER_POSITION = intPreferencesKey("pdf_viewer_position")
  }
}

private fun String?.decodeList(): List<String> {
  return orEmpty()
    .split('\n')
    .map { it.trim() }
    .filter { it.isNotBlank() }
    .distinct()
}

private fun List<String>.encodeList(): String {
  return filter { it.isNotBlank() }.distinct().joinToString("\n")
}

internal fun selectActiveMarkdownPath(
  activePath: String?,
  legacyOpenedFiles: List<String>
): String? {
  return activePath ?: legacyOpenedFiles.firstOrNull()
}
