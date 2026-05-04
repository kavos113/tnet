package com.github.kavos113.tnet.feature.papers.screen

import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperListItem
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation

data class PapersUiState(
  val workspaceUri: String? = null,
  val databaseUri: String? = null,
  val isSqliteOnlyMode: Boolean = false,
  val validation: PapersWorkspaceValidation? = null,
  val papers: Result<List<PaperListItem>>? = null,
  val selectedPaperId: String? = null,
  val selectedPaper: Result<PaperDetail?>? = null
)
