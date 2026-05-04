package com.github.kavos113.tnet.feature.markdown.screen

import android.webkit.WebView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.feature.markdown.model.buildMermaidHtml
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.theme.TnetTextMuted

@Composable
internal fun MarkdownBlocksPreview(
  blocks: List<MarkdownBlock>,
  modifier: Modifier = Modifier
) {
  TnetPanel(modifier = modifier.fillMaxWidth()) {
    Column(
      modifier = Modifier
        .verticalScroll(rememberScrollState()),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      blocks.forEach { block ->
        MarkdownBlockView(block)
      }
    }
  }
}

@Composable
internal fun MarkdownBlockView(block: MarkdownBlock) {
  when (block) {
    is MarkdownBlock.Heading -> Text(
      text = block.text,
      style = if (block.level <= 2) {
        MaterialTheme.typography.headlineSmall
      } else {
        MaterialTheme.typography.titleLarge
      },
      fontWeight = FontWeight.SemiBold
    )

    is MarkdownBlock.Paragraph -> Text(
      text = block.text,
      style = MaterialTheme.typography.bodyLarge
    )

    is MarkdownBlock.BulletList -> Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
      block.items.forEach { item ->
        Text(
          text = "- $item",
          style = MaterialTheme.typography.bodyLarge
        )
      }
    }

    is MarkdownBlock.TaskList -> Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
      block.items.forEach { item ->
        Text(
          text = "${if (item.checked) "[x]" else "[ ]"} ${item.text}",
          style = MaterialTheme.typography.bodyLarge
        )
      }
    }

    is MarkdownBlock.Table -> Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Text(
        text = block.headers.joinToString(" | "),
        style = MaterialTheme.typography.bodyMedium,
        fontWeight = FontWeight.SemiBold
      )
      block.rows.forEach { row ->
        Text(
          text = row.joinToString(" | "),
          style = MaterialTheme.typography.bodyMedium
        )
      }
    }

    is MarkdownBlock.CodeBlock -> CodeBlockView(block)

    is MarkdownBlock.ImageBlock -> TnetPanel {
      Text(
        text = "Image: ${block.altText.ifBlank { block.source }}\n${block.source}",
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
    }

    is MarkdownBlock.LinkBlock -> Text(
      text = "${block.label}: ${block.target}",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.primary
    )

    is MarkdownBlock.MermaidBlock -> MermaidBlockView(block.source)
  }
}

@Composable
private fun CodeBlockView(block: MarkdownBlock.CodeBlock) {
  val keywordColor = MaterialTheme.colorScheme.primary
  val plainColor = MaterialTheme.colorScheme.onSurface
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      block.language?.let {
        Text(
          text = it,
          style = MaterialTheme.typography.labelSmall,
          color = TnetTextMuted
        )
      }
      Text(
        text = buildAnnotatedString {
          block.code.splitToSequence(" ").forEachIndexed { index, token ->
            if (index > 0) append(" ")
            val trimmed = token.trim('\n', '\t', ' ', '(', ')', '{', '}')
            val color = if (trimmed in kotlinKeywords) keywordColor else plainColor
            withStyle(SpanStyle(color = color)) {
              append(token)
            }
          }
        },
        style = MaterialTheme.typography.bodyMedium,
        fontFamily = FontFamily.Monospace
      )
    }
  }
}

@Composable
private fun MermaidBlockView(source: String) {
  AndroidView(
    modifier = Modifier
      .fillMaxWidth()
      .heightIn(min = 160.dp, max = 420.dp),
    factory = { context ->
      WebView(context).apply {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = false
        settings.allowFileAccess = true
        settings.allowContentAccess = false
        settings.blockNetworkLoads = true
        loadDataWithBaseURL(
          "file:///android_asset/",
          buildMermaidHtml(source),
          "text/html",
          "UTF-8",
          null
        )
      }
    },
    update = { webView ->
      webView.loadDataWithBaseURL(
        "file:///android_asset/",
        buildMermaidHtml(source),
        "text/html",
        "UTF-8",
        null
      )
    }
  )
}

private val kotlinKeywords = setOf(
  "class",
  "data",
  "else",
  "false",
  "fun",
  "if",
  "interface",
  "object",
  "return",
  "sealed",
  "true",
  "val",
  "var",
  "when"
)
