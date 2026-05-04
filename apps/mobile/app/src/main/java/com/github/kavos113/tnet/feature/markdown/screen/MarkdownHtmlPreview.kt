package com.github.kavos113.tnet.feature.markdown.screen

import android.webkit.WebView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.github.kavos113.tnet.feature.markdown.model.buildMarkdownPreviewHtml

@Composable
internal fun MarkdownHtmlPreview(
  html: String,
  modifier: Modifier = Modifier
) {
  AndroidView(
    modifier = modifier,
    factory = { context ->
      WebView(context).apply {
        settings.javaScriptEnabled = html.contains("language-mermaid")
        settings.domStorageEnabled = false
        settings.allowFileAccess = true
        settings.allowContentAccess = false
        settings.blockNetworkLoads = true
        loadDataWithBaseURL(
          "file:///android_asset/",
          buildMarkdownPreviewHtml(html),
          "text/html",
          "UTF-8",
          null
        )
      }
    },
    update = { webView ->
      webView.settings.javaScriptEnabled = html.contains("language-mermaid")
      webView.loadDataWithBaseURL(
        "file:///android_asset/",
        buildMarkdownPreviewHtml(html),
        "text/html",
        "UTF-8",
        null
      )
    }
  )
}
