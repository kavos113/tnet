package com.github.kavos113.tnet.feature.markdown

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
        MarkdownBlock.CodeBlock(language = "kotlin", code = "val x = 1"),
        MarkdownBlock.MermaidBlock("graph TD\n  A-->B")
      ),
      blocks
    )
  }
}
