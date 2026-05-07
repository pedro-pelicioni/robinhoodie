package com.piedpiper.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Live UBI claim widget for RobinHoodie. Shows the per-epoch SKR share
 * the user can claim right now, plus a "Claim" button that launches the
 * main app (the actual on-chain claim_ubi tx requires a Seed Vault
 * biometric, which only the in-app MWA flow can collect).
 *
 * Claim math (mirrors `claim_ubi` in lib.rs):
 *   - When the current wall-clock epoch is past UbiPool.current_epoch,
 *     the next `claim_ubi` tx rolls the pool over and snapshots
 *     `per_epoch_lamports = total_lamports / max(verified_count, 1)`.
 *     We pre-compute that value off-chain so the widget shows the
 *     correct figure even before anyone has triggered the rollover.
 *   - Otherwise we use the already-snapshotted `per_epoch_lamports`.
 *
 * The widget process is independent of the RN runtime — it runs every
 * 30 minutes whether or not the app is open.
 */
class PiedPiperWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = withContext(Dispatchers.IO) { UbiPoolFetcher.fetch() }
        val claimable = computeClaimable(snapshot)
        provideContent { Content(context, snapshot, claimable) }
    }

    private fun computeClaimable(s: UbiPoolSnapshot): Long {
        if (s.epochSeconds <= 0) return s.perEpochLamports
        val nowEpoch = (System.currentTimeMillis() / 1000) / s.epochSeconds
        val count = if (s.verifiedCount > 0) s.verifiedCount else 1
        return if (nowEpoch > s.currentEpoch) s.totalLamports / count else s.perEpochLamports
    }

    @Composable
    private fun Content(context: Context, snapshot: UbiPoolSnapshot, claimableLamports: Long) {
        // Best-effort launch into the main app. Falls back to a no-op intent
        // if the package can't resolve (e.g. side-loaded variant on a phone
        // where the package id differs).
        val launchIntent = context.packageManager
            .getLaunchIntentForPackage("com.piedpiper.app")
            ?: context.packageManager.getLaunchIntentForPackage(context.packageName)

        val claimableSol = claimableLamports / 1_000_000_000.0
        val poolSol = snapshot.totalSol

        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(Color(0xFF15110D)))
                .cornerRadius(20.dp)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.Start,
        ) {
            Text(
                text = "ROBINHOODIE UBI",
                style = TextStyle(
                    color = ColorProvider(Color(0xFF85786A)),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
            Spacer(modifier = GlanceModifier.height(4.dp))
            Text(
                text = formatSol(claimableSol) + " SKR",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFE27726)),
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
            Text(
                text = if (claimableLamports > 0) "to claim this epoch" else "pool is building",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFB5A89A)),
                    fontSize = 11.sp,
                ),
            )
            Spacer(modifier = GlanceModifier.height(2.dp))
            Text(
                text = "${snapshot.verifiedCount} verified · pool ${formatSol(poolSol)} SKR",
                style = TextStyle(
                    color = ColorProvider(Color(0xFF85786A)),
                    fontSize = 10.sp,
                ),
            )
            Spacer(modifier = GlanceModifier.height(8.dp))

            val clickModifier = if (launchIntent != null) {
                GlanceModifier.clickable(actionStartActivity(launchIntent))
            } else {
                GlanceModifier
            }
            Box(
                modifier = clickModifier
                    .fillMaxWidth()
                    .background(ColorProvider(Color(0xFFE27726)))
                    .cornerRadius(10.dp)
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Claim",
                    style = TextStyle(
                        color = ColorProvider(Color(0xFF15110D)),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    ),
                )
            }
        }
    }

    private fun formatSol(value: Double): String =
        if (value >= 1.0) String.format("%.4f", value) else String.format("%.6f", value)
}
