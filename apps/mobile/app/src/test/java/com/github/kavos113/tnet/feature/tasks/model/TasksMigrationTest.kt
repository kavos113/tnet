package com.github.kavos113.tnet.feature.tasks.model

import org.junit.Assert.assertEquals
import org.junit.Test

class TasksMigrationTest {
  @Test
  fun initialDatabaseVersionIsPinnedForMigrationTests() {
    assertEquals(1, TASKS_DATABASE_VERSION)
  }
}
