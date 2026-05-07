import { useCallback, useState } from "react";

import { PrimaryButton } from "../primitives/PrimaryButton";
import { GhostButton } from "../primitives/GhostButton";
import { alertAndLog } from "../../utils/alertAndLog";
import { useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";

export function ConnectButton() {
  useAuthorization();
  const { connect } = useMobileWallet();
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await connect();
    } catch (err: unknown) {
      alertAndLog(
        "Error during connect",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  }, [busy, connect]);

  return (
    <PrimaryButton
      label="Connect wallet"
      onPress={onPress}
      loading={busy}
      disabled={busy}
    />
  );
}

export function SignInButton() {
  useAuthorization();
  const { signIn } = useMobileWallet();
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn({
        domain: "piedpiper.app",
        statement: "Sign in to RobinHoodie",
        uri: "https://piedpiper.app",
      });
    } catch (err: unknown) {
      alertAndLog(
        "Error during sign in",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  }, [busy, signIn]);

  return (
    <GhostButton
      label="Sign in"
      onPress={onPress}
      loading={busy}
      disabled={busy}
    />
  );
}
