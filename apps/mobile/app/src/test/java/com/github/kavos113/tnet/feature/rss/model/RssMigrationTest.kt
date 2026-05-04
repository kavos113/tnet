package com.github.kavos113.tnet.feature.rss.model

import org.junit.Assert.assertEquals
import org.junit.Test

class RssMigrationTest {
  @Test
  fun initialDatabaseVersionIsPinnedForMigrationTests() {
    assertEquals(2, RSS_DATABASE_VERSION)
  }
}
