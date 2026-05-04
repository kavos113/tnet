package com.github.kavos113.tnet.feature.markdown.model

import com.vladsch.flexmark.ext.gfm.tasklist.TaskListExtension
import com.vladsch.flexmark.ext.tables.TablesExtension
import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.parser.Parser
import com.vladsch.flexmark.util.data.MutableDataSet

fun renderMarkdownHtml(markdown: String): String {
  val document = htmlMarkdownParser.parse(markdown)
  return htmlRenderer.render(document)
}

fun buildMarkdownPreviewHtml(markdownHtml: String): String {
  val previewScript = if (markdownHtml.contains("language-mermaid")) {
    """<script defer src="file:///android_asset/markdown-preview/markdown-preview.js"></script>"""
  } else {
    ""
  }
  return """
    <!doctype html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="file:///android_asset/markdown-preview/markdown-preview.css">
      $previewScript
    </head>
    <body class="markdown-preview">
      $markdownHtml
    </body>
    </html>
  """.trimIndent()
}

private val htmlOptions = MutableDataSet().apply {
  set(
    Parser.EXTENSIONS,
    listOf(
      TablesExtension.create(),
      TaskListExtension.create()
    )
  )
}

private val htmlMarkdownParser: Parser = Parser.builder(htmlOptions).build()
private val htmlRenderer: HtmlRenderer = HtmlRenderer.builder(htmlOptions).build()
