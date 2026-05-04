package com.github.kavos113.tnet.feature.markdown.screen

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.markdown.model.buildMermaidHtml
import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.feature.markdown.model.TaskListItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
fun MarkdownScreen(
  modifier: Modifier = Modifier,
  viewModel: MarkdownViewModel = viewModel()
) {
  val context = LocalContext.current
  val uiState by viewModel.uiState.collectAsState()
  val openMarkdown = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.openDocument(uri)
  }

  MarkdownScreenContent(
    uiState = uiState,
    onOpenDocument = { openMarkdown.launch(arrayOf("text/*", "application/octet-stream")) },
    onSearchQueryChange = viewModel::updateSearchQuery,
    modifier = modifier
  )
}

@Composable
private fun MarkdownScreenContent(
  uiState: MarkdownUiState,
  onOpenDocument: () -> Unit,
  onSearchQueryChange: (String) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Markdown",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Open a Markdown document in read-only mode.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    TnetPrimaryButton(text = "Open document", onClick = onOpenDocument)
    TnetCompactTextField(
      value = uiState.searchQuery,
      onValueChange = onSearchQueryChange,
      label = "Search document"
    )
    MarkdownNavigationSummary(uiState)
    uiState.selectedUri?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
    if (uiState.isLoading) {
      Text(
        text = "Loading document...",
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
    }
    uiState.error?.let {
      Text(
        text = it,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error
      )
    }
    if (uiState.blocks.isNotEmpty()) {
      MarkdownBlocksPreview(
        blocks = uiState.blocks,
        modifier = Modifier.weight(1f)
      )
    }
  }
}

@Composable
private fun MarkdownNavigationSummary(uiState: MarkdownUiState) {
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      Text(
        text = "File tree: ${uiState.fileTreeEntries.joinToString(", ").ifBlank { "No files" }}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
      Text(
        text = "Recent files: ${uiState.recentUris.size}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
      Text(
        text = "Outline: ${uiState.outline.joinToString(" > ").ifBlank { "No headings" }}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
      Text(
        text = "Search matches: ${uiState.searchMatches}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
      Text(
        text = "Viewer position: ${uiState.viewerPosition}",
        style = MaterialTheme.typography.bodySmall,
        color = TnetTextMuted
      )
    }
  }
}

@Composable
private fun MarkdownBlocksPreview(
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
private fun MarkdownBlockView(block: MarkdownBlock) {
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

@Preview(showBackground = true)
@Composable
private fun MarkdownBlocksPreviewComponentPreview() {
  TnetTheme {
    MarkdownBlocksPreview(
      blocks = listOf(
        MarkdownBlock.Heading(level = 2, text = "Component Preview"),
        MarkdownBlock.Paragraph("Preview a compact document block surface."),
        MarkdownBlock.BulletList(listOf("Read-only", "No editor controls"))
      ),
      modifier = Modifier.padding(16.dp)
    )
  }
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

@Preview(showBackground = true)
@Composable
private fun MarkdownTaskListBlockPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      Column(modifier = Modifier.padding(12.dp)) {
        MarkdownBlockView(
          MarkdownBlock.TaskList(
            listOf(
              TaskListItem(text = "Add screen previews", checked = true),
              TaskListItem(text = "Add component previews", checked = true),
              TaskListItem(text = "Implement Mermaid WebView", checked = false)
            )
          )
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun MarkdownTableBlockPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      Column(modifier = Modifier.padding(12.dp)) {
        MarkdownBlockView(
          MarkdownBlock.Table(
            headers = listOf("Item", "State"),
            rows = listOf(
              listOf("Screen", "Done"),
              listOf("Component", "Done")
            )
          )
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun MarkdownCodeBlockPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      Column(modifier = Modifier.padding(12.dp)) {
        MarkdownBlockView(
          MarkdownBlock.CodeBlock(
            language = "kotlin",
            code = "val preview = \"component\""
          )
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun MarkdownScreenContentPreview() {
  TnetTheme {
    MarkdownScreenContent(
      uiState = MarkdownUiState(
        selectedUri = "content://workspace/docs/mobile-plan.md",
        searchQuery = "viewer",
        blocks = listOf(
          MarkdownBlock.Heading(level = 1, text = "Mobile Plan"),
          MarkdownBlock.Paragraph("Kotlin + Jetpack Compose read-only viewer."),
          MarkdownBlock.TaskList(
            listOf(
              TaskListItem(text = "Use ViewModel and UiState", checked = true),
              TaskListItem(text = "Render Mermaid with bundled assets", checked = false)
            )
          ),
          MarkdownBlock.Table(
            headers = listOf("Feature", "Status"),
            rows = listOf(
              listOf("Markdown", "Read-only"),
              listOf("Papers", "SQLite workspace")
            )
          ),
          MarkdownBlock.CodeBlock(
            language = "kotlin",
            code = "data class MarkdownUiState(val blocks: List<MarkdownBlock>)"
          ),
          MarkdownBlock.MermaidBlock("graph TD\n  App-->Viewer")
        )
      ),
      onOpenDocument = {},
      onSearchQueryChange = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun MarkdownLoadingPreview() {
  TnetTheme {
    MarkdownScreenContent(
      uiState = MarkdownUiState(
        selectedUri = "content://workspace/loading.md",
        isLoading = true
      ),
      onOpenDocument = {},
      onSearchQueryChange = {}
    )
  }
}
