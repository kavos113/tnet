package com.github.kavos113.tnet.feature.rss.model

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update

interface RssRepository {
  val feeds: Flow<List<RssFeed>>
  val folders: Flow<List<RssFolder>>
  val items: Flow<List<RssItem>>

  suspend fun upsertFeed(feed: RssFeed)
  suspend fun upsertFolder(folder: RssFolder)
  suspend fun upsertItems(items: List<RssItem>)
  suspend fun deleteFeed(feedId: String)
  suspend fun markItemRead(itemId: String)
}

class RoomRssRepository(
  private val dao: RssDao
) : RssRepository {
  override val feeds: Flow<List<RssFeed>> = dao.observeFeeds().map { feeds ->
    feeds.map { it.toRssFeed() }
  }
  override val folders: Flow<List<RssFolder>> = dao.observeFolders().map { folders ->
    folders.map { it.toRssFolder() }
  }
  override val items: Flow<List<RssItem>> = dao.observeAllItems().map { items ->
    items.map { it.toRssItem() }
  }

  override suspend fun upsertFeed(feed: RssFeed) {
    dao.upsertFeed(feed.toEntity())
  }

  override suspend fun upsertFolder(folder: RssFolder) {
    dao.upsertFolder(folder.toEntity())
  }

  override suspend fun upsertItems(items: List<RssItem>) {
    dao.upsertItems(items.map { it.toEntity() })
  }

  override suspend fun deleteFeed(feedId: String) {
    dao.deleteFeed(feedId)
  }

  override suspend fun markItemRead(itemId: String) {
    dao.markItemRead(itemId)
  }
}

class InMemoryRssRepository : RssRepository {
  private val mutableFeeds = MutableStateFlow<List<RssFeed>>(emptyList())
  private val mutableFolders = MutableStateFlow<List<RssFolder>>(emptyList())
  private val mutableItems = MutableStateFlow<List<RssItem>>(emptyList())

  override val feeds: Flow<List<RssFeed>> = mutableFeeds
  override val folders: Flow<List<RssFolder>> = mutableFolders
  override val items: Flow<List<RssItem>> = mutableItems

  override suspend fun upsertFeed(feed: RssFeed) {
    mutableFeeds.update { feeds ->
      listOf(feed) + feeds.filterNot { it.id == feed.id }
    }
  }

  override suspend fun upsertFolder(folder: RssFolder) {
    mutableFolders.update { folders ->
      listOf(folder) + folders.filterNot { it.id == folder.id }
    }
  }

  override suspend fun upsertItems(items: List<RssItem>) {
    mutableItems.update { current ->
      items + current.filterNot { item -> items.any { it.id == item.id } }
    }
  }

  override suspend fun deleteFeed(feedId: String) {
    mutableFeeds.update { feeds -> feeds.filterNot { it.id == feedId } }
    mutableItems.update { items -> items.filterNot { it.feedId == feedId } }
  }

  override suspend fun markItemRead(itemId: String) {
    mutableItems.update { items ->
      items.map { if (it.id == itemId) it.copy(isRead = true) else it }
    }
  }
}
