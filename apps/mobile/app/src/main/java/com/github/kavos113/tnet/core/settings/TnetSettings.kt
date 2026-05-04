package com.github.kavos113.tnet.core.settings

data class TnetSettings(
  val papersWorkspaceUri: String? = null,
  val papersDatabaseUri: String? = null,
  val lastOpenedDestination: String? = null,
  val theme: String = "light"
)
