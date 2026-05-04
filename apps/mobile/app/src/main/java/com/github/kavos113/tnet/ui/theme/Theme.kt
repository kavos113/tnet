package com.github.kavos113.tnet.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val TnetLightColorScheme = lightColorScheme(
  primary = TnetPrimary,
  onPrimary = TnetTextInverse,
  primaryContainer = TnetPrimaryMuted,
  onPrimaryContainer = TnetText,
  secondary = TnetTextMuted,
  onSecondary = TnetTextInverse,
  secondaryContainer = TnetSurfaceMuted,
  onSecondaryContainer = TnetText,
  tertiary = TnetFolder,
  onTertiary = TnetText,
  background = TnetSurface,
  onBackground = TnetText,
  surface = TnetSurface,
  onSurface = TnetText,
  surfaceVariant = TnetSurfaceMuted,
  onSurfaceVariant = TnetTextMuted,
  surfaceContainer = TnetSurface,
  surfaceContainerLow = TnetSurface,
  surfaceContainerHigh = TnetSurfaceMuted,
  outline = TnetBorder,
  outlineVariant = TnetBorder,
  error = TnetDanger,
  onError = TnetTextInverse,
  errorContainer = Color(0xFFFFF1F0),
  onErrorContainer = TnetDanger
)

private val TnetShapes = Shapes(
  extraSmall = RoundedCornerShape(4.dp),
  small = RoundedCornerShape(4.dp),
  medium = RoundedCornerShape(6.dp),
  large = RoundedCornerShape(6.dp),
  extraLarge = RoundedCornerShape(8.dp)
)

@Composable
fun TnetTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit
) {
  MaterialTheme(
    colorScheme = TnetLightColorScheme,
    typography = Typography,
    shapes = TnetShapes,
    content = content
  )
}
