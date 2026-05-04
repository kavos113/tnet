package com.github.kavos113.tnet.core.workspace

fun findWorkspaceFile(
  items: List<WorkspaceFileItem>,
  relativePath: String
): WorkspaceFileItem? {
  val normalized = normalizeWorkspaceRelativePath(relativePath).getOrNull() ?: return null
  return items.asSequence()
    .flatMap { it.flattened() }
    .firstOrNull { it.relativePath == normalized }
}

fun replaceWorkspaceDirectoryChildren(
  items: List<WorkspaceFileItem>,
  relativePath: String,
  children: List<WorkspaceFileItem>
): List<WorkspaceFileItem> {
  val normalized = normalizeWorkspaceRelativePath(relativePath).getOrNull() ?: return items
  return items.map { item ->
    when {
      item.relativePath == normalized && item.isDirectory -> item.copy(
        children = children,
        isChildrenLoaded = true
      )

      item.isDirectory -> item.copy(
        children = replaceWorkspaceDirectoryChildren(item.children, normalized, children)
      )

      else -> item
    }
  }
}

private fun WorkspaceFileItem.flattened(): Sequence<WorkspaceFileItem> {
  return sequenceOf(this) + children.asSequence().flatMap { it.flattened() }
}
