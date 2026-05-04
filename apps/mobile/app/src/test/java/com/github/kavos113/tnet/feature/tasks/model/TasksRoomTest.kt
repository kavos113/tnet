package com.github.kavos113.tnet.feature.tasks.model

import org.junit.Assert.assertEquals
import org.junit.Test

class TasksRoomTest {
  @Test
  fun taskItemRoundTripsThroughEntity() {
    val task = TaskItem(
      id = "task-1",
      title = "Review mobile plan",
      dueDate = "2026-05-04",
      priority = TaskPriority.High,
      notes = "Read-only mobile scope",
      isCompleted = true
    )

    assertEquals(task, task.toEntity().toTaskItem())
  }

  @Test
  fun unknownPriorityFallsBackToNormal() {
    val entity = TaskEntity(
      id = "task-2",
      title = "Imported task",
      dueDate = null,
      priority = "Urgent",
      notes = "",
      isCompleted = false
    )

    assertEquals(TaskPriority.Normal, entity.toTaskItem().priority)
  }
}
