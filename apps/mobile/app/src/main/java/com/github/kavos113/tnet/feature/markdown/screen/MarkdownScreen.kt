package com.github.kavos113.tnet.feature.markdown.screen

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.material3.rememberDrawerState
import androidx.compose.ui.Alignment
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
import com.github.kavos113.tnet.core.workspace.WorkspaceFileItem
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetCompactTextField
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.components.TnetStateMessage
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
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectWorkspace(uri)
  }

  MarkdownScreenContent(
    uiState = uiState,
    onOpenWorkspace = { openMarkdown.launch(null) },
    onOpenFile = viewModel::openWorkspaceFile,
    onReopenPath = viewModel::reopenPath,
    onSearchQueryChange = viewModel::updateSearchQuery,
    onToggleDirectory = viewModel::toggleDirectory,
    onOpenDrawer = viewModel::openDrawer,
    onCloseDrawer = viewModel::closeDrawer,
    modifier = modifier
  )
}

@Composable
private fun MarkdownScreenContent(
  uiState: MarkdownUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  onOpenDrawer: () -> Unit,
  onCloseDrawer: () -> Unit,
  modifier: Modifier = Modifier
) {
  val drawerState = rememberDrawerState(
    initialValue = if (uiState.isDrawerOpen) DrawerValue.Open else DrawerValue.Closed
  )

  LaunchedEffect(uiState.activeWorkspace) {
    if (uiState.activeWorkspace == null) onOpenDrawer()
  }
  LaunchedEffect(uiState.isDrawerOpen) {
    if (uiState.isDrawerOpen) {
      drawerState.open()
    } else {
      drawerState.close()
    }
  }
  LaunchedEffect(drawerState.currentValue) {
    when {
      drawerState.currentValue == DrawerValue.Open && !uiState.isDrawerOpen -> onOpenDrawer()
      drawerState.currentValue == DrawerValue.Closed && uiState.isDrawerOpen -> onCloseDrawer()
    }
  }

  ModalNavigationDrawer(
    drawerState = drawerState,
    gesturesEnabled = true,
    drawerContent = {
      ModalDrawerSheet(modifier = Modifier.fillMaxWidth(0.86f)) {
        MarkdownWorkspacePanel(
          uiState = uiState,
          onOpenWorkspace = onOpenWorkspace,
          onOpenFile = onOpenFile,
          onReopenPath = onReopenPath,
          onSearchQueryChange = onSearchQueryChange,
          onToggleDirectory = onToggleDirectory,
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = TnetSpace4, vertical = TnetSpace3)
        )
      }
    }
  ) {
    MarkdownDocumentSurface(
      uiState = uiState,
      onOpenDrawer = onOpenDrawer,
      modifier = modifier
    )
  }
}

@Composable
private fun MarkdownWorkspacePanel(
  uiState: MarkdownUiState,
  onOpenWorkspace: () -> Unit,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onReopenPath: (String) -> Unit,
  onSearchQueryChange: (String) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Markdown",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Open Markdown files from a synced desktop workspace in read-only mode.",
      style = MaterialTheme.typography.bodyLarge,
      color = TnetTextMuted
    )
    TnetPrimaryButton(text = "Open workspace", onClick = onOpenWorkspace)
    Text(
      text = uiState.activeWorkspace?.name ?: "No Markdown workspace selected.",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    TnetCompactTextField(
      value = uiState.searchQuery,
      onValueChange = onSearchQueryChange,
      label = "Search document"
    )
    MarkdownNavigationSummary(
      uiState = uiState,
      onReopenPath = onReopenPath
    )
    WorkspaceFileTree(
      items = uiState.fileTree,
      selectedPath = uiState.selectedPath,
      expandedPaths = uiState.expandedPaths,
      loadingDirectoryPaths = uiState.loadingDirectoryPaths,
      onOpenFile = onOpenFile,
      onToggleDirectory = onToggleDirectory
    )
  }
}

@Composable
private fun MarkdownDocumentSurface(
  uiState: MarkdownUiState,
  onOpenDrawer: () -> Unit,
  modifier: Modifier = Modifier
) {
  Box(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = TnetSpace4, vertical = TnetSpace3)
  ) {
    when {
      uiState.isWorkspaceLoading -> TnetStateMessage(
        title = "Loading workspace...",
        detail = "Reading top-level Markdown files.",
        modifier = Modifier.fillMaxWidth()
      )

      uiState.isLoading -> TnetStateMessage(
        title = "Loading document...",
        detail = uiState.selectedPath ?: uiState.selectedUri,
        modifier = Modifier.fillMaxWidth()
      )

      uiState.error != null -> TnetStateMessage(
        title = "Markdown error",
        detail = uiState.error,
        isError = true,
        modifier = Modifier.fillMaxWidth()
      )

      uiState.blocks.isNotEmpty() -> MarkdownBlocksPreview(
        blocks = uiState.blocks,
        modifier = Modifier.fillMaxSize()
      )

      else -> TnetStateMessage(
        title = "No Markdown file selected",
        detail = "Swipe from the left edge or open the workspace panel.",
        modifier = Modifier.fillMaxWidth()
      )
    }
    if (uiState.blocks.isEmpty() && !uiState.isLoading && !uiState.isWorkspaceLoading) {
      TnetSecondaryButton(
        text = "Workspace",
        onClick = onOpenDrawer,
        modifier = Modifier.align(Alignment.BottomStart)
      )
    }
  }
}

