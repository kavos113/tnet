package com.github.kavos113.tnet.core.settings

data class TnetSettings(
  val papersWorkspaceUri: String? = null,
  val papersDatabaseUri: String? = null,
  val markdownWorkspaceUris: List<String> = emptyList(),
  val activeMarkdownWorkspaceUri: String? = null,
  val pdfWorkspaceUris: List<String> = emptyList(),
  val activePdfWorkspaceUri: String? = null,
  val markdownOpenedFiles: List<String> = emptyList(),
  val pdfOpenedFiles: List<String> = emptyList(),
  val activePdfIndex: Int = -1,
  val lastOpenedDestination: String? = null,
  val theme: String = "light",
  val markdownViewerPosition: Int = 0,
  val pdfViewerPosition: Int = 0
)
