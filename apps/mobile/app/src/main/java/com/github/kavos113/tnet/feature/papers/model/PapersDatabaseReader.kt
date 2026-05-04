package com.github.kavos113.tnet.feature.papers.model

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

data class PaperDetail(
  val id: String,
  val title: String,
  val abstract: String?,
  val publishedYear: Int?,
  val venue: String?,
  val doi: String?,
  val arxivId: String?,
  val url: String?,
  val pdfPath: String?,
  val directoryPath: String,
  val authors: List<String>,
  val tags: List<String>,
  val note: String?,
  val aiOutputs: List<PaperAiOutput>
)

data class PaperAiOutput(
  val operation: String,
  val inputMode: String,
  val targetLanguage: String,
  val provider: String,
  val model: String,
  val content: String
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

fun loadPaperDetail(
  context: Context,
  databaseUri: Uri,
  paperId: String
): Result<PaperDetail?> {
  return runCatching {
    val databaseFile = copyDatabaseToWorkingFile(context, databaseUri)
    val database = SQLiteDatabase.openDatabase(
      databaseFile.absolutePath,
      null,
      SQLiteDatabase.OPEN_READONLY
    )

    database.use {
      val base = it.rawQuery(
        """
        SELECT id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path
        FROM papers
        WHERE id = ?
        LIMIT 1
        """.trimIndent(),
        arrayOf(paperId)
      ).use { cursor ->
        if (!cursor.moveToNext()) {
          null
        } else {
          PaperDetailBase(
            id = cursor.getString(0),
            title = cursor.getString(1),
            abstract = cursor.getNullableString(2),
            publishedYear = if (cursor.isNull(3)) null else cursor.getInt(3),
            venue = cursor.getNullableString(4),
            doi = cursor.getNullableString(5),
            arxivId = cursor.getNullableString(6),
            url = cursor.getNullableString(7),
            pdfPath = cursor.getNullableString(8),
            directoryPath = cursor.getString(9)
          )
        }
      } ?: return@use null

      PaperDetail(
        id = base.id,
        title = base.title,
        abstract = base.abstract,
        publishedYear = base.publishedYear,
        venue = base.venue,
        doi = base.doi,
        arxivId = base.arxivId,
        url = base.url,
        pdfPath = base.pdfPath,
        directoryPath = base.directoryPath,
        authors = it.loadStrings(
          """
          SELECT name
          FROM paper_authors
          WHERE paper_id = ?
          ORDER BY position ASC
          """.trimIndent(),
          paperId
        ),
        tags = it.loadStrings(
          """
          SELECT tags.name
          FROM paper_tags
          JOIN tags ON tags.id = paper_tags.tag_id
          WHERE paper_tags.paper_id = ?
          ORDER BY tags.name ASC
          """.trimIndent(),
          paperId
        ),
        note = it.rawQuery(
          "SELECT content FROM notes WHERE paper_id = ? LIMIT 1",
          arrayOf(paperId)
        ).use { cursor ->
          if (cursor.moveToNext()) cursor.getNullableString(0) else null
        },
        aiOutputs = it.rawQuery(
          """
          SELECT operation, input_mode, target_language, provider, model, content
          FROM paper_ai_outputs
          WHERE paper_id = ?
          ORDER BY updated_at DESC
          """.trimIndent(),
          arrayOf(paperId)
        ).use { cursor ->
          val outputs = mutableListOf<PaperAiOutput>()
          while (cursor.moveToNext()) {
            outputs += PaperAiOutput(
              operation = cursor.getString(0),
              inputMode = cursor.getString(1),
              targetLanguage = cursor.getString(2),
              provider = cursor.getString(3),
              model = cursor.getString(4),
              content = cursor.getString(5)
            )
          }
          outputs
        }
      )
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

private data class PaperDetailBase(
  val id: String,
  val title: String,
  val abstract: String?,
  val publishedYear: Int?,
  val venue: String?,
  val doi: String?,
  val arxivId: String?,
  val url: String?,
  val pdfPath: String?,
  val directoryPath: String
)

private fun SQLiteDatabase.loadStrings(
  query: String,
  paperId: String
): List<String> {
  return rawQuery(query, arrayOf(paperId)).use { cursor ->
    val values = mutableListOf<String>()
    while (cursor.moveToNext()) {
      values += cursor.getString(0)
    }
    values
  }
}

private fun android.database.Cursor.getNullableString(index: Int): String? {
  return if (isNull(index)) null else getString(index)
}
