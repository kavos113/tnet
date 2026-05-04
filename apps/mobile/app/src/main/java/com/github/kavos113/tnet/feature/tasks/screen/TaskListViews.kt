package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun TaskFilterRow(
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
internal fun TaskList(
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
        task = previewTask,
        onToggle = {},
        onEdit = {},
        onSelect = {}
      )
    }
  }
}
