package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority

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

@Composable
private fun TasksScreenContent(
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
      .padding(horizontal = 20.dp, vertical = 18.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    Text(
      text = "Tasks",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Local task management for this device.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
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

@Composable
private fun TaskForm(
  title: String,
  dueDate: String,
  priority: TaskPriority,
  notes: String,
  isEditing: Boolean,
  onTitleChange: (String) -> Unit,
  onDueDateChange: (String) -> Unit,
  onPriorityChange: (TaskPriority) -> Unit,
  onNotesChange: (String) -> Unit,
  onSave: () -> Unit,
  onCancel: () -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    OutlinedTextField(
      value = title,
      onValueChange = onTitleChange,
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
      label = { Text("Task") }
    )
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      OutlinedTextField(
        value = dueDate,
        onValueChange = onDueDateChange,
        modifier = Modifier.weight(1f),
        singleLine = true,
        label = { Text("Due date") }
      )
      PriorityButtons(
        selected = priority,
        onSelected = onPriorityChange
      )
    }
    OutlinedTextField(
      value = notes,
      onValueChange = onNotesChange,
      modifier = Modifier.fillMaxWidth(),
      minLines = 2,
      label = { Text("Notes") }
    )
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      Button(onClick = onSave) {
        Text(if (isEditing) "Save" else "Add")
      }
      if (isEditing) {
        TextButton(onClick = onCancel) {
          Text("Cancel")
        }
      }
    }
  }
}

@Composable
private fun PriorityButtons(
  selected: TaskPriority,
  onSelected: (TaskPriority) -> Unit
) {
  Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
    TaskPriority.entries.forEach { priority ->
      val buttonText = priority.name
      if (priority == selected) {
        Button(onClick = { onSelected(priority) }) {
          Text(buttonText)
        }
      } else {
        OutlinedButton(onClick = { onSelected(priority) }) {
          Text(buttonText)
        }
      }
    }
  }
}

@Composable
private fun TaskFilterRow(
  selected: TaskFilter,
  onSelected: (TaskFilter) -> Unit
) {
  Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
    TaskFilter.entries.forEach { filter ->
      if (filter == selected) {
        Button(onClick = { onSelected(filter) }) {
          Text(filter.name)
        }
      } else {
        OutlinedButton(onClick = { onSelected(filter) }) {
          Text(filter.name)
        }
      }
    }
  }
}

@Composable
private fun TaskList(
  tasks: List<TaskItem>,
  onToggle: (TaskItem) -> Unit,
  onEdit: (TaskItem) -> Unit,
  onSelect: (TaskItem) -> Unit
) {
  if (tasks.isEmpty()) {
    Text(
      text = "No tasks.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    return
  }

  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    tasks.forEach { task ->
      TaskRow(
        task = task,
        onToggle = { onToggle(task) },
        onEdit = { onEdit(task) },
        onSelect = { onSelect(task) }
      )
    }
  }
}

@Composable
private fun TaskRow(
  task: TaskItem,
  onToggle: () -> Unit,
  onEdit: () -> Unit,
  onSelect: () -> Unit
) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    onClick = onSelect,
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
      verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        Checkbox(
          checked = task.isCompleted,
          onCheckedChange = { onToggle() }
        )
        Text(
          text = task.title,
          style = MaterialTheme.typography.bodyLarge,
          textDecoration = if (task.isCompleted) {
            TextDecoration.LineThrough
          } else {
            TextDecoration.None
          }
        )
      }
      Text(
        text = listOfNotNull(
          task.dueDate,
          task.priority.name,
          if (task.notes.isBlank()) null else "Notes"
        ).joinToString(" - "),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      TextButton(onClick = onEdit) {
        Text("Edit")
      }
    }
  }
}

@Composable
private fun TaskDetail(
  task: TaskItem,
  onBack: () -> Unit,
  onEdit: () -> Unit
) {
  Button(onClick = onBack) {
    Text("Back to list")
  }
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(14.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Text(
        text = task.title,
        style = MaterialTheme.typography.titleLarge,
        textDecoration = if (task.isCompleted) {
          TextDecoration.LineThrough
        } else {
          TextDecoration.None
        }
      )
      DetailLine("Status", if (task.isCompleted) "Completed" else "Active")
      DetailLine("Due date", task.dueDate)
      DetailLine("Priority", task.priority.name)
      DetailLine("Notes", task.notes.ifBlank { null })
      TextButton(onClick = onEdit) {
        Text("Edit")
      }
    }
  }
}

@Composable
private fun DetailLine(
  label: String,
  value: String?
) {
  if (value.isNullOrBlank()) return
  Text(
    text = "$label: $value",
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.onSurfaceVariant
  )
}