@Composable
private fun MarkdownNavigationSummary(
  uiState: MarkdownUiState,
  onReopenPath: (String) -> Unit
) {
  TnetPanel {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      Text(
        text = "Opened files",
        style = MaterialTheme.typography.titleMedium
      )
      if (uiState.openedFiles.isEmpty()) {
        Text(
          text = "No files opened.",
          style = MaterialTheme.typography.bodySmall,
          color = TnetTextMuted
        )
      }
      uiState.openedFiles.forEach { path ->
        TnetSecondaryButton(
          text = path.substringAfterLast('/'),
          selected = uiState.selectedPath == path,
          onClick = { onReopenPath(path) }
        )
      }
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
    }
  }
}

@Composable
private fun WorkspaceFileTree(
  items: List<WorkspaceFileItem>,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit,
  modifier: Modifier = Modifier
) {
  if (items.isEmpty()) return
  TnetPanel(modifier = modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text(
        text = "Workspace files",
        style = MaterialTheme.typography.titleMedium
      )
      items.forEach { item ->
        WorkspaceFileTreeItem(
          item = item,
          selectedPath = selectedPath,
          expandedPaths = expandedPaths,
          loadingDirectoryPaths = loadingDirectoryPaths,
          onOpenFile = onOpenFile,
          onToggleDirectory = onToggleDirectory
        )
      }
    }
  }
}

@Composable
private fun WorkspaceFileTreeItem(
  item: WorkspaceFileItem,
  selectedPath: String?,
  expandedPaths: Set<String>,
  loadingDirectoryPaths: Set<String>,
  onOpenFile: (WorkspaceFileItem) -> Unit,
  onToggleDirectory: (WorkspaceFileItem) -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
    if (item.isDirectory) {
      val isExpanded = item.relativePath in expandedPaths
      TnetSecondaryButton(
        text = "${if (isExpanded) "v" else ">"} ${item.name}",
        onClick = { onToggleDirectory(item) },
        modifier = Modifier.fillMaxWidth()
      )
      if (isExpanded) {
        if (item.relativePath in loadingDirectoryPaths) {
          Text(
            text = "Loading...",
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = TnetSpace3)
          )
        } else if (item.isChildrenLoaded && item.children.isEmpty()) {
          Text(
            text = "No Markdown files.",
            style = MaterialTheme.typography.bodySmall,
            color = TnetTextMuted,
            modifier = Modifier.padding(start = TnetSpace3)
          )
        }
        item.children.forEach { child ->
          WorkspaceFileTreeItem(
            item = child,
            selectedPath = selectedPath,
            expandedPaths = expandedPaths,
            loadingDirectoryPaths = loadingDirectoryPaths,
            onOpenFile = onOpenFile,
            onToggleDirectory = onToggleDirectory
          )
        }
      }
    } else {
      TnetSecondaryButton(
        text = item.relativePath,
        selected = selectedPath == item.relativePath,
        onClick = { onOpenFile(item) }
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

@Preview(showBackground = true)
@Composable
private fun WorkspaceFileTreePreview() {
  TnetTheme {
    WorkspaceFileTree(
      items = listOf(
        WorkspaceFileItem(
          name = "docs",
          relativePath = "docs",
          documentUri = "content://workspace/docs",
          isDirectory = true,
          children = listOf(
            WorkspaceFileItem(
              name = "mobile.md",
              relativePath = "docs/mobile.md",
              documentUri = "content://workspace/docs/mobile.md",
              isDirectory = false
            )
          ),
          isChildrenLoaded = true
        ),
        WorkspaceFileItem(
          name = "README.md",
          relativePath = "README.md",
          documentUri = "content://workspace/README.md",
          isDirectory = false
        )
      ),
      selectedPath = "docs/mobile.md",
      expandedPaths = setOf("docs"),
      loadingDirectoryPaths = emptySet(),
      onOpenFile = {},
      onToggleDirectory = {},
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
      onOpenWorkspace = {},
      onOpenFile = {},
      onReopenPath = {},
      onSearchQueryChange = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {}
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
      onOpenWorkspace = {},
      onOpenFile = {},
      onReopenPath = {},
      onSearchQueryChange = {},
      onToggleDirectory = {},
      onOpenDrawer = {},
      onCloseDrawer = {}
    )
  }
}
