// android/app/java/com/nucashmobile/MainActivity.kt
package com.nucashmobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle // Add this

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "NUCashMobile"

  // Add this method
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}