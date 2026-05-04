package com.github.kavos113.tnet.feature.rss.data

import com.github.kavos113.tnet.feature.rss.model.RssItem
import java.net.HttpURLConnection
import java.net.URI

fun fetchRssItems(url: String): Result<List<RssItem>> {
  return runCatching {
    val connection = URI(url).toURL().openConnection() as HttpURLConnection
    connection.connectTimeout = 10_000
    connection.readTimeout = 20_000
    connection.requestMethod = "GET"
    connection.setRequestProperty("User-Agent", "tnet-mobile")

    connection.inputStream.use { input ->
      parseRssItems(input.bufferedReader().readText())
    }
  }
}
