package com.github.kavos113.tnet.ui

enum class TnetMobileDestination(
  val label: String,
  val headline: String,
  val supportingText: String
) {
  Tasks(
    label = "Tasks",
    headline = "Tasks",
    supportingText = "Local task management for this device."
  ),
  Rss(
    label = "RSS",
    headline = "RSS",
    supportingText = "Mobile-managed feeds and articles."
  ),
  Markdown(
    label = "Markdown",
    headline = "Markdown",
    supportingText = "Read-only documents from selected files or folders."
  ),
  Papers(
    label = "Papers",
    headline = "Papers",
    supportingText = "Read-only papers from a synced workspace."
  );

  companion object {
    val primaryDestinations: List<TnetMobileDestination> = entries
  }
}
