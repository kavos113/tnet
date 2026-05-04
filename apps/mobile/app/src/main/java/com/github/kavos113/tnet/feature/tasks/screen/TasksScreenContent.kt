package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun TasksScreenContent(
  uiState: TasksUiState,
  onTitleChange: (String) -> Unit,
  onDueDateChange: (String) -> Unit,
  onPriorityChange: (TaskPriority) -> Unit,
  onNotesChange: (String) -> Unit,
  onSave: () -> Unit,
  onCancel: () -> Unit,
  onFilterSelected: (TaskFilter) -> Unit,
  onToggle: (TaskItem) -> Unit,
  onEdit: (TaskItem) -> Unit,
  onSelect: (TaskItem) -> Unit,
  onBack: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Tasks",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Local task management for this device.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    TaskForm(
      title = uiState.draftTitle,
      dueDate = uiState.draftDueDate,
      priority = uiState.draftPriority,
      notes = uiState.draftNotes,
      isEditing = uiState.isEditing,
      onTitleChange = onTitleChange,
      onDueDateChange = onDueDateChange,
      onPriorityChange = onPriorityChange,
      onNotesChange = onNotesChange,
      onSave = onSave,
      onCancel = onCancel
    )
    uiState.error?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error
      )
    }
    TaskFilterRow(
      selected = uiState.filter,
      onSelected = onFilterSelected
    )
    val selectedTask = uiState.selectedTask
    if (selectedTask == null) {
      TaskList(
        tasks = uiState.visibleTasks,
        onToggle = onToggle,
        onEdit = onEdit,
        onSelect = onSelect
      )
    } else {
      TaskDetail(
        task = selectedTask,
        onBack = onBack,
        onEdit = { onEdit(selectedTask) }
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TasksScreenContentPreview() {
  TnetTheme {
    TasksScreenContent(
      uiState = TasksUiState(
        tasks = listOf(previewTask, previewCompletedTask),
        draftTitle = "Draft local task",
        draftDueDate = "2026-05-10",
        draftNotes = "Stored on this device only."
      ),
      onTitleChange = {},
      onDueDateChange = {},
      onPriorityChange = {},
      onNotesChange = {},
      onSave = {},
      onCancel = {},
      onFilterSelected = {},
      onToggle = {},
      onEdit = {},
      onSelect = {},
      onBack = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun TasksDetailPreview() {
  TnetTheme {
    TasksScreenContent(
      uiState = TasksUiState(
        tasks = listOf(previewTask.copy(id = "task-1", title = "Prepare PDF viewer MVP")),
        selectedTaskId = "task-1"
      ),
      onTitleChange = {},
      onDueDateChange = {},
      onPriorityChange = {},
      onNotesChange = {},
      onSave = {},
      onCancel = {},
      onFilterSelected = {},
      onToggle = {},
      onEdit = {},
      onSelect = {},
      onBack = {}
    )
  }
}
