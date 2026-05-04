package com.github.kavos113.tnet.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.ui.theme.TnetTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TnetMobileApp(modifier: Modifier = Modifier) {
  var selectedDestination by rememberSaveable { mutableStateOf(TnetMobileDestination.Tasks) }

  Scaffold(
    modifier = modifier.fillMaxSize(),
    topBar = {
      TopAppBar(
        title = { Text(selectedDestination.label) }
      )
    },
    bottomBar = {
      TnetNavigationBar(
        selectedDestination = selectedDestination,
        onDestinationSelected = { selectedDestination = it }
      )
    }
  ) { innerPadding ->
    DestinationScreen(
      destination = selectedDestination,
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
    )
  }
}

@Composable
private fun TnetNavigationBar(
  selectedDestination: TnetMobileDestination,
  onDestinationSelected: (TnetMobileDestination) -> Unit
) {
  NavigationBar {
    TnetMobileDestination.primaryDestinations.forEach { destination ->
      NavigationBarItem(
        selected = selectedDestination == destination,
        onClick = { onDestinationSelected(destination) },
        icon = {
          Text(
            text = destination.label.first().toString(),
            fontWeight = FontWeight.SemiBold
          )
        },
        label = { Text(destination.label) },
        modifier = Modifier.semantics {
          contentDescription = "${destination.label} tab"
        }
      )
    }
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
    Column(
      modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      Text(
        text = destination.headline,
        style = MaterialTheme.typography.headlineMedium,
        color = MaterialTheme.colorScheme.onBackground
      )
      Text(
        text = destination.supportingText,
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      Spacer(modifier = Modifier.height(8.dp))
      PlaceholderPanel(destination)
    }
  }
}

@Composable
private fun PlaceholderPanel(destination: TnetMobileDestination) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Text(
        text = "Initial scope",
        style = MaterialTheme.typography.titleMedium
      )
      Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
          text = when (destination) {
            TnetMobileDestination.Tasks -> "Local"
            TnetMobileDestination.Rss -> "Mobile fetch"
            TnetMobileDestination.Markdown -> "Read-only"
            TnetMobileDestination.Papers -> "Workspace"
          },
          style = MaterialTheme.typography.bodyMedium
        )
      }
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
