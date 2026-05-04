package com.github.kavos113.tnet.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.github.kavos113.tnet.ui.theme.TnetBorder
import com.github.kavos113.tnet.ui.theme.TnetPrimary
import com.github.kavos113.tnet.ui.theme.TnetPrimaryHover
import com.github.kavos113.tnet.ui.theme.TnetSurface
import com.github.kavos113.tnet.ui.theme.TnetSurfaceHover
import com.github.kavos113.tnet.ui.theme.TnetSurfaceMuted
import com.github.kavos113.tnet.ui.theme.TnetText
import com.github.kavos113.tnet.ui.theme.TnetTextInverse
import com.github.kavos113.tnet.ui.theme.TnetTextMuted
import com.github.kavos113.tnet.ui.theme.TnetTheme

val TnetRadiusSmall = 4.dp
val TnetRadiusMedium = 6.dp
val TnetSpace1 = 4.dp
val TnetSpace2 = 8.dp
val TnetSpace3 = 12.dp
val TnetSpace4 = 16.dp
val TnetControlHeightSmall = 28.dp
val TnetControlHeightMedium = 36.dp

@Composable
fun TnetPanel(
  modifier: Modifier = Modifier,
  background: Color = TnetSurface,
  content: @Composable () -> Unit
) {
  Surface(
    modifier = modifier
      .fillMaxWidth()
      .border(
        BorderStroke(1.dp, TnetBorder),
        RoundedCornerShape(TnetRadiusMedium)
      ),
    color = background,
    shape = RoundedCornerShape(TnetRadiusMedium),
    tonalElevation = 0.dp,
    shadowElevation = 0.dp
  ) {
    Box(modifier = Modifier.padding(TnetSpace3)) {
      content()
    }
  }
}

@Composable
fun TnetListRow(
  modifier: Modifier = Modifier,
  selected: Boolean = false,
  onClick: (() -> Unit)? = null,
  content: @Composable () -> Unit
) {
  val background = if (selected) TnetSurfaceHover else TnetSurface
  val rowModifier = modifier
    .fillMaxWidth()
    .background(background)
    .border(BorderStroke(0.5.dp, TnetBorder))
    .padding(horizontal = 10.dp, vertical = 8.dp)

  if (onClick == null) {
    Box(modifier = rowModifier) {
      content()
    }
  } else {
    Surface(
      modifier = modifier.fillMaxWidth(),
      onClick = onClick,
      color = background,
      tonalElevation = 0.dp,
      shadowElevation = 0.dp,
      interactionSource = remember { MutableInteractionSource() }
    ) {
      Box(
        modifier = Modifier
          .border(BorderStroke(0.5.dp, TnetBorder))
          .padding(horizontal = 10.dp, vertical = 8.dp)
      ) {
        content()
      }
    }
  }
}

@Composable
fun TnetPrimaryButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  Button(
    onClick = onClick,
    modifier = modifier
      .defaultMinSize(minHeight = TnetControlHeightSmall)
      .heightIn(min = TnetControlHeightSmall),
    shape = RoundedCornerShape(TnetRadiusSmall),
    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
    colors = ButtonDefaults.buttonColors(
      containerColor = TnetPrimary,
      contentColor = TnetTextInverse
    )
  ) {
    Text(text = text, style = MaterialTheme.typography.labelMedium)
  }
}

@Composable
fun TnetSecondaryButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  selected: Boolean = false
) {
  TextButton(
    onClick = onClick,
    modifier = modifier
      .defaultMinSize(minHeight = TnetControlHeightSmall)
      .heightIn(min = TnetControlHeightSmall),
    shape = RoundedCornerShape(TnetRadiusSmall),
    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
    colors = ButtonDefaults.textButtonColors(
      containerColor = if (selected) TnetSurfaceHover else Color.Transparent,
      contentColor = if (selected) TnetText else TnetTextMuted
    )
  ) {
    Text(text = text, style = MaterialTheme.typography.labelMedium)
  }
}

@Composable
fun TnetCompactTextField(
  value: String,
  onValueChange: (String) -> Unit,
  label: String,
  modifier: Modifier = Modifier,
  singleLine: Boolean = true,
  minLines: Int = 1
) {
  OutlinedTextField(
    value = value,
    onValueChange = onValueChange,
    modifier = modifier.defaultMinSize(minHeight = TnetControlHeightMedium),
    singleLine = singleLine,
    minLines = minLines,
    label = { Text(label, style = MaterialTheme.typography.bodySmall) },
    textStyle = MaterialTheme.typography.bodyMedium,
    shape = RoundedCornerShape(TnetRadiusSmall),
    colors = OutlinedTextFieldDefaults.colors(
      focusedBorderColor = TnetPrimaryHover,
      unfocusedBorderColor = TnetBorder,
      focusedContainerColor = TnetSurface,
      unfocusedContainerColor = TnetSurface,
      cursorColor = TnetPrimary,
      focusedTextColor = TnetText,
      unfocusedTextColor = TnetText,
      focusedLabelColor = TnetPrimaryHover,
      unfocusedLabelColor = TnetTextMuted
    )
  )
}

@Composable
fun TnetSectionHeader(
  text: String,
  modifier: Modifier = Modifier
) {
  Text(
    text = text,
    modifier = modifier,
    style = MaterialTheme.typography.labelSmall,
    color = TnetTextMuted
  )
}

@Composable
fun TnetStateMessage(
  title: String,
  modifier: Modifier = Modifier,
  detail: String? = null,
  isError: Boolean = false
) {
  TnetPanel(
    modifier = modifier,
    background = if (isError) MaterialTheme.colorScheme.errorContainer else TnetSurfaceMuted
  ) {
    Text(
      text = if (detail == null) title else "$title\n$detail",
      style = MaterialTheme.typography.bodyMedium,
      color = if (isError) MaterialTheme.colorScheme.onErrorContainer else TnetTextMuted
    )
  }
}

@Preview(showBackground = true)
@Composable
private fun TnetStateMessagePreview() {
  TnetTheme {
    TnetStateMessage(
      title = "No document selected",
      detail = "Choose a read-only file to preview it here."
    )
  }
}
