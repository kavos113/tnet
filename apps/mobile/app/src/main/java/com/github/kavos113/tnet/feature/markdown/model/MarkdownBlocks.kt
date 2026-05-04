package com.github.kavos113.tnet.feature.markdown.model

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

  data class TaskList(
    val items: List<TaskListItem>
  ) : MarkdownBlock

  data class Table(
    val headers: List<String>,
    val rows: List<List<String>>
  ) : MarkdownBlock

  data class CodeBlock(
    val language: String?,
    val code: String
  ) : MarkdownBlock

  data class MermaidBlock(
    val source: String
  ) : MarkdownBlock
}

data class TaskListItem(
  val text: String,
  val checked: Boolean
)

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

    if (isTableStart(lines, index)) {
      val tableLines = mutableListOf<String>()
      tableLines += lines[index]
      index += 2
      while (index < lines.size && lines[index].trim().startsWith("|")) {
        tableLines += lines[index]
        index += 1
      }
      blocks += MarkdownBlock.Table(
        headers = splitTableRow(tableLines.first()),
        rows = tableLines.drop(1).map(::splitTableRow)
      )
      continue
    }

    if (isTaskListItem(line)) {
      val items = mutableListOf<TaskListItem>()
      while (index < lines.size && isTaskListItem(lines[index])) {
        items += parseTaskListItem(lines[index])
        index += 1
      }
      blocks += MarkdownBlock.TaskList(items)
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
      !isTableStart(lines, index) &&
      !isTaskListItem(lines[index]) &&
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

private fun isTaskListItem(line: String): Boolean {
  val trimmed = line.trimStart()
  return trimmed.startsWith("- [ ] ") ||
    trimmed.startsWith("- [x] ") ||
    trimmed.startsWith("- [X] ")
}

private fun parseTaskListItem(line: String): TaskListItem {
  val trimmed = line.trimStart()
  return TaskListItem(
    text = trimmed.drop(6).trim(),
    checked = trimmed[3] == 'x' || trimmed[3] == 'X'
  )
}

private fun isTableStart(lines: List<String>, index: Int): Boolean {
  if (index + 1 >= lines.size) return false
  val header = lines[index].trim()
  val separator = lines[index + 1].trim()
  return header.startsWith("|") &&
    header.endsWith("|") &&
    separator.startsWith("|") &&
    separator.endsWith("|") &&
    separator.trim('|').split("|").all { cell ->
      cell.trim().matches(Regex(":?-{3,}:?"))
    }
}

private fun splitTableRow(line: String): List<String> {
  return line
    .trim()
    .trim('|')
    .split("|")
    .map { it.trim() }
}
