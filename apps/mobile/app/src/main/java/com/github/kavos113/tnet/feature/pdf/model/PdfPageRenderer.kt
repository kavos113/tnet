package com.github.kavos113.tnet.feature.pdf.model

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor

data class PdfRenderedPage(
  val bitmap: Bitmap,
  val pageIndex: Int,
  val pageCount: Int
)

fun renderPdfPage(
  context: Context,
  uri: Uri,
  pageIndex: Int = 0
): Result<PdfRenderedPage> {
  return runCatching {
    val fileDescriptor = context.contentResolver.openFileDescriptor(uri, "r")
    requireNotNull(fileDescriptor) { "Unable to open PDF." }
    renderPdfPage(fileDescriptor, pageIndex)
  }
}

private fun renderPdfPage(
  fileDescriptor: ParcelFileDescriptor,
  pageIndex: Int
): PdfRenderedPage {
  fileDescriptor.use { descriptor ->
    PdfRenderer(descriptor).use { renderer ->
      require(renderer.pageCount > 0) { "PDF has no pages." }
      val safePageIndex = pageIndex.coerceIn(0, renderer.pageCount - 1)
      renderer.openPage(safePageIndex).use { page ->
        val scale = 2
        val bitmap = Bitmap.createBitmap(
          page.width * scale,
          page.height * scale,
          Bitmap.Config.ARGB_8888
        )
        bitmap.eraseColor(Color.WHITE)
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        return PdfRenderedPage(
          bitmap = bitmap,
          pageIndex = safePageIndex,
          pageCount = renderer.pageCount
        )
      }
    }
  }
}
