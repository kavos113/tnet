package com.github.kavos113.tnet.feature.papers

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import java.io.File

data class PaperListItem(
  val id: String,
  val title: String,
  val publishedYear: Int?,
  val venue: String?,
  val pdfPath: String?
)

fun loadPaperList(
  context: Context,
  databaseUri: Uri
): Result<List<PaperListItem>> {
  return runCatching {
    val databaseFile = copyDatabaseToWorkingFile(context, databaseUri)
    val database = SQLiteDatabase.openDatabase(
      databaseFile.absolutePath,
      null,
      SQLiteDatabase.OPEN_READONLY
    )

    database.use {
      it.rawQuery(
        """
        SELECT id, title, published_year, venue, pdf_path
        FROM papers
        ORDER BY updated_at DESC
        LIMIT 100
        """.trimIndent(),
        emptyArray()
      ).use { cursor ->
        val papers = mutableListOf<PaperListItem>()
        while (cursor.moveToNext()) {
          papers += PaperListItem(
            id = cursor.getString(0),
            title = cursor.getString(1),
            publishedYear = if (cursor.isNull(2)) null else cursor.getInt(2),
            venue = if (cursor.isNull(3)) null else cursor.getString(3),
            pdfPath = if (cursor.isNull(4)) null else cursor.getString(4)
          )
        }
        papers
      }
    }
  }
}

private fun copyDatabaseToWorkingFile(
  context: Context,
  databaseUri: Uri
): File {
  val target = File(context.cacheDir, "papers-readonly.db")
  context.contentResolver.openInputStream(databaseUri).use { input ->
    requireNotNull(input) { "Unable to open papers database." }
    target.outputStream().use { output ->
      input.copyTo(output)
    }
  }
  return target
}
