package com.github.kavos113.tnet.feature.rss

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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun RssScreen(modifier: Modifier = Modifier) {
  val feeds = remember { mutableStateListOf<RssFeed>() }
  var nextFeedNumber by remember { mutableIntStateOf(1) }
  var titleDraft by remember { mutableStateOf("") }
  var urlDraft by remember { mutableStateOf("") }
  var error by remember { mutableStateOf<String?>(null) }

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
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      Button(
        onClick = {
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
        Text("Add feed")
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
            },
            onRemove = { feeds.removeAt(index) }
          )
        }
      }
    }
  }
}

@Composable
private fun RssFeedRow(
  feed: RssFeed,
  onRefresh: () -> Unit,
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
        TextButton(onClick = onRemove) {
          Text("Remove")
        }
      }
    }
  }
}
