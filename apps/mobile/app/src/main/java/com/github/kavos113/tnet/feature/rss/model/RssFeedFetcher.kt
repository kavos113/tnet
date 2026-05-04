package com.github.kavos113.tnet.feature.rss.model

import java.net.HttpURLConnection
import java.net.URI

fun fetchRssItems(url: String): Result<List<RssItem>> {
  return fetchRssFeed(url).map { it.items }
}

fun fetchRssFeed(url: String): Result<ParsedRssFeed> {
  return runCatching {
    val connection = URI(url).toURL().openConnection() as HttpURLConnection
    connection.connectTimeout = 10_000
    connection.readTimeout = 20_000
    connection.requestMethod = "GET"
    connection.setRequestProperty("User-Agent", "tnet-mobile")

    connection.inputStream.use { input ->
      parseRssFeed(input.bufferedReader().readText())
    }
  }
}
