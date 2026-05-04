package com.github.kavos113.tnet.core.workspace

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract

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
