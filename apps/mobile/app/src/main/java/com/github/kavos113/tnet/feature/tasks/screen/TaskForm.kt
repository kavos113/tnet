package com.github.kavos113.tnet.feature.tasks.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun TaskForm(
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
        minLines = 2
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
internal fun PriorityButtons(
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
