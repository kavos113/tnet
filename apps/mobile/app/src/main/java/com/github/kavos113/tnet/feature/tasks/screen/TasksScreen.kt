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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.feature.tasks.model.createTask
import com.github.kavos113.tnet.feature.tasks.model.updateTask
import com.github.kavos113.tnet.feature.tasks.model.visibleTasks

@Composable
fun TasksScreen(modifier: Modifier = Modifier) {
  val tasks = remember { mutableStateListOf<TaskItem>() }
  var nextTaskNumber by remember { mutableIntStateOf(1) }
  var draftTitle by remember { mutableStateOf("") }
  var draftDueDate by remember { mutableStateOf("") }
  var draftPriority by remember { mutableStateOf(TaskPriority.Normal) }
  var draftNotes by remember { mutableStateOf("") }
  var editingTaskId by remember { mutableStateOf<String?>(null) }
  var selectedTaskId by remember { mutableStateOf<String?>(null) }
  var filter by remember { mutableStateOf(TaskFilter.All) }
  var error by remember { mutableStateOf<String?>(null) }

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
      title = draftTitle,
      dueDate = draftDueDate,
      priority = draftPriority,
      notes = draftNotes,
      isEditing = editingTaskId != null,
      onTitleChange = { draftTitle = it },
      onDueDateChange = { draftDueDate = it },
      onPriorityChange = { draftPriority = it },
      onNotesChange = { draftNotes = it },
      onSave = {
        val taskId = editingTaskId
        if (taskId == null) {
          val task = createTask(
            id = "task-${nextTaskNumber}",
            title = draftTitle,
            dueDate = draftDueDate,
            priority = draftPriority,
            notes = draftNotes
          ) ?: run {
            error = "Enter a task title."
            return@TaskForm
          }
          tasks.add(0, task)
          nextTaskNumber += 1
        } else {
          val updatedTasks = updateTask(
            tasks = tasks,
            taskId = taskId,
            title = draftTitle,
            dueDate = draftDueDate,
            priority = draftPriority,
            notes = draftNotes
          ) ?: run {
            error = "Enter a task title."
            return@TaskForm
          }
          tasks.clear()
          tasks.addAll(updatedTasks)
          editingTaskId = null
        }
        draftTitle = ""
        draftDueDate = ""
        draftPriority = TaskPriority.Normal
        draftNotes = ""
        error = null
      },
      onCancel = {
        editingTaskId = null
        draftTitle = ""
        draftDueDate = ""
        draftPriority = TaskPriority.Normal
        draftNotes = ""
        error = null
      }
    )
    error?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error
      )
    }
    TaskFilterRow(
      selected = filter,
      onSelected = { filter = it }
    )
    val selectedTask = tasks.firstOrNull { it.id == selectedTaskId }
    if (selectedTask == null) {
      TaskList(
        tasks = visibleTasks(tasks, filter),
        onToggle = { task ->
          val index = tasks.indexOfFirst { it.id == task.id }
          if (index >= 0) {
            tasks[index] = task.copy(isCompleted = !task.isCompleted)
          }
        },
        onEdit = { task ->
          selectedTaskId = null
          editingTaskId = task.id
          draftTitle = task.title
          draftDueDate = task.dueDate.orEmpty()
          draftPriority = task.priority
          draftNotes = task.notes
          error = null
        },
        onSelect = { selectedTaskId = it.id }
      )
    } else {
      TaskDetail(
        task = selectedTask,
        onBack = { selectedTaskId = null },
        onEdit = {
          editingTaskId = selectedTask.id
          draftTitle = selectedTask.title
          draftDueDate = selectedTask.dueDate.orEmpty()
          draftPriority = selectedTask.priority
          draftNotes = selectedTask.notes
          selectedTaskId = null
        }
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
