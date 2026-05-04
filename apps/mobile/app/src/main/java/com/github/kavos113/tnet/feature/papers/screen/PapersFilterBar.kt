package com.github.kavos113.tnet.feature.papers.screen

import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.feature.papers.model.PapersWorkspaceValidation
import com.github.kavos113.tnet.ui.components.TnetPanel
import com.github.kavos113.tnet.ui.components.TnetRadiusSmall
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace1
import com.github.kavos113.tnet.ui.components.TnetSpace2
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PapersFilterBar(
  uiState: PapersUiState,
  onSearchQueryChange: (String) -> Unit,
  onDirectoryFilterChange: (String) -> Unit,
  onSortModeChange: (PapersSortMode) -> Unit
) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.spacedBy(TnetSpace1),
    verticalAlignment = Alignment.CenterVertically
  ) {
    PapersSearchField(
      value = uiState.searchQuery,
      onValueChange = onSearchQueryChange,
      modifier = Modifier.weight(1f)
    )
    PapersSortMode.entries.forEach { mode ->
      TnetSecondaryButton(
        text = mode.name,
        onClick = { onSortModeChange(mode) },
        selected = uiState.sortMode == mode
      )
    }
  }
}

@Composable
private fun PapersSearchField(
  value: String,
  onValueChange: (String) -> Unit,
  modifier: Modifier = Modifier
) {
  BasicTextField(
    value = value,
    onValueChange = onValueChange,
    modifier = modifier
      .height(30.dp)
      .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(TnetRadiusSmall))
      .border(BorderStroke(1.dp, TnetBorder), RoundedCornerShape(TnetRadiusSmall))
      .padding(horizontal = 8.dp, vertical = 4.dp),
    singleLine = true,
    textStyle = MaterialTheme.typography.bodySmall.copy(color = TnetText),
    cursorBrush = SolidColor(TnetPrimary),
    decorationBox = { innerTextField ->
      Box(contentAlignment = Alignment.CenterStart) {
        if (value.isEmpty()) {
          Text(text = "Search papers", style = MaterialTheme.typography.bodySmall, color = TnetTextMuted)
        }
        innerTextField()
      }
    }
  )
}

@Composable
internal fun PapersWorkspaceStatus(
  workspaceUri: String?,
  databaseUri: String?,
  isSqliteOnlyMode: Boolean,
  validation: PapersWorkspaceValidation?
) {
  TnetPanel {
    Column(
      verticalArrangement = Arrangement.spacedBy(TnetSpace2)
    ) {
      Text(
        text = "Workspace",
        style = MaterialTheme.typography.titleMedium
      )
      Text(
        text = workspaceUri
          ?: databaseUri
          ?: "Select a Papers workspace or SQLite file in Settings.",
        style = MaterialTheme.typography.bodyMedium,
        color = TnetTextMuted
      )
      val status = when (validation) {
        null -> when {
          isSqliteOnlyMode -> "SQLite-only mode: metadata is available, workspace PDFs are unavailable."
          workspaceUri == null -> "Not configured"
          else -> "Checking workspace..."
        }
        is PapersWorkspaceValidation.Valid -> "Ready: ${validation.databaseUri}"
        is PapersWorkspaceValidation.Invalid -> validation.reason
      }
      val statusColor = when (validation) {
        is PapersWorkspaceValidation.Valid -> TnetPrimary
        is PapersWorkspaceValidation.Invalid -> MaterialTheme.colorScheme.error
        null -> TnetTextMuted
      }
      Text(
        text = status,
        style = MaterialTheme.typography.bodyMedium,
        color = statusColor
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PapersFilterBarPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PapersFilterBar(
        uiState = PapersUiState(searchQuery = "transformer", sortMode = PapersSortMode.Year),
        onSearchQueryChange = {},
        onDirectoryFilterChange = {},
        onSortModeChange = {}
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PapersWorkspaceStatusPreview() {
  TnetTheme {
    Surface(modifier = Modifier.padding(16.dp)) {
      PapersWorkspaceStatus(
        workspaceUri = "content://workspace/root",
        databaseUri = null,
        isSqliteOnlyMode = false,
        validation = PapersWorkspaceValidation.Valid(
          databaseUri = Uri.parse("content://workspace/root/.tnet/papers/papers.db")
        )
      )
    }
  }
}
