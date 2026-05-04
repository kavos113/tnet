package com.github.kavos113.tnet.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Article
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.RssFeed
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetRadiusSmall
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetSurfaceHover
import com.github.kavos113.tnet.ui.theme.TnetSurfaceMuted
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
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
        TnetNavigationItem(
          destination = destination,
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
private fun TnetNavigationItem(
  destination: TnetMobileDestination,
  selected: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val background = if (selected) TnetSurfaceHover else TnetSurface
  val foreground = if (selected) TnetText else TnetTextMuted
  Column(
    modifier = modifier
      .background(background, RoundedCornerShape(TnetRadiusSmall))
      .border(BorderStroke(0.5.dp, TnetBorder), RoundedCornerShape(TnetRadiusSmall))
      .clickable(onClick = onClick)
      .padding(horizontal = 4.dp, vertical = 4.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(2.dp)
  ) {
    Icon(
      imageVector = destination.materialIcon(),
      contentDescription = null,
      modifier = Modifier.size(18.dp),
      tint = foreground
    )
    Text(
      text = destination.label,
      modifier = Modifier.fillMaxWidth(),
      style = MaterialTheme.typography.labelSmall,
      color = foreground,
      textAlign = TextAlign.Center,
      maxLines = 1
    )
  }
}

private fun TnetMobileDestination.materialIcon(): ImageVector {
  return when (this) {
    TnetMobileDestination.Tasks -> Icons.Rounded.TaskAlt
    TnetMobileDestination.Rss -> Icons.Rounded.RssFeed
    TnetMobileDestination.Markdown -> Icons.Rounded.EditNote
    TnetMobileDestination.Pdf -> Icons.Rounded.PictureAsPdf
    TnetMobileDestination.Papers -> Icons.AutoMirrored.Rounded.Article
    TnetMobileDestination.Settings -> Icons.Rounded.Settings
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
