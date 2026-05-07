package com.piedpiper.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Live UBI pool widget for Pied Piper. Renders three lines:
 *   PIED PIPER UBI                 (label, dim)
 *   1.2345 SOL                     (UbiPool.total_lamports — accent)
 *   42 verified humans             (UbiPool.verified_count — secondary)
 *
 * Updates every 30 minutes via the system AppWidget update cycle (defined in
 * res/xml/piedpiper_widget_info.xml). The fetch + decode runs on Dispatchers.IO.
 */
class PiedPiperWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = withContext(Dispatchers.IO) { UbiPoolFetcher.fetch() }
        provideContent { Content(snapshot) }
    }

    @Composable
    private fun Content(snapshot: UbiPoolSnapshot) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(Color(0xFF0E0E10)))
                .cornerRadius(20.dp)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "ROBINHOODIE UBI",
                style = TextStyle(
                    color = ColorProvider(Color(0xFF888888)),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                ),
            )
            Spacer(modifier = GlanceModifier.height(6.dp))
            Text(
                text = formatSol(snapshot.totalSol) + " SKR",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFC8A8FF)),
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
            Spacer(modifier = GlanceModifier.height(6.dp))
            Text(
                text = "${snapshot.verifiedCount} verified human" + if (snapshot.verifiedCount == 1L) "" else "s",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFAAAAAA)),
                    fontSize = 13.sp,
                ),
            )
        }
    }

    private fun formatSol(value: Double): String =
        if (value >= 1.0) String.format("%.4f", value) else String.format("%.6f", value)
}
