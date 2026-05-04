package com.github.kavos113.tnet.feature.papers

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.core.settings.TnetSettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun PapersScreen(modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val settingsRepository = remember(context) {
    TnetSettingsRepository(context.applicationContext)
  }
  val settings by settingsRepository.settings.collectAsState(initial = null)
  var validation by remember { mutableStateOf<PapersWorkspaceValidation?>(null) }
  var papers by remember { mutableStateOf<Result<List<PaperListItem>>?>(null) }
  val workspaceUri = settings?.papersWorkspaceUri

  LaunchedEffect(workspaceUri) {
    validation = null
    papers = null
    val uri = workspaceUri ?: return@LaunchedEffect
    val nextValidation = withContext(Dispatchers.IO) {
      validatePapersWorkspace(context.contentResolver, Uri.parse(uri))
    }
    validation = nextValidation
    if (nextValidation is PapersWorkspaceValidation.Valid) {
      papers = withContext(Dispatchers.IO) {
        loadPaperList(context, nextValidation.databaseUri)
      }
    }
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = 20.dp, vertical = 18.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    Text(
      text = "Papers",
      style = MaterialTheme.typography.headlineMedium
    )
    Text(
      text = "Read-only papers from a synced desktop workspace.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    PapersWorkspaceStatus(
      workspaceUri = workspaceUri,
      validation = validation
    )
    PapersListPreview(papers)
  }
}

@Composable
private fun PapersWorkspaceStatus(
  workspaceUri: String?,
  validation: PapersWorkspaceValidation?
) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Text(
        text = "Workspace",
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = workspaceUri ?: "Select a Papers workspace in Settings.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      val status = when (validation) {
        null -> if (workspaceUri == null) "Not configured" else "Checking workspace..."
        is PapersWorkspaceValidation.Valid -> "Ready: ${validation.databaseUri}"
        is PapersWorkspaceValidation.Invalid -> validation.reason
      }
      val statusColor = when (validation) {
        is PapersWorkspaceValidation.Valid -> MaterialTheme.colorScheme.primary
        is PapersWorkspaceValidation.Invalid -> MaterialTheme.colorScheme.error
        null -> MaterialTheme.colorScheme.onSurfaceVariant
      }
      Text(
        text = status,
        style = MaterialTheme.typography.bodyMedium,
        color = statusColor
      )
    }
  }
}

@Composable
private fun PapersListPreview(papers: Result<List<PaperListItem>>?) {
  when {
    papers == null -> return
    papers.isFailure -> Text(
      text = papers.exceptionOrNull()?.message ?: "Unable to read papers.",
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.error
    )

    else -> {
      val items = papers.getOrDefault(emptyList())
      if (items.isEmpty()) {
        Text(
          text = "No papers found.",
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      } else {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
          items.forEach { paper ->
            PaperRow(paper)
          }
        }
      }
    }
  }
}

@Composable
private fun PaperRow(paper: PaperListItem) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    tonalElevation = 1.dp,
    shape = MaterialTheme.shapes.medium,
    color = MaterialTheme.colorScheme.surfaceContainer
  ) {
    Column(
      modifier = Modifier.padding(14.dp),
      verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      Text(
        text = paper.title,
        style = MaterialTheme.typography.titleMedium
      )
      val details = listOfNotNull(
        paper.publishedYear?.toString(),
        paper.venue,
        paper.pdfPath?.let { "PDF" }
      )
      if (details.isNotEmpty()) {
        Text(
          text = details.joinToString(" · "),
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
    }
  }
}
