package com.github.kavos113.tnet.feature.tasks

data class TaskItem(
  val id: String,
  val title: String,
  val isCompleted: Boolean = false
)

fun createTask(id: String, title: String): TaskItem? {
  val normalizedTitle = title.trim()
  if (normalizedTitle.isEmpty()) return null

  return TaskItem(
    id = id,
    title = normalizedTitle
  )
}

fun toggleTaskCompletion(tasks: List<TaskItem>, taskId: String): List<TaskItem> {
  return tasks.map { task ->
    if (task.id == taskId) task.copy(isCompleted = !task.isCompleted) else task
  }
}
