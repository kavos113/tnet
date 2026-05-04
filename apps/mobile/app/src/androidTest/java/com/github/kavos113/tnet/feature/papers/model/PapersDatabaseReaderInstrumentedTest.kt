package com.github.kavos113.tnet.feature.papers.model

import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PapersDatabaseReaderInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  @Test
  fun loadsPaperListAndDetailFromCompatibleDatabase() {
    val databaseFile = createPapersDatabase(schemaVersion = 1)

    val papers = loadPaperList(context, Uri.fromFile(databaseFile)).getOrThrow()
    val detail = loadPaperDetail(context, Uri.fromFile(databaseFile), "paper-1").getOrThrow()

    assertEquals(1, papers.size)
    assertEquals("Read-only mobile papers", papers.single().title)
    assertEquals("Ada Lovelace", detail?.authors?.single())
    assertEquals("Android", detail?.tags?.single())
    assertEquals("Sample note", detail?.note)
    assertEquals("Sample summary", detail?.aiOutputs?.single()?.content)
  }

  @Test
  fun rejectsUnsupportedSchemaVersion() {
    val databaseFile = createPapersDatabase(schemaVersion = 99)

    val result = loadPaperList(context, Uri.fromFile(databaseFile))

    assertTrue(result.exceptionOrNull() is UnsupportedPapersSchemaException)
  }

  private fun createPapersDatabase(schemaVersion: Int): File {
    val databaseFile = File.createTempFile("papers-reader", ".db", context.cacheDir)
    SQLiteDatabase.openOrCreateDatabase(databaseFile, null).use { database ->
      database.execSQL("CREATE TABLE papers_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
      database.execSQL(
        """
        CREATE TABLE papers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          abstract TEXT,
          published_year INTEGER,
          venue TEXT,
          doi TEXT,
          arxiv_id TEXT,
          url TEXT,
          pdf_path TEXT,
          directory_path TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
        """.trimIndent()
      )
      database.execSQL("CREATE TABLE paper_authors (id TEXT PRIMARY KEY, paper_id TEXT NOT NULL, name TEXT NOT NULL, position INTEGER NOT NULL)")
      database.execSQL("CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT)")
      database.execSQL("CREATE TABLE paper_tags (paper_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (paper_id, tag_id))")
      database.execSQL("CREATE TABLE notes (paper_id TEXT PRIMARY KEY, content TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)")
      database.execSQL(
        """
        CREATE TABLE paper_ai_outputs (
          paper_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          input_mode TEXT NOT NULL,
          target_language TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          content TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (paper_id, operation, input_mode, target_language)
        )
        """.trimIndent()
      )
      database.execSQL("INSERT INTO papers_schema_migrations (version, applied_at) VALUES ($schemaVersion, '2026-05-04')")
      database.execSQL(
        """
        INSERT INTO papers (
          id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path, created_at, updated_at
        ) VALUES (
          'paper-1', 'Read-only mobile papers', 'Abstract', 2026, 'Mobile Notes', '10.0000/example',
          '2605.00001', 'https://example.com/paper', 'papers/sample.pdf', 'papers', '2026-05-04', '2026-05-04'
        )
        """.trimIndent()
      )
      database.execSQL("INSERT INTO paper_authors (id, paper_id, name, position) VALUES ('author-1', 'paper-1', 'Ada Lovelace', 0)")
      database.execSQL("INSERT INTO tags (id, name, color) VALUES ('tag-1', 'Android', NULL)")
      database.execSQL("INSERT INTO paper_tags (paper_id, tag_id) VALUES ('paper-1', 'tag-1')")
      database.execSQL("INSERT INTO notes (paper_id, content, updated_at) VALUES ('paper-1', 'Sample note', '2026-05-04')")
      database.execSQL(
        """
        INSERT INTO paper_ai_outputs (
          paper_id, operation, input_mode, target_language, provider, model, content, updated_at
        ) VALUES (
          'paper-1', 'summary', 'abstract', 'ja', 'local', 'sample', 'Sample summary', '2026-05-04'
        )
        """.trimIndent()
      )
    }
    return databaseFile
  }
}
