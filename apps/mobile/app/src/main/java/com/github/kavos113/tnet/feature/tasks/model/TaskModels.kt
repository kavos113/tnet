package com.github.kavos113.tnet.feature.tasks.model

data class TaskItem(
  val id: String,
  val title: String,
  val dueDate: String? = null,
  val priority: TaskPriority = TaskPriority.Normal,
  val notes: String = "",
  val isCompleted: Boolean = false
)

enum class TaskPriority {
  Low,
  Normal,
  High
}

enum class TaskFilter {
  All,
  Active,
  Completed
}

fun createTask(
  id: String,
  title: String,
  dueDate: String? = null,
  priority: TaskPriority = TaskPriority.Normal,
  notes: String = ""
): TaskItem? {
  val normalizedTitle = title.trim()
  if (normalizedTitle.isEmpty()) return null

  return TaskItem(
    id = id,
    title = normalizedTitle,
    dueDate = dueDate?.trim()?.ifBlank { null },
    priority = priority,
    notes = notes.trim()
  )
}

fun updateTask(
  tasks: List<TaskItem>,
  taskId: String,
  title: String,
  dueDate: String?,
  priority: TaskPriority,
  notes: String
): List<TaskItem>? {
  return tasks.map { task ->
    if (task.id != taskId) {
      task
    } else {
      createTask(
        id = task.id,
        title = title,
        dueDate = dueDate,
        priority = priority,
        notes = notes
      )?.copy(isCompleted = task.isCompleted) ?: return null
    }
  }
}

fun toggleTaskCompletion(tasks: List<TaskItem>, taskId: String): List<TaskItem> {
  return tasks.map { task ->
    if (task.id == taskId) task.copy(isCompleted = !task.isCompleted) else task
  }
}

fun visibleTasks(
  tasks: List<TaskItem>,
  filter: TaskFilter
): List<TaskItem> {
  val filtered = when (filter) {
    TaskFilter.All -> tasks
    TaskFilter.Active -> tasks.filterNot { it.isCompleted }
    TaskFilter.Completed -> tasks.filter { it.isCompleted }
  }
  return filtered.sortedWith(
    compareByDescending<TaskItem> { it.priority.ordinal }
      .thenBy { it.dueDate ?: "9999-99-99" }
      .thenBy { it.title.lowercase() }
  )
}
