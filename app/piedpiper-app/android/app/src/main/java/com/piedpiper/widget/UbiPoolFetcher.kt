package com.piedpiper.widget

import android.util.Base64
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.TimeUnit

/**
 * Snapshot of the on-chain UbiPool. Mirrors the Anchor account layout in
 * `programs/prediction_market/src/lib.rs#UbiPool` exactly.
 *
 *   [0..8)    discriminator
 *   [8..40)   admin            : Pubkey
 *   [40..72)  sgt_mint         : Pubkey
 *   [72..80)  total_lamports   : u64 LE
 *   [80..88)  verified_count   : u64 LE
 *   [88..96)  current_epoch    : u64 LE
 *   [96..104) epoch_start      : i64 LE
 *   [104..112) per_epoch_lamports : u64 LE
 *   [112..120) epoch_seconds   : i64 LE
 *   [120..121) bump            : u8
 */
data class UbiPoolSnapshot(
    val totalLamports: Long,
    val verifiedCount: Long,
    val perEpochLamports: Long,
    val currentEpoch: Long,
    val epochStart: Long,
    val epochSeconds: Long,
) {
    val totalSol: Double get() = totalLamports / 1_000_000_000.0
    val perEpochSol: Double get() = perEpochLamports / 1_000_000_000.0
    val nextEpochAt: Long get() = (currentEpoch + 1) * epochSeconds

    companion object {
        fun empty() = UbiPoolSnapshot(0L, 0L, 0L, 0L, 0L, 86_400L)
    }
}

object UbiPoolFetcher {
    // Widget reads directly from devnet — no RN bridge involvement.
    private const val UBI_POOL_PUBKEY = "2A36A6Vujy6G9AzUwFp3eg9vfSTWWxYWrsUgtBmYDiLS"
    private const val DEVNET_RPC = "https://api.devnet.solana.com"

    private val client by lazy {
        OkHttpClient.Builder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .build()
    }
    private val jsonMediaType = "application/json".toMediaType()

    /** Fetches + decodes the UbiPool snapshot. Returns `empty()` on any error. */
    fun fetch(): UbiPoolSnapshot {
        return try {
            val body = """{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["$UBI_POOL_PUBKEY",{"encoding":"base64","commitment":"confirmed"}]}"""
                .toRequestBody(jsonMediaType)

            val req = Request.Builder().url(DEVNET_RPC).post(body).build()

            client.newCall(req).execute().use { res ->
                if (!res.isSuccessful) return UbiPoolSnapshot.empty()
                val json = JSONObject(res.body?.string() ?: "{}")
                val value = json.optJSONObject("result")?.optJSONObject("value")
                    ?: return UbiPoolSnapshot.empty()
                val data = value.getJSONArray("data").getString(0)
                val bytes = Base64.decode(data, Base64.DEFAULT)
                if (bytes.size < 121) return UbiPoolSnapshot.empty()
                decode(bytes)
            }
        } catch (e: Exception) {
            UbiPoolSnapshot.empty()
        }
    }

    private fun decode(bytes: ByteArray): UbiPoolSnapshot {
        val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
        return UbiPoolSnapshot(
            totalLamports = buf.getLong(72),
            verifiedCount = buf.getLong(80),
            currentEpoch = buf.getLong(88),
            epochStart = buf.getLong(96),
            perEpochLamports = buf.getLong(104),
            epochSeconds = buf.getLong(112),
        )
    }
}
