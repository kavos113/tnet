package com.github.kavos113.tnet.feature.papers

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract

sealed interface PapersWorkspaceValidation {
  data class Valid(
    val databaseUri: Uri
  ) : PapersWorkspaceValidation

  data class Invalid(
    val reason: String
  ) : PapersWorkspaceValidation
}

fun validatePapersWorkspace(
  contentResolver: ContentResolver,
  workspaceUri: Uri
): PapersWorkspaceValidation {
  return runCatching {
    val rootDocumentId = DocumentsContract.getTreeDocumentId(workspaceUri)
    val tnetDirectory = contentResolver.findChildDocument(
      treeUri = workspaceUri,
      parentDocumentId = rootDocumentId,
      displayName = ".tnet",
      mimeType = DocumentsContract.Document.MIME_TYPE_DIR
    ) ?: return PapersWorkspaceValidation.Invalid("Missing .tnet directory.")
    val papersDirectory = contentResolver.findChildDocument(
      treeUri = workspaceUri,
      parentDocumentId = tnetDirectory.documentId,
      displayName = "papers",
      mimeType = DocumentsContract.Document.MIME_TYPE_DIR
    ) ?: return PapersWorkspaceValidation.Invalid("Missing .tnet/papers directory.")
    val database = contentResolver.findChildDocument(
      treeUri = workspaceUri,
      parentDocumentId = papersDirectory.documentId,
      displayName = "papers.db",
      mimeType = null
    ) ?: return PapersWorkspaceValidation.Invalid("Missing .tnet/papers/papers.db.")

    PapersWorkspaceValidation.Valid(
      databaseUri = DocumentsContract.buildDocumentUriUsingTree(workspaceUri, database.documentId)
    )
  }.getOrElse { error ->
    PapersWorkspaceValidation.Invalid(error.message ?: "Unable to inspect workspace.")
  }
}

private data class DocumentEntry(
  val documentId: String,
  val displayName: String,
  val mimeType: String
)

private fun ContentResolver.findChildDocument(
  treeUri: Uri,
  parentDocumentId: String,
  displayName: String,
  mimeType: String?
): DocumentEntry? {
  val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocumentId)
  val projection = arrayOf(
    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
    DocumentsContract.Document.COLUMN_MIME_TYPE
  )

  return query(childrenUri, projection, null, null, null)?.use { cursor ->
    generateSequence { if (cursor.moveToNext()) cursor.toDocumentEntry() else null }
      .firstOrNull { entry ->
        entry.displayName == displayName && (mimeType == null || entry.mimeType == mimeType)
      }
  }
}

private fun Cursor.toDocumentEntry(): DocumentEntry {
  return DocumentEntry(
    documentId = getString(0),
    displayName = getString(1),
    mimeType = getString(2)
  )
}
