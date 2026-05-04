package com.github.kavos113.tnet.feature.markdown.model

fun buildMermaidHtml(source: String): String {
  val escapedSource = source.escapeForJavaScriptTemplate()
  return """
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1f2328;
            font-family: sans-serif;
          }
          #diagram {
            padding: 8px;
            overflow: auto;
          }
          #error {
            display: none;
            padding: 8px;
            color: #b42318;
            white-space: pre-wrap;
            font-size: 13px;
          }
          svg {
            max-width: 100%;
            height: auto;
          }
        </style>
        <script src="file:///android_asset/mermaid.min.js"></script>
      </head>
      <body>
        <pre id="diagram" class="mermaid">$escapedSource</pre>
        <pre id="error"></pre>
        <script>
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base"
          });
          mermaid.run({ querySelector: "#diagram" }).catch(function(error) {
            document.getElementById("diagram").style.display = "none";
            var errorNode = document.getElementById("error");
            errorNode.textContent = error && error.message ? error.message : String(error);
            errorNode.style.display = "block";
          });
        </script>
      </body>
    </html>
  """.trimIndent()
}

private fun String.escapeForJavaScriptTemplate(): String {
  return buildString {
    for (character in this@escapeForJavaScriptTemplate) {
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
