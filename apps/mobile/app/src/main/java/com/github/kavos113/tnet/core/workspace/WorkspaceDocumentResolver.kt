package com.github.kavos113.tnet.core.workspace

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract

fun findWorkspaceDocumentByRelativePath(
  contentResolver: ContentResolver,
  workspaceUri: Uri,
  relativePath: String
): Result<Uri?> {
  return runCatching {
    val normalized = normalizeWorkspaceRelativePath(relativePath).getOrThrow()
    val targetSegments = normalized.split('/').filter { it.isNotBlank() }
    var parentDocumentId = DocumentsContract.getTreeDocumentId(workspaceUri)
    var documentUri: Uri? = null

    targetSegments.forEachIndexed { index, segment ->
      val child = contentResolver.findDirectChild(
        workspaceUri = workspaceUri,
        parentDocumentId = parentDocumentId,
        displayName = segment
      ) ?: return@runCatching null
      documentUri = DocumentsContract.buildDocumentUriUsingTree(workspaceUri, child.documentId)
      if (index < targetSegments.lastIndex) {
        require(child.mimeType == DocumentsContract.Document.MIME_TYPE_DIR) {
          "workspace path segment is not a directory"
        }
        parentDocumentId = child.documentId
      }
    }

    documentUri
  }
}

private data class WorkspaceDocumentEntry(
  val documentId: String,
  val displayName: String,
  val mimeType: String
)

private fun ContentResolver.findDirectChild(
  workspaceUri: Uri,
  parentDocumentId: String,
  displayName: String
): WorkspaceDocumentEntry? {
  val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(workspaceUri, parentDocumentId)
  val projection = arrayOf(
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE
  )

  return query(childrenUri, projection, null, null, null)?.use { cursor ->
    generateSequence { if (cursor.moveToNext()) cursor.toWorkspaceDocumentEntry() else null }
      .firstOrNull { it.displayName == displayName }
  }
}

private fun Cursor.toWorkspaceDocumentEntry(): WorkspaceDocumentEntry {
  return WorkspaceDocumentEntry(
    documentId = getString(0),
    displayName = getString(1),
    mimeType = getString(2)
  )
}
