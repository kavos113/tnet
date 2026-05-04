package com.github.kavos113.tnet.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.kavos113.tnet.feature.markdown.screen.MarkdownScreen
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.feature.papers.screen.PapersScreen
import com.github.kavos113.tnet.feature.pdf.screen.PdfScreen
import com.github.kavos113.tnet.feature.rss.screen.RssScreen
import com.github.kavos113.tnet.feature.tasks.screen.TasksScreen
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.components.TnetSpace4
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetSurfaceMuted
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TnetMobileApp(
  modifier: Modifier = Modifier,
  viewModel: TnetMobileViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()

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
        onDestinationSelected = viewModel::selectDestination
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
private fun TnetNavigationBar(
  selectedDestination: TnetMobileDestination,
  onDestinationSelected: (TnetMobileDestination) -> Unit
) {
  Surface(
    modifier = Modifier
      .fillMaxWidth()
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
private fun DestinationScreen(
  destination: TnetMobileDestination,
  modifier: Modifier = Modifier
) {
  Surface(
    modifier = modifier,
    color = MaterialTheme.colorScheme.background
  ) {
    if (destination == TnetMobileDestination.Tasks) {
      TasksScreen(modifier = Modifier.fillMaxSize())
      return@Surface
    }

    if (destination == TnetMobileDestination.Rss) {
      RssScreen(modifier = Modifier.fillMaxSize())
      return@Surface
    }

    if (destination == TnetMobileDestination.Markdown) {
      MarkdownScreen(modifier = Modifier.fillMaxSize())
      return@Surface
    }

    if (destination == TnetMobileDestination.Papers) {
      PapersScreen(modifier = Modifier.fillMaxSize())
      return@Surface
    }

    if (destination == TnetMobileDestination.Pdf) {
      PdfScreen(modifier = Modifier.fillMaxSize())
      return@Surface
    }

    if (destination == TnetMobileDestination.Settings) {
      SettingsScreen(modifier = Modifier.padding(horizontal = TnetSpace4, vertical = TnetSpace3))
      return@Surface
    }

    Column(
      modifier = Modifier.padding(horizontal = TnetSpace4, vertical = TnetSpace3),
      verticalArrangement = Arrangement.spacedBy(TnetSpace3)
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

@Composable
private fun SettingsScreen(modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val viewModel: SettingsViewModel = viewModel()
  val uiState by viewModel.uiState.collectAsState()

  val openWorkspace = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectWorkspace(uri)
  }
  val openDatabase = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult

    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectDatabase(uri)
  }
  val workspaceLabel = uiState.selectedWorkspaceUri ?: "No Papers workspace selected."

  SettingsScreenContent(
    uiState = uiState,
    workspaceLabel = workspaceLabel,
    onSelectWorkspace = { openWorkspace.launch(null) },
    onSelectDatabase = { openDatabase.launch(arrayOf("*/*")) },
    modifier = modifier
  )
}

@Composable
private fun SettingsScreenContent(
  uiState: SettingsUiState,
  workspaceLabel: String = uiState.selectedWorkspaceUri ?: "No Papers workspace selected.",
  onSelectWorkspace: () -> Unit,
  onSelectDatabase: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Papers workspace",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Select the synced desktop workspace folder. The app will read .tnet/papers/papers.db and PDFs without writing to the workspace.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    Box(
      modifier = Modifier.semantics {
        contentDescription = "Select Papers workspace"
      }
    ) {
      TnetPrimaryButton(
        text = "Select workspace",
        onClick = onSelectWorkspace
      )
    }
    Text(
      text = workspaceLabel,
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    WorkspaceValidationText(uiState.workspaceValidation)
    TnetSecondaryButton(
      text = "Select SQLite file",
      onClick = onSelectDatabase
    )
    Text(
      text = uiState.selectedDatabaseUri ?: "No SQLite file selected.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
  }
}

@Composable
private fun WorkspaceValidationText(validation: PapersWorkspaceValidation?) {
  val text = when (validation) {
    null -> "Workspace has not been checked yet."
    is PapersWorkspaceValidation.Valid -> "Found papers database: ${validation.databaseUri}"
    is PapersWorkspaceValidation.Invalid -> validation.reason
  }
  val color = when (validation) {
    is PapersWorkspaceValidation.Valid -> MaterialTheme.colorScheme.primary
    is PapersWorkspaceValidation.Invalid -> MaterialTheme.colorScheme.error
    null -> MaterialTheme.colorScheme.onSurfaceVariant
  }

  Text(
    text = text,
    style = MaterialTheme.typography.bodyMedium,
    color = color
  )
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

@Preview(showBackground = true)
@Composable
private fun WorkspaceValidationTextPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      WorkspaceValidationText(
        PapersWorkspaceValidation.Invalid("papers.db was not found in this workspace.")
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

@Preview(showBackground = true)
@Composable
private fun SettingsScreenContentPreview() {
  TnetTheme {
    SettingsScreenContent(
      uiState = SettingsUiState(
        selectedWorkspaceUri = "content://workspace/root",
        workspaceValidation = PapersWorkspaceValidation.Valid(
          databaseUri = Uri.parse("content://workspace/root/.tnet/papers/papers.db")
        )
      ),
      onSelectWorkspace = {},
      onSelectDatabase = {},
      modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp)
    )
  }
}
