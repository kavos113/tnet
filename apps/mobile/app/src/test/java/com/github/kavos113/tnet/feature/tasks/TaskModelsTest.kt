package com.github.kavos113.tnet.feature.tasks

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TaskModelsTest {
  @Test
  fun createTaskTrimsTitle() {
    val task = createTask("task-1", "  Read paper  ")

    assertEquals(TaskItem(id = "task-1", title = "Read paper"), task)
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
}
