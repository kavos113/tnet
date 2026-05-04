package com.github.kavos113.tnet.feature.papers.model

sealed interface PaperPdfPathState {
  data class Available(val relativePath: String) : PaperPdfPathState
  data object Missing : PaperPdfPathState
  data class Rejected(val reason: String) : PaperPdfPathState
}

fun resolvePaperPdfPath(pdfPath: String?): PaperPdfPathState {
  val normalized = pdfPath
    ?.replace('\\', '/')
    ?.trim()
    ?.trimStart('/')

  if (normalized.isNullOrBlank()) {
    return PaperPdfPathState.Missing
  }

  val segments = normalized.split('/').filter { it.isNotBlank() }
  if (segments.any { it == "." || it == ".." }) {
    return PaperPdfPathState.Rejected("PDF path escapes the selected workspace.")
  }

  return PaperPdfPathState.Available(segments.joinToString("/"))
}
