package com.github.kavos113.tnet.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.core.settings.TnetSettings
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import com.github.kavos113.tnet.feature.markdown.screen.MarkdownScreen
import com.github.kavos113.tnet.feature.papers.screen.PapersScreen
import com.github.kavos113.tnet.feature.pdf.screen.PdfScreen
import com.github.kavos113.tnet.feature.rss.screen.RssScreen
import com.github.kavos113.tnet.feature.tasks.screen.TasksScreen
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurfaceMuted
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTheme
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TnetMobileApp(
  modifier: Modifier = Modifier,
  viewModel: TnetMobileViewModel = viewModel()
) {
  val context = LocalContext.current
  val settingsRepository = remember { TnetSettingsRepository(context) }
  val settings by settingsRepository.settings.collectAsState(initial = TnetSettings())
  val coroutineScope = rememberCoroutineScope()
  val uiState by viewModel.uiState.collectAsState()
  LaunchedEffect(settings.lastOpenedDestination) {
    val destination = settings.lastOpenedDestination
      ?.let { value -> TnetMobileDestination.entries.firstOrNull { it.name == value } }
    if (destination != null && uiState.selectedDestination == TnetMobileDestination.Tasks) {
      viewModel.selectDestination(destination)
    }
  }

  Scaffold(
    modifier = modifier.fillMaxSize(),
    topBar = {
      TopAppBar(
        title = {
          Text(
            text = uiState.selectedDestination.label,
            style = MaterialTheme.typography.titleMedium
          )
        },
        modifier = Modifier
          .heightIn(min = 48.dp)
          .border(BorderStroke(0.5.dp, TnetBorder)),
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = TnetSurfaceMuted,
          titleContentColor = TnetText
        )
      )
    },
    bottomBar = {
      TnetNavigationBar(
        selectedDestination = uiState.selectedDestination,
        onDestinationSelected = { destination ->
          viewModel.selectDestination(destination)
          coroutineScope.launch {
            settingsRepository.saveLastOpenedDestination(destination.name)
          }
        }
      )
    }
  ) { innerPadding ->
    DestinationScreen(
      destination = uiState.selectedDestination,
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
    )
  }
}

@Composable
private fun DestinationScreen(
  destination: TnetMobileDestination,
  modifier: Modifier = Modifier
) {
  Surface(
    modifier = modifier,
    color = MaterialTheme.colorScheme.background
  ) {
    when (destination) {
      TnetMobileDestination.Tasks -> TasksScreen(modifier = Modifier.fillMaxSize())
      TnetMobileDestination.Rss -> RssScreen(modifier = Modifier.fillMaxSize())
      TnetMobileDestination.Markdown -> MarkdownScreen(modifier = Modifier.fillMaxSize())
      TnetMobileDestination.Papers -> PapersScreen(modifier = Modifier.fillMaxSize())
      TnetMobileDestination.Pdf -> PdfScreen(modifier = Modifier.fillMaxSize())
      TnetMobileDestination.Settings -> SettingsScreen(
        modifier = Modifier.padding(horizontal = TnetSpace4, vertical = TnetSpace3)
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TnetMobileAppPreview() {
  TnetTheme {
    TnetMobileApp()
  }
}
