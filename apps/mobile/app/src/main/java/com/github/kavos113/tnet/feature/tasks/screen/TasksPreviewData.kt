package com.github.kavos113.tnet.feature.tasks.screen

import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority

internal val previewTask = TaskItem(
  id = "task-preview",
  title = "Add small component previews",
  dueDate = "2026-05-06",
  priority = TaskPriority.High,
  notes = "Preview row state."
)

internal val previewCompletedTask = TaskItem(
  id = "task-completed-preview",
  title = "Review Mermaid renderer options",
  dueDate = "2026-05-07",
  priority = TaskPriority.Normal,
  isCompleted = true
)
