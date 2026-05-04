package com.github.kavos113.tnet.feature.rss.model

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Upsert
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "rss_folders")
data class RssFolderEntity(
  @PrimaryKey val id: String,
  val title: String
)

@Entity(
  tableName = "rss_feeds",
  foreignKeys = [
    ForeignKey(
      entity = RssFolderEntity::class,
      parentColumns = ["id"],
      childColumns = ["folderId"],
      onDelete = ForeignKey.SET_NULL
    )
  ],
  indices = [Index("folderId")]
)
data class RssFeedEntity(
  @PrimaryKey val id: String,
  val title: String,
  val url: String,
  val folderId: String?,
  val lastRefreshLabel: String?
)

@Entity(
  tableName = "rss_items",
  foreignKeys = [
    ForeignKey(
      entity = RssFeedEntity::class,
      parentColumns = ["id"],
      childColumns = ["feedId"],
      onDelete = ForeignKey.CASCADE
    )
  ],
  indices = [Index("feedId"), Index("link")]
)
data class RssItemEntity(
  @PrimaryKey val id: String,
  val feedId: String,
  val title: String,
  val link: String?,
  val publishedAt: String?,
  val contentHtml: String?,
  val isRead: Boolean
)

@Dao
interface RssDao {
  @Query("SELECT * FROM rss_feeds ORDER BY title ASC")
  fun observeFeeds(): Flow<List<RssFeedEntity>>

  @Query("SELECT * FROM rss_folders ORDER BY title ASC")
  fun observeFolders(): Flow<List<RssFolderEntity>>

  @Query("SELECT * FROM rss_items ORDER BY publishedAt DESC")
  fun observeAllItems(): Flow<List<RssItemEntity>>

  @Query("SELECT * FROM rss_items WHERE feedId = :feedId ORDER BY publishedAt DESC")
  fun observeItems(feedId: String): Flow<List<RssItemEntity>>

  @Upsert
  suspend fun upsertFolder(folder: RssFolderEntity)

  @Upsert
  suspend fun upsertFeed(feed: RssFeedEntity)

  @Upsert
  suspend fun upsertItems(items: List<RssItemEntity>)

  @Query("DELETE FROM rss_feeds WHERE id = :feedId")
  suspend fun deleteFeed(feedId: String)

  @Query("UPDATE rss_items SET isRead = 1 WHERE id = :itemId")
  suspend fun markItemRead(itemId: String)
}

@Database(
  entities = [RssFolderEntity::class, RssFeedEntity::class, RssItemEntity::class],
  version = RSS_DATABASE_VERSION,
  exportSchema = false
)
abstract class RssDatabase : RoomDatabase() {
  abstract fun rssDao(): RssDao
}

const val RSS_DATABASE_VERSION = 2

val RSS_MIGRATION_1_2 = object : Migration(1, 2) {
  override fun migrate(db: SupportSQLiteDatabase) {
    db.execSQL("ALTER TABLE rss_items ADD COLUMN contentHtml TEXT")
  }
}

fun RssFeed.toEntity(folderId: String? = null): RssFeedEntity {
  return RssFeedEntity(
    id = id,
    title = title,
    url = url,
    folderId = folderId ?: this.folderId,
    lastRefreshLabel = lastRefreshLabel
  )
}

fun RssFeedEntity.toRssFeed(): RssFeed {
  return RssFeed(
    id = id,
    title = title,
    url = url,
    folderId = folderId,
    lastRefreshLabel = lastRefreshLabel
  )
}

fun RssFolder.toEntity(): RssFolderEntity {
  return RssFolderEntity(
    id = id,
    title = title
  )
}

fun RssFolderEntity.toRssFolder(): RssFolder {
  return RssFolder(
    id = id,
    title = title
  )
}

fun RssItem.toEntity(): RssItemEntity {
  return RssItemEntity(
    id = id,
    feedId = feedId,
    title = title,
    link = link,
    publishedAt = publishedAt,
    contentHtml = contentHtml,
    isRead = isRead
  )
}

fun RssItemEntity.toRssItem(): RssItem {
  return RssItem(
    id = id,
    feedId = feedId,
    title = title,
    link = link,
    publishedAt = publishedAt,
    contentHtml = contentHtml,
    isRead = isRead
  )
}
