package com.github.kavos113.tnet.feature.markdown.screen

import com.github.kavos113.tnet.feature.markdown.model.MarkdownBlock

data class MarkdownUiState(
  val selectedUri: String? = null,
  val blocks: List<MarkdownBlock> = emptyList(),
  val error: String? = null,
  val isLoading: Boolean = false
)
