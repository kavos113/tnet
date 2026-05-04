package com.github.kavos113.tnet.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.ui.components.TnetPrimaryButton
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun SettingsScreen(modifier: Modifier = Modifier) {
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
  val openMarkdownWorkspace = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult
    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectMarkdownWorkspace(uri)
  }
  val openPdfWorkspace = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocumentTree()
  ) { uri: Uri? ->
    if (uri == null) return@rememberLauncherForActivityResult
    context.contentResolver.takePersistableUriPermission(
      uri,
      Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    viewModel.selectPdfWorkspace(uri)
  }
  val workspaceLabel = uiState.selectedWorkspaceUri ?: "No Papers workspace selected."

  SettingsScreenContent(
    uiState = uiState,
    workspaceLabel = workspaceLabel,
    onSelectWorkspace = { openWorkspace.launch(null) },
    onSelectDatabase = { openDatabase.launch(arrayOf("*/*")) },
    onSelectMarkdownWorkspace = { openMarkdownWorkspace.launch(null) },
    onSelectPdfWorkspace = { openPdfWorkspace.launch(null) },
    modifier = modifier
  )
}

@Composable
private fun SettingsScreenContent(
  uiState: SettingsUiState,
  workspaceLabel: String = uiState.selectedWorkspaceUri ?: "No Papers workspace selected.",
  onSelectWorkspace: () -> Unit,
  onSelectDatabase: () -> Unit,
  onSelectMarkdownWorkspace: () -> Unit,
  onSelectPdfWorkspace: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Workspaces",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Select synced desktop workspaces. Markdown, PDF, and Papers are read-only on mobile.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    TnetSecondaryButton(
      text = "Select Markdown workspace",
      onClick = onSelectMarkdownWorkspace
    )
    Text(
      text = uiState.selectedMarkdownWorkspaceUri ?: "No Markdown workspace selected.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    TnetSecondaryButton(
      text = "Select PDF workspace",
      onClick = onSelectPdfWorkspace
    )
    Text(
      text = uiState.selectedPdfWorkspaceUri ?: "No PDF workspace selected.",
      style = MaterialTheme.typography.bodyMedium,
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
      onSelectMarkdownWorkspace = {},
      onSelectPdfWorkspace = {},
      modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp)
    )
  }
}
