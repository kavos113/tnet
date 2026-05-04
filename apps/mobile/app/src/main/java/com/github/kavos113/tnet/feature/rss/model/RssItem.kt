package com.github.kavos113.tnet.feature.rss.model

data class RssItem(
  val id: String = "",
  val feedId: String = "",
  val title: String,
  val link: String?,
  val publishedAt: String?,
  val contentHtml: String? = null,
  val isRead: Boolean = false
)
