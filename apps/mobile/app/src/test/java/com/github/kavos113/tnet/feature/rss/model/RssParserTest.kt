package com.github.kavos113.tnet.feature.rss.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RssParserTest {
  @Test
  fun parseRssItemsReadsRssItems() {
    val items = parseRssItems(
      """
      <rss>
        <channel>
          <item>
            <title>First</title>
            <link>https://example.com/first</link>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            <description><![CDATA[<p>Summary</p><script>alert(1)</script>]]></description>
          </item>
        </channel>
      </rss>
      """.trimIndent()
    )

    assertEquals(
      listOf(
        RssItem(
          title = "First",
          link = "https://example.com/first",
          publishedAt = "Mon, 01 Jan 2024 00:00:00 GMT",
          contentHtml = "<p>Summary</p>"
        )
      ),
      items
    )
  }

  @Test
  fun parseRssItemsReadsAtomEntries() {
    val items = parseRssItems(
      """
      <feed>
        <entry>
          <title>Atom item</title>
          <link href="https://example.com/atom" />
          <updated>2024-01-01T00:00:00Z</updated>
          <content><![CDATA[<article><p>Atom body</p></article>]]></content>
        </entry>
      </feed>
      """.trimIndent()
    )

    assertEquals(
      listOf(
        RssItem(
          title = "Atom item",
          link = "https://example.com/atom",
          publishedAt = "2024-01-01T00:00:00Z",
          contentHtml = "<article><p>Atom body</p></article>"
        )
      ),
      items
    )
  }

  @Test
  fun parseRssItemsReadsRdfFeedsWithXmlDeclaration() {
    val items = parseRssItems(
      """
      <?xml version="1.0" encoding="UTF-8"?>
      <rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
      >
        <channel rdf:about="https://example.com/">
          <title>Example RDF</title>
          <link>https://example.com/</link>
        </channel>
        <item rdf:about="https://example.com/rdf-item">
          <title>RDF Item</title>
          <link>https://example.com/rdf-item</link>
          <dc:date>2026-05-01T10:00:00Z</dc:date>
          <description><![CDATA[<p>RDF Summary</p>]]></description>
        </item>
      </rdf:RDF>
      """.trimIndent()
    )

    assertEquals(
      listOf(
        RssItem(
          title = "RDF Item",
          link = "https://example.com/rdf-item",
          publishedAt = "2026-05-01T10:00:00Z",
          contentHtml = "<p>RDF Summary</p>"
        )
      ),
      items
    )
  }

  @Test
  fun parseRssItemsReadsJsonFeedItems() {
    val items = parseRssItems(
      """
      {
        "version": "https://jsonfeed.org/version/1.1",
        "title": "JSON Feed",
        "items": [
          {
            "id": "json-1",
            "url": "https://example.com/json",
            "title": "JSON Item",
            "content_html": "<p>JSON body</p>",
            "date_published": "2026-05-01T10:00:00Z"
          }
        ]
      }
      """.trimIndent()
    )

    assertEquals(
      listOf(
        RssItem(
          title = "JSON Item",
          link = "https://example.com/json",
          publishedAt = "2026-05-01T10:00:00Z",
          contentHtml = "<p>JSON body</p>"
        )
      ),
      items
    )
  }

  @Test
  fun parseRssItemsFallsBackWhenDescriptionContainsMalformedHtml() {
    val items = parseRssItems(
      """
      <rss version="2.0">
        <channel>
          <title>Malformed HTML Feed</title>
          <item>
            <guid>item-1</guid>
            <title>Item with HTML body</title>
            <link>https://example.com/html</link>
            <pubDate>Fri, 01 May 2026 10:00:00 GMT</pubDate>
            <description>
              <body>
                <p>Summary</p>
                <hr>
              </body>
            </description>
          </item>
        </channel>
      </rss>
      """.trimIndent()
    )

    assertEquals(1, items.size)
    assertEquals("Item with HTML body", items[0].title)
    assertEquals("https://example.com/html", items[0].link)
    assertEquals("Fri, 01 May 2026 10:00:00 GMT", items[0].publishedAt)
    assertTrue(requireNotNull(items[0].contentHtml).contains("<hr>"))
    assertTrue(requireNotNull(items[0].contentHtml).contains("<p>Summary</p>"))
  }

  @Test
  fun parseRssItemsReturnsEmptyListForHtmlErrorPages() {
    val items = parseRssItems(
      """
      <html>
        <body>
          <h1>Not a feed</h1>
          <p>The requested page was not found.</p>
        </body>
      </html>
      """.trimIndent()
    )

    assertTrue(items.isEmpty())
  }
}
