package com.github.kavos113.tnet.feature.pdf.screen

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast

internal fun openPdfInExternalViewer(
  context: Context,
  uriText: String?
) {
  if (uriText.isNullOrBlank()) return
  val uri = Uri.parse(uriText)
  val intent = Intent(Intent.ACTION_VIEW).apply {
    setDataAndType(uri, "application/pdf")
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
  }
  try {
    context.startActivity(Intent.createChooser(intent, "Open PDF"))
  } catch (_: ActivityNotFoundException) {
    Toast.makeText(context, "No PDF viewer app is available.", Toast.LENGTH_SHORT).show()
  }
}
