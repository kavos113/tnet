package com.github.kavos113.tnet.feature.rss.data

import com.github.kavos113.tnet.feature.rss.model.RssItem
import org.junit.Assert.assertEquals
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
          publishedAt = "Mon, 01 Jan 2024 00:00:00 GMT"
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
        </entry>
      </feed>
      """.trimIndent()
    )

    assertEquals(
      listOf(
        RssItem(
          title = "Atom item",
          link = "https://example.com/atom",
          publishedAt = "2024-01-01T00:00:00Z"
        )
      ),
      items
    )
  }
}
