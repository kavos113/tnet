package com.github.kavos113.tnet.feature.rss.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.data.fetchRssItems
import com.github.kavos113.tnet.feature.rss.model.RssFeed
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.feature.rss.model.createRssFeed
import com.github.kavos113.tnet.feature.rss.model.updateRssFeed
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun RssScreen(modifier: Modifier = Modifier) {
  val feeds = remember { mutableStateListOf<RssFeed>() }
  var nextFeedNumber by remember { mutableIntStateOf(1) }
  var titleDraft by remember { mutableStateOf("") }
  var urlDraft by remember { mutableStateOf("") }
  var error by remember { mutableStateOf<String?>(null) }
  var selectedFeedTitle by remember { mutableStateOf<String?>(null) }
  var editingFeedId by remember { mutableStateOf<String?>(null) }
  var selectedItem by remember { mutableStateOf<RssItem?>(null) }
  var items by remember { mutableStateOf<List<RssItem>>(emptyList()) }
  val scope = rememberCoroutineScope()

  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = 20.dp, vertical = 18.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    Text(
      text = "RSS",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Manage feeds and fetch articles on this device.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    OutlinedTextField(
      value = titleDraft,
      onValueChange = { titleDraft = it },
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
      label = { Text("Title") }
    )
    OutlinedTextField(
      value = urlDraft,
      onValueChange = { urlDraft = it },
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
      label = { Text("Feed URL") }
    )
    editingFeedId?.let {
      Text(
        text = "Editing feed",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.primary
      )
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      Button(
        onClick = {
          val feedId = editingFeedId
          if (feedId != null) {
            val updatedFeeds = updateRssFeed(feeds, feedId, titleDraft, urlDraft)
            if (updatedFeeds == null) {
              error = "Enter an http or https feed URL."
              return@Button
            }
            feeds.clear()
            feeds.addAll(updatedFeeds)
            editingFeedId = null
            titleDraft = ""
            urlDraft = ""
            error = null
            return@Button
          }

          val feed = createRssFeed("feed-${nextFeedNumber}", titleDraft, urlDraft)
          if (feed == null) {
            error = "Enter an http or https feed URL."
            return@Button
          }
          feeds.add(0, feed)
          nextFeedNumber += 1
          titleDraft = ""
          urlDraft = ""
          error = null
        }
      ) {
        Text(if (editingFeedId == null) "Add feed" else "Save feed")
      }
      if (editingFeedId != null) {
        TextButton(
          onClick = {
            editingFeedId = null
            titleDraft = ""
            urlDraft = ""
            error = null
          }
        ) {
          Text("Cancel")
        }
      }
    }
    error?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error
      )
    }
    if (feeds.isEmpty()) {
      Text(
        text = "No feeds yet.",
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    } else {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        feeds.forEachIndexed { index, feed ->
          RssFeedRow(
            feed = feed,
            onRefresh = {
              feeds[index] = feed.copy(lastRefreshLabel = "Refresh requested")
              selectedFeedTitle = feed.title
              selectedItem = null
              scope.launch {
                val result = withContext(Dispatchers.IO) {
                  fetchRssItems(feed.url)
                }
                result
                  .onSuccess {
                    items = it
                    feeds[index] = feed.copy(lastRefreshLabel = "Fetched ${it.size} items")
                    error = null
                  }
                  .onFailure {
                    items = emptyList()
                    error = it.message ?: "Feed refresh failed."
                  }
              }
            },
            onEdit = {
              editingFeedId = feed.id
              titleDraft = feed.title
              urlDraft = feed.url
              error = null
            },
            onRemove = {
              feeds.removeAt(index)
              if (selectedFeedTitle == feed.title) {
                selectedFeedTitle = null
                selectedItem = null
                items = emptyList()
              }
            }
          )
        }
      }
    }
    if (selectedItem == null) {
      RssItemList(
        selectedFeedTitle = selectedFeedTitle,
        items = items,
        onItemSelected = { selectedItem = it }
      )
    } else {
      RssItemDetail(
        item = selectedItem,
        onBack = { selectedItem = null }
      )
    }
  }
}

@Composable
private fun RssFeedRow(
  feed: RssFeed,
  onRefresh: () -> Unit,
  onEdit: () -> Unit,
  onRemove: () -> Unit
) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(14.dp),
      verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      Text(
        text = feed.title,
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = feed.url,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      feed.lastRefreshLabel?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.primary
        )
      }
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        TextButton(onClick = onRefresh) {
          Text("Refresh")
        }
        TextButton(onClick = onEdit) {
          Text("Edit")
        }
        TextButton(onClick = onRemove) {
          Text("Remove")
        }
      }
    }
  }
}

@Composable
private fun RssItemList(
  selectedFeedTitle: String?,
  items: List<RssItem>,
  onItemSelected: (RssItem) -> Unit
) {
  if (selectedFeedTitle == null || items.isEmpty()) return

  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    Text(
      text = selectedFeedTitle,
      style = MaterialTheme.typography.titleMedium
    )
    items.take(20).forEach { item ->
      Surface(
        modifier = Modifier.fillMaxWidth(),
        onClick = { onItemSelected(item) },
        tonalElevation = 1.dp,
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceContainer
      ) {
        Column(
          modifier = Modifier.padding(12.dp),
          verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Text(
            text = item.title,
            style = MaterialTheme.typography.bodyLarge
          )
          item.publishedAt?.let {
            Text(
              text = it,
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      }
    }
  }
}

@Composable
private fun RssItemDetail(
  item: RssItem?,
  onBack: () -> Unit
) {
  if (item == null) return

  Button(onClick = onBack) {
    Text("Back to articles")
  }
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(14.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Text(
        text = item.title,
        style = MaterialTheme.typography.titleMedium
      )
      item.publishedAt?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
      item.link?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.primary
        )
      }
    }
  }
}
