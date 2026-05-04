package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun TasksScreen(
  modifier: Modifier = Modifier,
  viewModel: TasksViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  TasksScreenContent(
    uiState = uiState,
    onTitleChange = viewModel::updateDraftTitle,
    onDueDateChange = viewModel::updateDraftDueDate,
    onPriorityChange = viewModel::updateDraftPriority,
    onNotesChange = viewModel::updateDraftNotes,
    onSave = viewModel::saveTask,
    onCancel = viewModel::cancelEditing,
    onFilterSelected = viewModel::selectFilter,
    onToggle = viewModel::toggleTask,
    onEdit = viewModel::editTask,
    onSelect = viewModel::selectTask,
    onBack = viewModel::closeDetail,
    modifier = modifier
  )
}
