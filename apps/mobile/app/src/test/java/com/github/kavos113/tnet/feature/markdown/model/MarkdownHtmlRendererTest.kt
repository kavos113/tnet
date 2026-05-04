package com.github.kavos113.tnet.feature.markdown.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MarkdownHtmlRendererTest {
  @Test
  fun renderMarkdownHtmlRendersCommonMarkdownAsHtml() {
    val html = renderMarkdownHtml(
      """
      # Title

      - A
      - B

      | Name | Value |
      | --- | --- |
      | A | 1 |

      ```kotlin
      val x = 1
      ```
      """.trimIndent()
    )

    assertTrue(html.contains("<h1>Title</h1>"))
    assertTrue(html.contains("<ul>"))
    assertTrue(html.contains("<table>"))
    assertTrue(html.contains("language-kotlin"))
    assertFalse(html.trimStart().startsWith("# Title"))
  }

  @Test
  fun buildMarkdownPreviewHtmlIncludesMermaidRuntimeOnlyWhenNeeded() {
    val plain = buildMarkdownPreviewHtml("<h1>Title</h1>")
    val mermaid = buildMarkdownPreviewHtml("<pre><code class=\"language-mermaid\">graph TD</code></pre>")

    assertFalse(plain.contains("mermaid.min.js"))
    assertTrue(mermaid.contains("mermaid.min.js"))
  }
}
