import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import { Buffer } from "buffer";

global.Buffer = Buffer;

// getRandomValues polyfill
class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();

// Hermes (Android RN engine) doesn't ship `structuredClone` yet. Anchor and
// some web3 utilities call it on Borsh-decoded objects, so we provide a
// JSON-clone fallback. It's lossy for Map/Set/Date, but our payloads here are
// plain Borsh structs (Pubkey + BN + numbers) so this is safe.
if (typeof (globalThis as any).structuredClone !== "function") {
  (globalThis as any).structuredClone = (val: unknown) =>
    val === undefined ? undefined : JSON.parse(JSON.stringify(val));
}
