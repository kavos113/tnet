package com.github.kavos113.tnet.feature.markdown.model

import android.content.Context
import android.net.Uri
import android.provider.DocumentsContract
import android.util.Base64
import com.github.kavos113.tnet.core.workspace.normalizeWorkspaceRelativePath

fun readWorkspaceImageDataUrl(
  context: Context,
  workspaceUri: Uri,
  relativePath: String
): String? {
  val normalizedPath = normalizeWorkspaceRelativePath(relativePath).getOrNull() ?: return null
  val documentUri = findWorkspaceDocumentUri(
    context = context,
    workspaceUri = workspaceUri,
    relativePath = normalizedPath
  ) ?: return null
  val mimeType = imageMimeTypeFor(normalizedPath) ?: return null
  val bytes = context.contentResolver.openInputStream(documentUri)?.use { it.readBytes() } ?: return null
  return "data:$mimeType;base64,${Base64.encodeToString(bytes, Base64.NO_WRAP)}"
}

private fun findWorkspaceDocumentUri(
  context: Context,
  workspaceUri: Uri,
  relativePath: String
): Uri? {
  var parentDocumentId = DocumentsContract.getTreeDocumentId(workspaceUri)
  var foundUri: Uri? = null
  val segments = relativePath.split('/').filter { it.isNotBlank() }

  for ((index, segment) in segments.withIndex()) {
    val child = context.contentResolver.findDirectChild(
      workspaceUri = workspaceUri,
      parentDocumentId = parentDocumentId,
      displayName = segment
    ) ?: return null

    foundUri = DocumentsContract.buildDocumentUriUsingTree(workspaceUri, child.documentId)
    if (index < segments.lastIndex) {
      if (!child.isDirectory) return null
      parentDocumentId = child.documentId
    }
  }

  return foundUri
}

private fun android.content.ContentResolver.findDirectChild(
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
    generateSequence { if (cursor.moveToNext()) cursor else null }
      .map {
        WorkspaceDocumentEntry(
          documentId = it.getString(0),
          displayName = it.getString(1),
          mimeType = it.getString(2)
        )
      }
      .firstOrNull { it.displayName == displayName }
  }
}

private fun imageMimeTypeFor(path: String): String? {
  return when (path.substringAfterLast('.', missingDelimiterValue = "").lowercase()) {
    "png" -> "image/png"
    "jpg", "jpeg" -> "image/jpeg"
    "gif" -> "image/gif"
    "webp" -> "image/webp"
    "svg" -> "image/svg+xml"
    else -> null
  }
}

private data class WorkspaceDocumentEntry(
  val documentId: String,
  val displayName: String,
  val mimeType: String
) {
  val isDirectory: Boolean = mimeType == DocumentsContract.Document.MIME_TYPE_DIR
}
