package com.github.kavos113.tnet.feature.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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

@Composable
fun TasksScreen(modifier: Modifier = Modifier) {
  val tasks = remember { mutableStateListOf<TaskItem>() }
  var nextTaskNumber by remember { mutableIntStateOf(1) }
  var draftTitle by remember { mutableStateOf("") }

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
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(10.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      OutlinedTextField(
        value = draftTitle,
        onValueChange = { draftTitle = it },
        modifier = Modifier.weight(1f),
        singleLine = true,
        label = { Text("Task") }
      )
      Button(
        onClick = {
          val task = createTask("task-${nextTaskNumber}", draftTitle) ?: return@Button
          tasks.add(0, task)
          nextTaskNumber += 1
          draftTitle = ""
        }
      ) {
        Text("Add")
      }
    }
    if (tasks.isEmpty()) {
      Text(
        text = "No tasks yet.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    } else {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        tasks.forEachIndexed { index, task ->
          TaskRow(
            task = task,
            onToggle = {
              tasks[index] = task.copy(isCompleted = !task.isCompleted)
            }
          )
        }
      }
    }
  }
}

@Composable
private fun TaskRow(
  task: TaskItem,
  onToggle: () -> Unit
) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
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
        textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None
      )
    }
  }
}
