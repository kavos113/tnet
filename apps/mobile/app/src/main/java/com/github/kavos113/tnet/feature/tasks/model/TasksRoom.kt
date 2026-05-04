package com.github.kavos113.tnet.feature.tasks.model

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "tasks")
data class TaskEntity(
  @PrimaryKey val id: String,
  val title: String,
  val dueDate: String?,
  val priority: String,
  val notes: String,
  val isCompleted: Boolean
)

@Dao
interface TaskDao {
  @Query("SELECT * FROM tasks ORDER BY priority DESC, dueDate ASC, title ASC")
  fun observeTasks(): Flow<List<TaskEntity>>

  @Upsert
  suspend fun upsert(task: TaskEntity)

  @Query("DELETE FROM tasks WHERE id = :taskId")
  suspend fun delete(taskId: String)
}

@Database(
  entities = [TaskEntity::class],
  version = 1,
  exportSchema = false
)
abstract class TasksDatabase : RoomDatabase() {
  abstract fun taskDao(): TaskDao
}

fun TaskItem.toEntity(): TaskEntity {
  return TaskEntity(
    id = id,
    title = title,
    dueDate = dueDate,
    priority = priority.name,
    notes = notes,
    isCompleted = isCompleted
  )
}

fun TaskEntity.toTaskItem(): TaskItem {
  return TaskItem(
    id = id,
    title = title,
    dueDate = dueDate,
    priority = runCatching { TaskPriority.valueOf(priority) }.getOrDefault(TaskPriority.Normal),
    notes = notes,
    isCompleted = isCompleted
  )
}
