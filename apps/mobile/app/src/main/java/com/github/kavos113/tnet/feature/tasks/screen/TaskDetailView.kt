package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun TaskDetail(
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
private fun TaskDetailComponentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      TaskDetail(
        task = previewTask.copy(
          id = "task-detail-preview",
          title = "Component-level detail preview",
          notes = "This is rendered without the whole screen."
        ),
        onBack = {},
        onEdit = {}
      )
    }
  }
}
