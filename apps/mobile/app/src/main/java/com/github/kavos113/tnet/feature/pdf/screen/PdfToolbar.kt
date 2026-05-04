package com.github.kavos113.tnet.feature.pdf.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.ui.components.TnetSecondaryButton
import com.github.kavos113.tnet.ui.components.TnetSpace3
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

@Composable
internal fun PdfToolbar(
  uiState: PdfUiState,
  onPreviousPage: () -> Unit,
  onNextPage: () -> Unit,
  onZoomOut: () -> Unit,
  onZoomIn: () -> Unit,
  onRotate: () -> Unit,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier.fillMaxWidth(),
    verticalArrangement = Arrangement.spacedBy(TnetSpace3)
  ) {
    Text(
      text = "Page ${uiState.pageIndex + 1} / ${uiState.pageCount}  Zoom ${(uiState.zoom * 100).toInt()}%  Rotate ${uiState.rotation}deg",
      style = MaterialTheme.typography.bodySmall,
      color = TnetTextMuted
    )
    Row(horizontalArrangement = Arrangement.spacedBy(TnetSpace3)) {
      TnetSecondaryButton(
        text = "Prev",
        onClick = onPreviousPage,
        modifier = Modifier.widthIn(min = 64.dp)
      )
      TnetSecondaryButton(
        text = "Next",
        onClick = onNextPage,
        modifier = Modifier.widthIn(min = 64.dp)
      )
      TnetSecondaryButton(text = "-", onClick = onZoomOut)
      TnetSecondaryButton(text = "+", onClick = onZoomIn)
      TnetSecondaryButton(text = "Rotate", onClick = onRotate)
    }
  }
}

@Preview(showBackground = true)
@Composable
private fun PdfToolbarPreview() {
  TnetTheme {
    PdfToolbar(
      uiState = PdfUiState(pageIndex = 2, pageCount = 12, zoom = 1.25f, rotation = 90),
      onPreviousPage = {},
      onNextPage = {},
      onZoomOut = {},
      onZoomIn = {},
      onRotate = {}
    )
  }
}
