package com.piedpiper.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Lets RN ask the home-screen widget to refresh immediately, instead of
 * waiting for the system's 30-min update window. We fire APPWIDGET_UPDATE
 * directly at our receiver with the IDs of every active widget instance.
 */
class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun refresh(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val mgr = AppWidgetManager.getInstance(ctx)
            val component = ComponentName(ctx, PiedPiperWidgetReceiver::class.java)
            val ids = mgr.getAppWidgetIds(component)
            val intent = Intent(ctx, PiedPiperWidgetReceiver::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            ctx.sendBroadcast(intent)
            promise.resolve(ids.size)
        } catch (e: Exception) {
            promise.reject("WIDGET_REFRESH_FAILED", e.message, e)
        }
    }
}
