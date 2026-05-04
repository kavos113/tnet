package com.github.kavos113.tnet.feature.tasks.screen

import androidx.lifecycle.ViewModel
import com.github.kavos113.tnet.feature.tasks.model.TaskFilter
import com.github.kavos113.tnet.feature.tasks.model.TaskItem
import com.github.kavos113.tnet.feature.tasks.model.TaskPriority
import com.github.kavos113.tnet.feature.tasks.model.createTask
import com.github.kavos113.tnet.feature.tasks.model.updateTask
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class TasksViewModel : ViewModel() {
  private val mutableUiState = MutableStateFlow(TasksUiState())
  val uiState: StateFlow<TasksUiState> = mutableUiState.asStateFlow()

  fun updateDraftTitle(value: String) = mutableUiState.update { it.copy(draftTitle = value) }

  fun updateDraftDueDate(value: String) = mutableUiState.update { it.copy(draftDueDate = value) }

  fun updateDraftPriority(value: TaskPriority) = mutableUiState.update { it.copy(draftPriority = value) }

  fun updateDraftNotes(value: String) = mutableUiState.update { it.copy(draftNotes = value) }

  fun saveTask() {
    mutableUiState.update { state ->
      val editingTaskId = state.editingTaskId
      if (editingTaskId == null) {
        val task = createTask(
          id = "task-${state.nextTaskNumber}",
          title = state.draftTitle,
          dueDate = state.draftDueDate,
          priority = state.draftPriority,
          notes = state.draftNotes
        ) ?: return@update state.copy(error = "Enter a task title.")

        state
          .copy(
            tasks = listOf(task) + state.tasks,
            nextTaskNumber = state.nextTaskNumber + 1
          )
          .clearDraft()
      } else {
        val updatedTasks = updateTask(
          tasks = state.tasks,
          taskId = editingTaskId,
          title = state.draftTitle,
          dueDate = state.draftDueDate,
          priority = state.draftPriority,
          notes = state.draftNotes
        ) ?: return@update state.copy(error = "Enter a task title.")

        state
          .copy(tasks = updatedTasks, editingTaskId = null)
          .clearDraft()
      }
    }
  }

  fun cancelEditing() = mutableUiState.update { it.clearDraft().copy(editingTaskId = null) }

  fun selectFilter(filter: TaskFilter) = mutableUiState.update { it.copy(filter = filter) }

  fun selectTask(task: TaskItem) = mutableUiState.update { it.copy(selectedTaskId = task.id) }

  fun closeDetail() = mutableUiState.update { it.copy(selectedTaskId = null) }

  fun editTask(task: TaskItem) {
    mutableUiState.update {
      it.copy(
        selectedTaskId = null,
        editingTaskId = task.id,
        draftTitle = task.title,
        draftDueDate = task.dueDate.orEmpty(),
        draftPriority = task.priority,
        draftNotes = task.notes,
        error = null
      )
    }
  }

  fun toggleTask(task: TaskItem) {
    mutableUiState.update { state ->
      state.copy(
        tasks = state.tasks.map {
          if (it.id == task.id) it.copy(isCompleted = !it.isCompleted) else it
        }
      )
    }
  }
}

private fun TasksUiState.clearDraft(): TasksUiState {
  return copy(
    draftTitle = "",
    draftDueDate = "",
    draftPriority = TaskPriority.Normal,
    draftNotes = "",
    error = null
  )
}
