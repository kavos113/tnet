@file:Suppress("DEPRECATION")

package com.github.kavos113.tnet.feature.markdown.model

import com.vladsch.flexmark.ext.gfm.tasklist.TaskListExtension
import com.vladsch.flexmark.ext.gfm.tasklist.TaskListItem as GfmTaskListItem
import com.vladsch.flexmark.ext.tables.TableBlock
import com.vladsch.flexmark.ext.tables.TableBody
import com.vladsch.flexmark.ext.tables.TableCell
import com.vladsch.flexmark.ext.tables.TableHead
import com.vladsch.flexmark.ext.tables.TableRow
import com.vladsch.flexmark.ext.tables.TablesExtension
import com.vladsch.flexmark.parser.Parser
import com.vladsch.flexmark.util.ast.Node
import com.vladsch.flexmark.util.data.MutableDataSet
import com.vladsch.flexmark.ast.BulletList
import com.vladsch.flexmark.ast.FencedCodeBlock
import com.vladsch.flexmark.ast.Heading
import com.vladsch.flexmark.ast.HtmlBlock
import com.vladsch.flexmark.ast.Image
import com.vladsch.flexmark.ast.Link
import com.vladsch.flexmark.ast.ListItem
import com.vladsch.flexmark.ast.Paragraph
import com.vladsch.flexmark.ast.util.TextCollectingVisitor

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

  data class ImageBlock(
    val altText: String,
    val source: String
  ) : MarkdownBlock

  data class LinkBlock(
    val label: String,
    val target: String
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
  val blocks = mutableListOf<MarkdownBlock>()
  val document = markdownParser.parse(markdown)
  document.children().forEach { node ->
    blocks += node.toMarkdownBlocks()
  }
  return blocks
}

private fun Node.toMarkdownBlocks(): List<MarkdownBlock> {
  return when (this) {
    is Heading -> listOf(MarkdownBlock.Heading(level = level, text = textContent()))
    is Paragraph -> listOf(toParagraphBlock())
    is BulletList -> toListBlock()
    is FencedCodeBlock -> listOf(toCodeBlock())
    is TableBlock -> listOf(toTableBlock())
    is HtmlBlock -> listOf(MarkdownBlock.Paragraph(chars.toString().trim()))
    else -> {
      val text = textContent()
      if (text.isBlank()) emptyList() else listOf(MarkdownBlock.Paragraph(text))
    }
  }
}

private fun Paragraph.toParagraphBlock(): MarkdownBlock {
  val meaningfulChildren = children()
    .filter { it.textContent().isNotBlank() || it is Image || it is Link }
    .toList()
  if (meaningfulChildren.size == 1) {
    val child = meaningfulChildren.single()
    if (child is Image) {
      return MarkdownBlock.ImageBlock(
        altText = child.textContent(),
        source = child.url.toString()
      )
    }
    if (child is Link) {
      return MarkdownBlock.LinkBlock(
        label = child.textContent(),
        target = child.url.toString()
      )
    }
  }
  return MarkdownBlock.Paragraph(textContent())
}

private fun BulletList.toListBlock(): List<MarkdownBlock> {
  val items = children().filterIsInstance<ListItem>().toList()
  val blocks = mutableListOf<MarkdownBlock>()
  val bulletItems = mutableListOf<String>()
  val taskItems = mutableListOf<TaskListItem>()

  fun flushBullets() {
    if (bulletItems.isNotEmpty()) {
      blocks += MarkdownBlock.BulletList(bulletItems.toList())
      bulletItems.clear()
    }
  }

  fun flushTasks() {
    if (taskItems.isNotEmpty()) {
      blocks += MarkdownBlock.TaskList(taskItems.toList())
      taskItems.clear()
    }
  }

  items.forEach { item ->
    val checked = item.taskCheckedState()
    if (checked == null) {
      flushTasks()
      bulletItems += item.textContent()
    } else {
      flushBullets()
      taskItems += TaskListItem(
        text = item.textContent().removePrefix("[ ]").removePrefix("[x]").removePrefix("[X]").trim(),
        checked = checked
      )
    }
  }
  flushBullets()
  flushTasks()
  return blocks
}

private fun ListItem.taskCheckedState(): Boolean? {
  if (this is GfmTaskListItem) return isItemDoneMarker
  val text = chars.toString().trimStart()
  return when {
    text.startsWith("- [x]", ignoreCase = true) -> true
    text.startsWith("* [x]", ignoreCase = true) -> true
    text.startsWith("+ [x]", ignoreCase = true) -> true
    text.startsWith("- [ ]") -> false
    text.startsWith("* [ ]") -> false
    text.startsWith("+ [ ]") -> false
    else -> null
  }
}

private fun FencedCodeBlock.toCodeBlock(): MarkdownBlock {
  val language = info.toString().trim().lowercase().ifBlank { null }
  val code = contentChars.toString().trimEnd()
  return if (language == "mermaid") {
    MarkdownBlock.MermaidBlock(code)
  } else {
    MarkdownBlock.CodeBlock(language = language, code = code)
  }
}

private fun TableBlock.toTableBlock(): MarkdownBlock.Table {
  val head = children().filterIsInstance<TableHead>().firstOrNull()
  val body = children().filterIsInstance<TableBody>().firstOrNull()
  return MarkdownBlock.Table(
    headers = head?.firstRowCells().orEmpty(),
    rows = body?.children()
      ?.filterIsInstance<TableRow>()
      ?.map { row -> row.cells() }
      ?.toList()
      .orEmpty()
  )
}

private fun TableHead.firstRowCells(): List<String> {
  return children().filterIsInstance<TableRow>().firstOrNull()?.cells().orEmpty()
}

private fun TableRow.cells(): List<String> {
  return children().filterIsInstance<TableCell>().map { it.textContent() }.toList()
}

@Suppress("DEPRECATION")
private fun Node.textContent(): String {
  return TextCollectingVisitor()
    .collectAndGetText(this)
    .trim()
    .replace(Regex("[ \\t]*\\n[ \\t]*"), " ")
    .replace(Regex(" {2,}"), " ")
}

private fun Node.children(): Sequence<Node> {
  return generateSequence(firstChild) { it.next }
}

private val markdownParser: Parser = Parser.builder(
  MutableDataSet().apply {
    set(
      Parser.EXTENSIONS,
      listOf(
        TablesExtension.create(),
        TaskListExtension.create()
      )
    )
  }
).build()
