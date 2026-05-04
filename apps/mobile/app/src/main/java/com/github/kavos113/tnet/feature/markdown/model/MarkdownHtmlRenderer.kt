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
  val mermaidScript = if (markdownHtml.contains("language-mermaid")) {
    """
        <script src="file:///android_asset/mermaid.min.js"></script>
        <script>
          document.querySelectorAll("pre > code.language-mermaid").forEach(function(code) {
            var pre = code.parentElement;
            pre.className = "mermaid";
            pre.textContent = code.textContent;
          });
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base"
          });
          mermaid.run({ querySelector: ".mermaid" }).catch(function(error) {
            console.error(error);
          });
        </script>
    """.trimIndent()
  } else {
    ""
  }
  return """
    <!doctype html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        :root {
          color: #24292f;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 16px;
        }
        body {
          margin: 0;
          padding: 16px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }
        h1, h2, h3, h4, h5, h6 {
          margin: 1.2em 0 0.55em;
          line-height: 1.25;
        }
        h1 { font-size: 1.8rem; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
        h2 { font-size: 1.45rem; border-bottom: 1px solid #d0d7de; padding-bottom: 0.25em; }
        h3 { font-size: 1.2rem; }
        p, ul, ol, table, pre, blockquote { margin: 0 0 1em; }
        blockquote {
          margin-left: 0;
          padding: 0 1em;
          color: #57606a;
          border-left: 4px solid #d0d7de;
        }
        code {
          padding: 0.15em 0.35em;
          border-radius: 4px;
          background: #f6f8fa;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          font-size: 0.9em;
        }
        pre {
          padding: 12px;
          overflow-x: auto;
          border-radius: 6px;
          background: #f6f8fa;
        }
        pre code {
          padding: 0;
          background: transparent;
        }
        table {
          display: block;
          width: 100%;
          overflow-x: auto;
          border-collapse: collapse;
        }
        th, td {
          padding: 6px 10px;
          border: 1px solid #d0d7de;
        }
        th {
          background: #f6f8fa;
          font-weight: 600;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .mermaid {
          padding: 8px;
          overflow-x: auto;
          background: #ffffff;
        }
        .mermaid svg {
          max-width: 100%;
          height: auto;
        }
        input[type="checkbox"] {
          margin-right: 0.4em;
        }
      </style>
    </head>
    <body class="markdown-preview">
      $markdownHtml
      $mermaidScript
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
