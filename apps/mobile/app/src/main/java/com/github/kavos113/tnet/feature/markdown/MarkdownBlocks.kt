package com.github.kavos113.tnet.feature.markdown

sealed interface MarkdownBlock {
  data class Heading(
    val level: Int,
    val text: String
  ) : MarkdownBlock

  data class Paragraph(
    val text: String
  ) : MarkdownBlock

  data class BulletList(
    val items: List<String>
  ) : MarkdownBlock

  data class CodeBlock(
    val language: String?,
    val code: String
  ) : MarkdownBlock

  data class MermaidBlock(
    val source: String
  ) : MarkdownBlock
}

fun parseMarkdownBlocks(markdown: String): List<MarkdownBlock> {
  val lines = markdown.replace("\r\n", "\n").split("\n")
  val blocks = mutableListOf<MarkdownBlock>()
  var index = 0

  while (index < lines.size) {
    val line = lines[index]
    if (line.isBlank()) {
      index += 1
      continue
    }

    val fence = codeFenceLanguage(line)
    if (fence != null) {
      val codeLines = mutableListOf<String>()
      index += 1
      while (index < lines.size && !lines[index].startsWith("```")) {
        codeLines += lines[index]
        index += 1
      }
      if (index < lines.size) index += 1
      val code = codeLines.joinToString("\n")
      blocks += if (fence == "mermaid") {
        MarkdownBlock.MermaidBlock(code)
      } else {
        MarkdownBlock.CodeBlock(language = fence.ifBlank { null }, code = code)
      }
      continue
    }

    headingLevel(line)?.let { level ->
      blocks += MarkdownBlock.Heading(
        level = level,
        text = line.drop(level).trim()
      )
      index += 1
      continue
    }

    if (line.trimStart().startsWith("- ")) {
      val items = mutableListOf<String>()
      while (index < lines.size && lines[index].trimStart().startsWith("- ")) {
        items += lines[index].trimStart().drop(2).trim()
        index += 1
      }
      blocks += MarkdownBlock.BulletList(items)
      continue
    }

    val paragraphLines = mutableListOf<String>()
    while (
      index < lines.size &&
      lines[index].isNotBlank() &&
      codeFenceLanguage(lines[index]) == null &&
      headingLevel(lines[index]) == null &&
      !lines[index].trimStart().startsWith("- ")
    ) {
      paragraphLines += lines[index].trim()
      index += 1
    }
    blocks += MarkdownBlock.Paragraph(paragraphLines.joinToString(" "))
  }

  return blocks
}

private fun codeFenceLanguage(line: String): String? {
  val trimmed = line.trim()
  if (!trimmed.startsWith("```")) return null
  return trimmed.drop(3).trim().lowercase()
}

private fun headingLevel(line: String): Int? {
  val level = line.takeWhile { it == '#' }.length
  if (level !in 1..6) return null
  if (line.getOrNull(level) != ' ') return null
  return level
}
