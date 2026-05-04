package com.github.kavos113.tnet.feature.markdown.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MermaidHtmlTest {
  @Test
  fun htmlUsesBundledMermaidAsset() {
    val html = buildMermaidHtml("graph TD\n  App-->Viewer")

    assertTrue(html.contains("file:///android_asset/markdown-preview/markdown-preview.css"))
    assertTrue(html.contains("file:///android_asset/markdown-preview/markdown-preview.js"))
    assertTrue(html.contains("language-mermaid"))
    assertFalse(html.contains("mermaid.min.js"))
    assertFalse(html.contains("https://"))
  }

  @Test
  fun htmlEscapesDiagramSource() {
    val html = buildMermaidHtml("graph TD\n  A[<script>]-->B")

    assertTrue(html.contains("&lt;script&gt;"))
    assertFalse(html.contains("A[<script>]"))
  }
}
