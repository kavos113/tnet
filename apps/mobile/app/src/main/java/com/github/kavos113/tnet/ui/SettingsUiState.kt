package com.github.kavos113.tnet.ui

import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation

data class SettingsUiState(
  val selectedWorkspaceUri: String? = null,
  val selectedDatabaseUri: String? = null,
  val workspaceValidation: PapersWorkspaceValidation? = null
)
