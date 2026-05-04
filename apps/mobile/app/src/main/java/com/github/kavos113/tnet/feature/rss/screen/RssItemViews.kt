package com.github.kavos113.tnet.feature.rss.screen

import android.webkit.WebView
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetListRow
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssItemList(
  selectedFeedTitle: String?,
  items: List<RssItem>,
  modifier: Modifier = Modifier,
  onItemSelected: (RssItem) -> Unit
) {
  if (selectedFeedTitle == null || items.isEmpty()) return

  LazyColumn(
    modifier = modifier,
    contentPadding = PaddingValues(0.dp),
    verticalArrangement = Arrangement.spacedBy(0.dp)
  ) {
    items(items, key = { it.id.ifBlank { "${it.feedId}-${it.title}-${it.publishedAt}" } }) { item ->
      TnetListRow(onClick = { onItemSelected(item) }) {
        Column(
          verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
              text = item.title,
              modifier = Modifier.weight(1f),
              style = MaterialTheme.typography.bodyMedium,
              color = if (item.isRead) TnetTextMuted else MaterialTheme.colorScheme.onSurface,
              maxLines = 1
            )
            item.publishedAt?.let {
              Text(
                text = it,
                style = MaterialTheme.typography.bodySmall,
                color = TnetTextMuted,
                maxLines = 1
              )
            }
          }
          item.contentHtml?.readablePreview()?.let {
            Text(
              text = it,
              style = MaterialTheme.typography.bodySmall,
              color = TnetTextMuted,
              maxLines = 2
            )
          }
        }
      }
    }
  }
}

@Composable
internal fun RssItemDetail(
  item: RssItem?,
  onBack: () -> Unit
) {
  if (item == null) return

  Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(8.dp)
  ) {
    TnetSecondaryButton(text = "Back to articles", onClick = onBack)
    Text(
      text = item.title,
      style = MaterialTheme.typography.headlineSmall
    )
    val meta = listOfNotNull(item.publishedAt, item.link).joinToString(" - ")
    if (meta.isNotBlank()) {
      Text(
        text = meta,
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    val contentHtml = item.contentHtml
    if (contentHtml == null) {
      TnetPanel {
        Text(
          text = "No article content for this RSS item.",
          style = MaterialTheme.typography.bodyMedium,
          color = TnetTextMuted
        )
      }
    } else {
      Box(modifier = Modifier.fillMaxWidth().weight(1f)) {
        RssArticleWebView(
          html = contentHtml,
          baseUrl = item.link,
          modifier = Modifier.fillMaxSize()
        )
      }
    }
  }
}

@Composable
private fun RssArticleWebView(
  html: String,
  baseUrl: String?,
  modifier: Modifier = Modifier
) {
  AndroidView(
    modifier = modifier,
    factory = { context ->
      WebView(context).apply {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowContentAccess = false
        settings.allowFileAccess = false
        loadDataWithBaseURL(
          baseUrl,
          buildRssArticleHtml(html),
          "text/html",
          "UTF-8",
          null
        )
      }
    },
    update = { webView ->
      webView.loadDataWithBaseURL(
        baseUrl,
        buildRssArticleHtml(html),
        "text/html",
        "UTF-8",
        null
      )
    }
  )
}

private fun buildRssArticleHtml(contentHtml: String): String {
  return """
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: sans-serif;
            font-size: 16px;
            line-height: 1.65;
            color: #202428;
            background: #ffffff;
          }
          img, video, iframe {
            max-width: 100%;
            height: auto;
          }
          pre, code {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }
          a {
            color: #166a55;
          }
        </style>
      </head>
      <body>$contentHtml</body>
    </html>
  """.trimIndent()
}

private fun String.readablePreview(): String? {
  return replace(Regex("""(?is)<script\b.*?</script>"""), "")
    .replace(Regex("""(?is)<style\b.*?</style>"""), "")
    .replace(Regex("""(?is)<[^>]+>"""), " ")
    .replace(Regex("""\s+"""), " ")
    .trim()
    .takeIf { it.isNotEmpty() }
}

@Preview(showBackground = true)
@Composable
private fun RssItemListPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemList(
        selectedFeedTitle = "Mobile Android",
        items = previewRssItems,
        onItemSelected = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemListEmptyReadStatePreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemList(
        selectedFeedTitle = "Unread",
        items = previewRssItems.mapIndexed { index, item ->
          item.copy(
            id = "item-$index",
            isRead = index == 1,
            contentHtml = "<p>${item.title} summary text for previewing the compact list row.</p>"
          )
        },
        onItemSelected = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemDetailComponentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemDetail(
        item = previewRssItems.first(),
        onBack = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun RssItemDetailNoContentPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      RssItemDetail(
        item = previewRssItems.first().copy(contentHtml = null, link = null),
        onBack = {}
      )
    }
  }
}
