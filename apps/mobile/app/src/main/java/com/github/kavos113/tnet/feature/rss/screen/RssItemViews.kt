package com.github.kavos113.tnet.feature.rss.screen

import android.webkit.WebView
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.rss.model.RssItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetRadiusSmall
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

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
      RssCompactItemRow(onClick = { onItemSelected(item) }) {
        Column(
          verticalArrangement = Arrangement.spacedBy(1.dp)
        ) {
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
              text = item.title,
              modifier = Modifier.weight(1f),
              style = MaterialTheme.typography.bodyMedium,
              color = if (item.isRead) TnetTextMuted else MaterialTheme.colorScheme.onSurface,
              maxLines = 1
            )
            item.publishedAt?.readableRssDate()?.let {
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
              maxLines = 1
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
  val uriHandler = LocalUriHandler.current

  Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(TnetSpace1)
  ) {
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2)) {
      TnetSecondaryButton(text = "Back", onClick = onBack)
      Text(
        text = item.title,
        modifier = Modifier.weight(1f),
        style = MaterialTheme.typography.titleLarge,
        maxLines = 2
      )
    }
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace2), verticalAlignment = Alignment.CenterVertically) {
      item.publishedAt?.readableRssDate()?.let {
        Text(
          text = it,
          modifier = Modifier.weight(1f),
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
      }
      item.link?.takeIf { it.isNotBlank() }?.let { link ->
        RssArticleLinkButton(onClick = { uriHandler.openUri(link) })
      }
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
private fun RssArticleLinkButton(onClick: () -> Unit) {
  Row(
    modifier = Modifier
      .background(TnetSurface, RoundedCornerShape(TnetRadiusSmall))
      .border(BorderStroke(1.dp, TnetBorder), RoundedCornerShape(TnetRadiusSmall))
      .clickable(onClick = onClick)
      .padding(horizontal = TnetSpace2, vertical = 4.dp),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace1),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Icon(Icons.AutoMirrored.Rounded.OpenInNew, contentDescription = null, modifier = Modifier.padding(0.dp))
    Text(text = "Open article", style = MaterialTheme.typography.labelMedium, color = TnetTextMuted)
  }
}

@Composable
private fun RssCompactItemRow(
  onClick: () -> Unit,
  content: @Composable () -> Unit
) {
  Box(
    modifier = Modifier
      .fillMaxWidth()
      .background(TnetSurface, RoundedCornerShape(TnetRadiusSmall))
      .border(BorderStroke(0.5.dp, TnetBorder), RoundedCornerShape(TnetRadiusSmall))
      .clickable(onClick = onClick)
      .defaultMinSize(minHeight = 34.dp)
      .padding(horizontal = TnetSpace2, vertical = 3.dp),
    contentAlignment = Alignment.CenterStart
  ) {
    content()
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
            padding: 8px 10px;
            font-family: sans-serif;
            font-size: 15px;
            line-height: 1.45;
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

private fun String.readableRssDate(): String? {
  val value = trim().takeIf { it.isNotEmpty() } ?: return null
  val output = SimpleDateFormat("MMM d, yyyy HH:mm", Locale.US)
  for (pattern in rssDatePatterns) {
    val parser = SimpleDateFormat(pattern, Locale.US).apply {
      isLenient = true
      if (pattern.endsWith("'Z'")) {
        timeZone = TimeZone.getTimeZone("UTC")
      }
    }
    val parsed = runCatching { parser.parse(value) }.getOrNull()
    if (parsed != null) return output.format(parsed)
  }
  return value
}

private val rssDatePatterns = listOf(
  "EEE, dd MMM yyyy HH:mm:ss zzz",
  "EEE, dd MMM yyyy HH:mm:ss Z",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss'Z'",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd"
)

@Preview(showBackground = true)
@Composable
private fun RssItemListPreview() {
  TnetTheme {
    Box(modifier = Modifier.padding(16.dp)) {
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
    Box(modifier = Modifier.padding(16.dp)) {
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
    Box(modifier = Modifier.padding(16.dp)) {
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
    Box(modifier = Modifier.padding(16.dp)) {
      RssItemDetail(
        item = previewRssItems.first().copy(contentHtml = null, link = null),
        onBack = {}
      )
    }
  }
}
