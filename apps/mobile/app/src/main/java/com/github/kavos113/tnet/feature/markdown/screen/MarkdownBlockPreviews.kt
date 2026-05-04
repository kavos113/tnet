package com.github.kavos113.tnet.feature.markdown.screen

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock
import com.github.kavos113.tnet.feature.markdown.model.TaskListItem
import com.github.kavos113.tnet.ui.theme.TnetTheme

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
