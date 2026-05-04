package com.github.kavos113.tnet.core.workspace

data class WorkspaceRoot(
  val uri: String,
  val name: String
)

data class WorkspaceFileItem(
  val name: String,
  val relativePath: String,
  val documentUri: String,
  val isDirectory: Boolean,
  val children: List<WorkspaceFileItem> = emptyList(),
  val isChildrenLoaded: Boolean = !isDirectory
)
