package com.github.kavos113.tnet.feature.markdown.model

import android.content.Context
import android.net.Uri

fun readMarkdownDocument(context: Context, uri: Uri): Result<String> {
  return runCatching {
    context.contentResolver.openInputStream(uri).use { input ->
      requireNotNull(input) { "Unable to open document stream." }
      input.readBytes().toString(Charsets.UTF_8)
    }
  }
}
