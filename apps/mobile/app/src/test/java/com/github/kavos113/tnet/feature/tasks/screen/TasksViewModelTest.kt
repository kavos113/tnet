package com.github.kavos113.tnet.feature.tasks.screen

import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TasksViewModelTest {
  @Test
  fun saveTaskCreatesTaskAndClearsDraft() {
    val viewModel = TasksViewModel()

    viewModel.updateDraftTitle("Read paper")
    viewModel.updateDraftDueDate("2026-05-04")
    viewModel.updateDraftPriority(TaskPriority.High)
    viewModel.updateDraftNotes("Important")
    viewModel.saveTask()

    val state = viewModel.uiState.value
    assertEquals(1, state.tasks.size)
    assertEquals("Read paper", state.tasks[0].title)
    assertEquals(TaskPriority.High, state.tasks[0].priority)
    assertEquals("", state.draftTitle)
    assertNull(state.error)
  }

  @Test
  fun editTaskUpdatesExistingTask() {
    val viewModel = TasksViewModel()
    viewModel.updateDraftTitle("A")
    viewModel.saveTask()

    viewModel.editTask(viewModel.uiState.value.tasks[0])
    viewModel.updateDraftTitle("B")
    viewModel.saveTask()

    assertEquals("B", viewModel.uiState.value.tasks[0].title)
    assertNull(viewModel.uiState.value.editingTaskId)
  }

  @Test
  fun selectFilterChangesVisibleTasks() {
    val viewModel = TasksViewModel()
    viewModel.updateDraftTitle("A")
    viewModel.saveTask()
    viewModel.toggleTask(viewModel.uiState.value.tasks[0])
    viewModel.selectFilter(TaskFilter.Active)

    assertEquals(emptyList<Any>(), viewModel.uiState.value.visibleTasks)
  }
}
