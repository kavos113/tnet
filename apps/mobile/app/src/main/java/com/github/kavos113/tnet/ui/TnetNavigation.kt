package com.github.kavos113.tnet.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurfaceMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun TnetNavigationBar(
  selectedDestination: TnetMobileDestination,
  onDestinationSelected: (TnetMobileDestination) -> Unit
) {
  Surface(
    modifier = Modifier
      .border(BorderStroke(0.5.dp, TnetBorder)),
    color = TnetSurfaceMuted,
    tonalElevation = 0.dp,
    shadowElevation = 0.dp
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp),
      horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      TnetMobileDestination.primaryDestinations.forEach { destination ->
        val selected = selectedDestination == destination
        TnetSecondaryButton(
          text = destination.label,
          selected = selected,
          onClick = { onDestinationSelected(destination) },
          modifier = Modifier
            .weight(1f)
            .semantics {
              contentDescription = "${destination.label} tab"
            }
        )
      }
    }
  }
}

@Composable
internal fun PlaceholderPanel(destination: TnetMobileDestination) {
  TnetPanel {
    Column(
      verticalArrangement = Arrangement.spacedBy(TnetSpace2)
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
            TnetMobileDestination.Pdf -> "Read-only"
            TnetMobileDestination.Papers -> "Workspace"
            TnetMobileDestination.Settings -> "Preferences"
          },
          style = MaterialTheme.typography.bodyMedium
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun TnetNavigationBarPreview() {
  TnetTheme {
    TnetNavigationBar(
      selectedDestination = TnetMobileDestination.Papers,
      onDestinationSelected = {}
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun PlaceholderPanelPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PlaceholderPanel(TnetMobileDestination.Papers)
    }
  }
}
