package com.github.kavos113.tnet.feature.markdown.model

private val obsidianImagePattern = Regex("""!\[\[([^]]+)]]""")
private val markdownImagePattern = Regex("""!\[([^]]*)]\(([^)\s]+)\)""")

fun resolveMarkdownImageLinks(
  markdown: String,
  currentDocumentPath: String?,
  resolveImageDataUrl: (String) -> String?
): String {
  val withObsidianImages = obsidianImagePattern.replace(markdown) { match ->
    val filename = match.groupValues[1]
    val dataUrl = resolveImageDataUrl("_images/$filename") ?: return@replace match.value
    "![${filename.escapeMarkdownAlt()}]($dataUrl)"
  }

  return markdownImagePattern.replace(withObsidianImages) { match ->
    val alt = match.groupValues[1]
    val target = match.groupValues[2]
    if (!target.isWorkspaceRelativeImageTarget()) return@replace match.value

    val resolvedPath = resolveMarkdownImagePath(
      currentDocumentPath = currentDocumentPath,
      imagePath = target
    ) ?: return@replace match.value
    val dataUrl = resolveImageDataUrl(resolvedPath) ?: return@replace match.value
    "![${alt.escapeMarkdownAlt()}]($dataUrl)"
  }
}

private fun resolveMarkdownImagePath(
  currentDocumentPath: String?,
  imagePath: String
): String? {
  val baseDirectory = currentDocumentPath
    ?.replace('\\', '/')
    ?.substringBeforeLast('/', missingDelimiterValue = "")
    .orEmpty()
  val combined = listOf(baseDirectory, imagePath)
    .filter { it.isNotBlank() }
    .joinToString("/")

  return normalizeRelativeImagePath(combined)
}

private fun normalizeRelativeImagePath(path: String): String? {
  val segments = mutableListOf<String>()
  path.replace('\\', '/')
    .trim()
    .trimStart('/')
    .split('/')
    .filter { it.isNotBlank() && it != "." }
    .forEach { segment ->
      when (segment) {
        ".." -> if (segments.isEmpty()) return null else segments.removeAt(segments.lastIndex)
        else -> segments += segment
      }
    }

  return segments.joinToString("/").ifBlank { null }
}

private fun String.isWorkspaceRelativeImageTarget(): Boolean {
  val lower = lowercase()
  return !startsWith("/") &&
    !startsWith("#") &&
    !lower.startsWith("http://") &&
    !lower.startsWith("https://") &&
    !lower.startsWith("data:") &&
    !lower.startsWith("file:") &&
    !lower.startsWith("content:")
}

private fun String.escapeMarkdownAlt(): String {
  return replace("]", "\\]")
}
