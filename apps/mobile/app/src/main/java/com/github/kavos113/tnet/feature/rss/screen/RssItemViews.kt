package com.github.kavos113.tnet.feature.rss.screen

import android.webkit.WebView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun RssItemList(
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
    items.forEach { item ->
      TnetListRow(onClick = { onItemSelected(item) }) {
        Column(
          verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Text(
            text = if (item.isRead) item.title else "Unread - ${item.title}",
            style = MaterialTheme.typography.bodyLarge,
            color = if (item.isRead) TnetTextMuted else MaterialTheme.colorScheme.onSurface
          )
          item.publishedAt?.let {
            Text(
              text = it,
              style = MaterialTheme.typography.bodySmall,
              color = TnetTextMuted
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
      style = MaterialTheme.typography.titleMedium
    )
    item.publishedAt?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    item.link?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodySmall,
        color = TnetPrimary
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
            padding: 16px;
            font-family: sans-serif;
            line-height: 1.55;
            color: #111827;
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
            color: #1d4ed8;
          }
        </style>
      </head>
      <body>$contentHtml</body>
    </html>
  """.trimIndent()
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
