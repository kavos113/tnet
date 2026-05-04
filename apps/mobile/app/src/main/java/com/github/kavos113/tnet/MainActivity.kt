package com.github.kavos113.tnet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.github.kavos113.tnet.ui.TnetMobileApp
import com.github.kavos113.tnet.ui.theme.TnetTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      TnetTheme {
        TnetMobileApp()
      }
    }
  }
}
