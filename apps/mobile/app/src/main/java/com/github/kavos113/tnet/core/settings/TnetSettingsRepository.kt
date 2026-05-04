package com.github.kavos113.tnet.core.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
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
      theme = preferences[THEME] ?: "light"
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

  private companion object {
    val PAPERS_WORKSPACE_URI = stringPreferencesKey("papers_workspace_uri")
    val PAPERS_DATABASE_URI = stringPreferencesKey("papers_database_uri")
    val LAST_OPENED_DESTINATION = stringPreferencesKey("last_opened_destination")
    val THEME = stringPreferencesKey("theme")
  }
}
