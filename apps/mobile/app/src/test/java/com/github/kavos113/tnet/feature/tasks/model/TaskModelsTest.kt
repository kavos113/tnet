package com.github.kavos113.tnet.feature.tasks.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TaskModelsTest {
  @Test
  fun createTaskTrimsTitle() {
    val task = createTask(
      id = "task-1",
      title = "  Read paper  ",
      dueDate = " 2026-05-04 ",
      priority = TaskPriority.High,
      notes = " note "
    )

    assertEquals(
      TaskItem(
        id = "task-1",
        title = "Read paper",
        dueDate = "2026-05-04",
        priority = TaskPriority.High,
        notes = "note"
      ),
      task
    )
  }

  @Test
  fun createTaskRejectsBlankTitle() {
    assertNull(createTask("task-1", "   "))
  }

  @Test
  fun toggleTaskCompletionOnlyChangesMatchingTask() {
    val tasks = listOf(
      TaskItem(id = "task-1", title = "A"),
      TaskItem(id = "task-2", title = "B")
    )

    val updated = toggleTaskCompletion(tasks, "task-2")

    assertFalse(updated[0].isCompleted)
    assertTrue(updated[1].isCompleted)
  }

  @Test
  fun updateTaskChangesMatchingTaskAndKeepsCompletion() {
    val tasks = listOf(TaskItem(id = "task-1", title = "A", isCompleted = true))

    val updated = updateTask(
      tasks = tasks,
      taskId = "task-1",
      title = "B",
      dueDate = "2026-05-04",
      priority = TaskPriority.Low,
      notes = "Updated"
    )

    assertEquals(
      listOf(
        TaskItem(
          id = "task-1",
          title = "B",
          dueDate = "2026-05-04",
          priority = TaskPriority.Low,
          notes = "Updated",
          isCompleted = true
        )
      ),
      updated
    )
  }

  @Test
  fun updateTaskRejectsBlankTitle() {
    val tasks = listOf(TaskItem(id = "task-1", title = "A"))

    assertNull(
      updateTask(
        tasks = tasks,
        taskId = "task-1",
        title = "",
        dueDate = null,
        priority = TaskPriority.Normal,
        notes = ""
      )
    )
  }

  @Test
  fun visibleTasksFiltersAndSortsByPriorityDueDateAndTitle() {
    val tasks = listOf(
      TaskItem(id = "task-1", title = "B", dueDate = "2026-05-05", priority = TaskPriority.Low),
      TaskItem(id = "task-2", title = "A", dueDate = "2026-05-04", priority = TaskPriority.High),
      TaskItem(id = "task-3", title = "C", isCompleted = true)
    )

    assertEquals(listOf(tasks[1], tasks[0]), visibleTasks(tasks, TaskFilter.Active))
    assertEquals(listOf(tasks[2]), visibleTasks(tasks, TaskFilter.Completed))
  }
}
