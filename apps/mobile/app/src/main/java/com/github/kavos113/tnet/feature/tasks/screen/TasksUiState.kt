package com.github.kavos113.tnet.feature.tasks.screen

import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.feature.tasks.model.visibleTasks

data class TasksUiState(
  val tasks: List<TaskItem> = emptyList(),
  val nextTaskNumber: Int = 1,
  val draftTitle: String = "",
  val draftDueDate: String = "",
  val draftPriority: TaskPriority = TaskPriority.Normal,
  val draftNotes: String = "",
  val editingTaskId: String? = null,
  val selectedTaskId: String? = null,
  val filter: TaskFilter = TaskFilter.All,
  val error: String? = null
) {
  val visibleTasks: List<TaskItem> = visibleTasks(tasks, filter)
  val selectedTask: TaskItem? = tasks.firstOrNull { it.id == selectedTaskId }
  val isEditing: Boolean = editingTaskId != null
}
