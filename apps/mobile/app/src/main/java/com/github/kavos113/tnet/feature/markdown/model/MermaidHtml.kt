package com.github.kavos113.tnet.feature.markdown.model

fun buildMermaidHtml(source: String): String {
  val escapedSource = source.escapeForHtml()
  return """
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="file:///android_asset/markdown-preview/markdown-preview.css">
        <script defer src="file:///android_asset/markdown-preview/markdown-preview.js"></script>
      </head>
      <body class="markdown-preview">
        <pre><code class="language-mermaid">$escapedSource</code></pre>
      </body>
    </html>
  """.trimIndent()
}

private fun String.escapeForHtml(): String {
  return buildString {
    for (character in this@escapeForHtml) {
      when (character) {
        '&' -> append("&amp;")
        '<' -> append("&lt;")
        '>' -> append("&gt;")
        '"' -> append("&quot;")
        '\'' -> append("&#39;")
        else -> append(character)
      }
    }
  }
}
