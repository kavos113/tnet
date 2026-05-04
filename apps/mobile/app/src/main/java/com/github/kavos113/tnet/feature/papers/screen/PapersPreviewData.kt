package com.github.kavos113.tnet.feature.papers.screen

import com.github.kavos113.tnet.feature.papers.model.PaperAiOutput
import com.github.kavos113.tnet.feature.papers.model.PaperDetail
import com.github.kavos113.tnet.feature.papers.model.PaperListItem

internal val previewPaperListItem = PaperListItem(
  id = "paper-preview",
  title = "Component previews for read-only research tools",
  publishedYear = 2026,
  venue = "Mobile Systems Notes",
  pdfPath = "papers/previews.pdf",
  directoryPath = "papers"
)

internal val previewPaperDetail = PaperDetail(
  id = "paper-preview",
  title = "Component previews for read-only research tools",
  abstract = "A sample paper used to preview smaller Papers UI components.",
  publishedYear = 2026,
  venue = "Mobile Systems Notes",
  doi = "10.0000/example",
  arxivId = "2605.00001",
  url = "https://example.com/papers/preview",
  pdfPath = "papers/previews.pdf",
  directoryPath = "papers",
  authors = listOf("Ada Lovelace", "Grace Hopper"),
  tags = listOf("Android", "Preview"),
  note = "This note is read-only on mobile.",
  aiOutputs = listOf(
    PaperAiOutput(
      operation = "summary",
      inputMode = "abstract",
      targetLanguage = "ja",
      provider = "local",
      model = "sample",
      content = "Sample summary for preview."
    )
  )
)
