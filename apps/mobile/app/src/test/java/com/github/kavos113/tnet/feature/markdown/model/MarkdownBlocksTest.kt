package com.github.kavos113.tnet.feature.markdown.model

import org.junit.Assert.assertEquals
import org.junit.Test

class MarkdownBlocksTest {
  @Test
  fun parseMarkdownBlocksRecognizesCommonBlocks() {
    val blocks = parseMarkdownBlocks(
      """
      # Title

      Paragraph
      continued

      - A
      - B

      - [x] Done
      - [ ] Next

      | Name | Value |
      | --- | ---: |
      | A | 1 |
      | B | 2 |

      ![Diagram](images/diagram.png)

      [Project](https://example.com)

      ```kotlin
      val x = 1
      ```

      ```mermaid
      graph TD
        A-->B
      ```
      """.trimIndent()
    )

    assertEquals(
      listOf(
        MarkdownBlock.Heading(level = 1, text = "Title"),
        MarkdownBlock.Paragraph("Paragraph continued"),
        MarkdownBlock.BulletList(listOf("A", "B")),
        MarkdownBlock.TaskList(
          listOf(
            TaskListItem(text = "Done", checked = true),
            TaskListItem(text = "Next", checked = false)
          )
        ),
        MarkdownBlock.Table(
          headers = listOf("Name", "Value"),
          rows = listOf(
            listOf("A", "1"),
            listOf("B", "2")
          )
        ),
        MarkdownBlock.ImageBlock(altText = "Diagram", source = "images/diagram.png"),
        MarkdownBlock.LinkBlock(label = "Project", target = "https://example.com"),
        MarkdownBlock.CodeBlock(language = "kotlin", code = "val x = 1"),
        MarkdownBlock.MermaidBlock("graph TD\n  A-->B")
      ),
      blocks
    )
  }
}
