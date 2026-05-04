package com.github.kavos113.tnet.feature.markdown.screen

import android.view.MotionEvent
import android.view.ViewConfiguration
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
        configureMarkdownPreviewTouchHandling()
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
      webView.configureMarkdownPreviewTouchHandling()
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

private fun WebView.configureMarkdownPreviewTouchHandling() {
  val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  val drawerEdgeWidth = 32f * resources.displayMetrics.density
  var downX = 0f
  var downY = 0f
  var isDrawerEdgeGesture = false

  setOnTouchListener { view, event ->
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        downX = event.x
        downY = event.y
        isDrawerEdgeGesture = downX <= drawerEdgeWidth
        view.parent?.requestDisallowInterceptTouchEvent(!isDrawerEdgeGesture)
      }

      MotionEvent.ACTION_MOVE -> {
        val deltaX = event.x - downX
        val deltaY = event.y - downY
        if (kotlin.math.abs(deltaX) > touchSlop || kotlin.math.abs(deltaY) > touchSlop) {
          val isHorizontalDrawerSwipe = isDrawerEdgeGesture &&
            deltaX > kotlin.math.abs(deltaY)
          view.parent?.requestDisallowInterceptTouchEvent(!isHorizontalDrawerSwipe)
        }
      }

      MotionEvent.ACTION_UP,
      MotionEvent.ACTION_CANCEL -> {
        view.parent?.requestDisallowInterceptTouchEvent(false)
      }
    }
    false
  }
}
