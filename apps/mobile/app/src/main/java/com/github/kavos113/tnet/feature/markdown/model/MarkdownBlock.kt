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
