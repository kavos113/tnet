package com.github.kavos113.tnet.core.workspace

import android.net.Uri
import android.provider.DocumentsContract

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
