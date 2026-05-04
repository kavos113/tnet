package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

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
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(TnetSpace2)) {
    TnetCompactTextField(
      value = title,
      onValueChange = onTitleChange,
      modifier = Modifier.fillMaxWidth(),
      label = "Task"
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetCompactTextField(
        value = dueDate,
        onValueChange = onDueDateChange,
        modifier = Modifier.weight(1f),
        label = "Due date"
      )
      PriorityButtons(
        selected = priority,
        onSelected = onPriorityChange
      )
    }
    TnetCompactTextField(
      value = notes,
      onValueChange = onNotesChange,
      modifier = Modifier.fillMaxWidth(),
      label = "Notes",
      singleLine = false,
      minLines = 2,
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetPrimaryButton(text = if (isEditing) "Save" else "Add", onClick = onSave)
      if (isEditing) {
        TnetSecondaryButton(text = "Cancel", onClick = onCancel)
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
        TnetPrimaryButton(text = buttonText, onClick = { onSelected(priority) })
      } else {
        TnetSecondaryButton(text = buttonText, onClick = { onSelected(priority) })
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
        TnetPrimaryButton(text = filter.name, onClick = { onSelected(filter) })
      } else {
        TnetSecondaryButton(text = filter.name, onClick = { onSelected(filter) })
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
  TnetListRow(onClick = onSelect) {
    Column(
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
        color = TnetTextMuted
      )
      TnetSecondaryButton(text = "Edit", onClick = onEdit)
    }
  }
}

@Composable
private fun TaskDetail(
  task: TaskItem,
  onBack: () -> Unit,
  onEdit: () -> Unit
) {
  TnetSecondaryButton(text = "Back to list", onClick = onBack)
  TnetPanel {
    Column(
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
      TnetSecondaryButton(text = "Edit", onClick = onEdit)
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
    color = TnetTextMuted
  )
}

@Preview(showBackground = true)
@Composable
private fun TaskFormPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      TaskForm(
        title = "Review mobile TODO",
        dueDate = "2026-05-06",
        priority = TaskPriority.High,
        notes = "Check component previews.",
        isEditing = true,
        onTitleChange = {},
        onDueDateChange = {},
        onPriorityChange = {},
        onNotesChange = {},
        onSave = {},
        onCancel = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PriorityButtonsPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PriorityButtons(
        selected = TaskPriority.Normal,
        onSelected = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TaskFilterRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      TaskFilterRow(
        selected = TaskFilter.Active,
        onSelected = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TaskRowPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      TaskRow(
        task = TaskItem(
          id = "task-preview",
          title = "Add small component previews",
          dueDate = "2026-05-06",
          priority = TaskPriority.High,
          notes = "Preview row state."
        ),
        onToggle = {},
        onEdit = {},
        onSelect = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TaskDetailComponentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      TaskDetail(
        task = TaskItem(
          id = "task-detail-preview",
          title = "Component-level detail preview",
          dueDate = "2026-05-08",
          priority = TaskPriority.Normal,
          notes = "This is rendered without the whole screen."
        ),
        onBack = {},
        onEdit = {}
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
        tasks = listOf(
          TaskItem(
            id = "task-1",
            title = "Read shared papers workspace plan",
            dueDate = "2026-05-05",
            priority = TaskPriority.High,
            notes = "Check read-only constraints."
          ),
          TaskItem(
            id = "task-2",
            title = "Review Mermaid renderer options",
            dueDate = "2026-05-07",
            priority = TaskPriority.Normal,
            isCompleted = true
          )
        ),
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
        tasks = listOf(
          TaskItem(
            id = "task-1",
            title = "Prepare PDF viewer MVP",
            dueDate = "2026-05-12",
            priority = TaskPriority.High,
            notes = "Keep annotations and PDF writes out of scope."
          )
        ),
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
