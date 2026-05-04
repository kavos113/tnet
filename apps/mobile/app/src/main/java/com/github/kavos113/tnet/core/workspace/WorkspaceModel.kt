package com.github.kavos113.tnet.core.workspace

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract

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

fun normalizeWorkspaceRelativePath(path: String): Result<String> {
  return runCatching {
    val normalized = path.replace('\\', '/').trim().trimStart('/')
    require(normalized.isNotBlank()) { "path is required" }
    require(!normalized.startsWith("/")) { "absolute paths are not allowed" }
    val segments = normalized.split('/').filter { it.isNotBlank() }
    require(segments.none { it == "." || it == ".." }) { "path must be inside the workspace" }
    segments.joinToString("/")
  }
}

fun workspaceNameFromTreeUri(uri: Uri): String {
  return DocumentsContract.getTreeDocumentId(uri)
    .substringAfterLast(':')
    .substringAfterLast('/')
    .ifBlank { uri.lastPathSegment.orEmpty() }
    .ifBlank { "workspace" }
}

fun loadWorkspaceFileTree(
  contentResolver: ContentResolver,
  workspaceUri: Uri,
  allowedExtensions: Set<String>
): Result<List<WorkspaceFileItem>> {
  return runCatching {
    val rootDocumentId = DocumentsContract.getTreeDocumentId(workspaceUri)
    contentResolver.loadChildren(
      workspaceUri = workspaceUri,
      parentDocumentId = rootDocumentId,
      parentRelativePath = "",
      allowedExtensions = allowedExtensions
    )
  }
}

fun loadWorkspaceRootFileTree(
  contentResolver: ContentResolver,
  workspaceUri: Uri,
  allowedExtensions: Set<String>
): Result<List<WorkspaceFileItem>> {
  return runCatching {
    val rootDocumentId = DocumentsContract.getTreeDocumentId(workspaceUri)
    contentResolver.loadDirectChildren(
      workspaceUri = workspaceUri,
      parentDocumentId = rootDocumentId,
      parentRelativePath = "",
      allowedExtensions = allowedExtensions
    )
  }
}

fun loadWorkspaceDirectoryChildren(
  contentResolver: ContentResolver,
  workspaceUri: Uri,
  directory: WorkspaceFileItem,
  allowedExtensions: Set<String>
): Result<List<WorkspaceFileItem>> {
  return runCatching {
    require(directory.isDirectory) { "workspace item must be a directory" }
    val directoryDocumentId = DocumentsContract.getDocumentId(Uri.parse(directory.documentUri))
    contentResolver.loadDirectChildren(
      workspaceUri = workspaceUri,
      parentDocumentId = directoryDocumentId,
      parentRelativePath = directory.relativePath,
      allowedExtensions = allowedExtensions
    )
  }
}

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

private fun ContentResolver.loadChildren(
  workspaceUri: Uri,
  parentDocumentId: String,
  parentRelativePath: String,
  allowedExtensions: Set<String>
): List<WorkspaceFileItem> {
  val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(workspaceUri, parentDocumentId)
  val projection = arrayOf(
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE
  )

  return query(childrenUri, projection, null, null, null)?.use { cursor ->
    generateSequence { if (cursor.moveToNext()) cursor.toDocumentEntry() else null }
      .mapNotNull { entry ->
        val relativePath = listOf(parentRelativePath, entry.displayName)
          .filter { it.isNotBlank() }
          .joinToString("/")
        val isDirectory = entry.mimeType == DocumentsContract.Document.MIME_TYPE_DIR
        val children = if (isDirectory) {
          loadChildren(
            workspaceUri = workspaceUri,
            parentDocumentId = entry.documentId,
            parentRelativePath = relativePath,
            allowedExtensions = allowedExtensions
          )
        } else {
          emptyList()
        }
        val isAllowedFile = allowedExtensions.any { entry.displayName.lowercase().endsWith(it) }
        if (!isDirectory && !isAllowedFile) return@mapNotNull null
        if (isDirectory && children.isEmpty()) return@mapNotNull null
        WorkspaceFileItem(
          name = entry.displayName,
          relativePath = relativePath,
          documentUri = DocumentsContract.buildDocumentUriUsingTree(workspaceUri, entry.documentId).toString(),
          isDirectory = isDirectory,
          children = children,
          isChildrenLoaded = isDirectory
        )
      }
      .sortedWith(compareBy<WorkspaceFileItem> { !it.isDirectory }.thenBy { it.name.lowercase() })
      .toList()
  }.orEmpty()
}

private fun ContentResolver.loadDirectChildren(
  workspaceUri: Uri,
  parentDocumentId: String,
  parentRelativePath: String,
  allowedExtensions: Set<String>
): List<WorkspaceFileItem> {
  val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(workspaceUri, parentDocumentId)
  val projection = arrayOf(
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE
  )

  return query(childrenUri, projection, null, null, null)?.use { cursor ->
    generateSequence { if (cursor.moveToNext()) cursor.toDocumentEntry() else null }
      .mapNotNull { entry ->
        val relativePath = listOf(parentRelativePath, entry.displayName)
          .filter { it.isNotBlank() }
          .joinToString("/")
        val isDirectory = entry.mimeType == DocumentsContract.Document.MIME_TYPE_DIR
        val isAllowedFile = allowedExtensions.any { entry.displayName.lowercase().endsWith(it) }
        if (!isDirectory && !isAllowedFile) return@mapNotNull null
        WorkspaceFileItem(
          name = entry.displayName,
          relativePath = relativePath,
          documentUri = DocumentsContract.buildDocumentUriUsingTree(workspaceUri, entry.documentId).toString(),
          isDirectory = isDirectory,
          children = emptyList(),
          isChildrenLoaded = !isDirectory
        )
      }
      .sortedWith(compareBy<WorkspaceFileItem> { !it.isDirectory }.thenBy { it.name.lowercase() })
      .toList()
  }.orEmpty()
}

private data class DocumentEntry(
  val documentId: String,
  val displayName: String,
  val mimeType: String
)

private fun Cursor.toDocumentEntry(): DocumentEntry {
  return DocumentEntry(
    documentId = getString(0),
    displayName = getString(1),
    mimeType = getString(2)
  )
}
