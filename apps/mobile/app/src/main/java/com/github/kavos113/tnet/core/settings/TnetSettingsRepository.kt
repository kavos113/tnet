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
    val LAST_OPENED_DESTINATION = stringPreferencesKey("last_opened_destination")
    val THEME = stringPreferencesKey("theme")
    val MARKDOWN_VIEWER_POSITION = intPreferencesKey("markdown_viewer_position")
    val PDF_VIEWER_POSITION = intPreferencesKey("pdf_viewer_position")
  }
}
