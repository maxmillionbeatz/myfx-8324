import { useEffect, useRef } from "react";
import { useAccount } from "@orderly.network/hooks";

/**
 * Monkey-patches three account methods that the upstream @orderly.network/trading
 * and @orderly.network/ui-transfer packages call incorrectly when the active
 * account is a sub-account.
 *
 * Bug 1 — account.settle()
 *   trading/index.mjs calls account.settle() unconditionally even though
 *   isMainAccount is available. settle() hits /v1/settle_pnl (needs wallet
 *   signature) while sub-accounts must use /v1/sub_account_settle_pnl.
 *   Fix: redirect to account.settleSubAccount() when isSubAccount.
 *
 * Bug 2 — assetsManager.internalTransfer()
 *   ui-transfer's useWithdrawAccountId (the "withdraw to account ID" flow)
 *   uses useInternalTransfer() which calls assetsManager.internalTransfer().
 *   That path uses EIP-712 wallet signing with orderly-account-id=subAccountId,
 *   which the API rejects. The correct sub-account path is orderly key signing
 *   against /v1/internal_transfer with a receiver_list payload.
 *   Fix: when isSubAccount, bypass wallet signing and use orderly key signing.
 *
 * Bug 3 — assetsManager.withdraw()
 *   Sub-accounts have no on-chain withdrawal endpoint. Calling withdraw() from
 *   a sub-account sends orderly-account-id=subAccountId to /v1/withdraw_request,
 *   which the API rejects. Users must transfer funds to the main account first.
 *   Fix: reject immediately with a clear message when isSubAccount.
 */
export function SettleSubAccountPatch() {
	const { account, isSubAccount } = useAccount();

	// Ref so patched closures always see the latest value without reinstalling.
	const isSubAccountRef = useRef(isSubAccount);
	useEffect(() => {
		isSubAccountRef.current = isSubAccount;
	}, [isSubAccount]);

	useEffect(() => {
		if (!account) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const acc = account as any;
		const am = acc.assetsManager;

		// ── Bug 1: settle ────────────────────────────────────────────────────
		const originalSettle = acc.settle.bind(acc);
		acc.settle = (options?: unknown) => {
			if (isSubAccountRef.current) {
				// settleSubAccount falls back to this.stateValue.accountId when
				// no subAccountId option is provided.
				return acc.settleSubAccount();
			}
			return originalSettle(options);
		};

		// ── Bug 2: internalTransfer ──────────────────────────────────────────
		const originalInternalTransfer = am.internalTransfer.bind(am);
		am.internalTransfer = async (inputs: {
			token: string;
			amount: string | number;
			receiver: string;
			decimals?: number;
		}) => {
			if (!isSubAccountRef.current) {
				return originalInternalTransfer(inputs);
			}
			// Sub-account path: orderly key signing (same as useSubAccountMutation).
			// amount is human-readable (e.g. "100.5"), matching the receiver_list
			// format expected by the orderly key-signed endpoint.
			const subAccountId: string = acc.stateValue.accountId;
			const url = "/v1/internal_transfer";
			const data = {
				token: inputs.token,
				receiver_list: [
					{
						account_id: inputs.receiver,
						amount: Number(inputs.amount),
					},
				],
			};
			const signature = await acc.signData(url, data);
			const res = await acc._simpleFetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
					"orderly-account-id": subAccountId,
					...signature,
				},
			});
			if (res.success) return res;
			throw res;
		};

		// ── Bug 3: withdraw ──────────────────────────────────────────────────
		const originalWithdraw = am.withdraw.bind(am);
		am.withdraw = (inputs: unknown) => {
			if (isSubAccountRef.current) {
				return Promise.reject(
					new Error(
						"Sub-accounts cannot withdraw directly. " +
						"Transfer funds to your main account first, then withdraw from there."
					)
				);
			}
			return originalWithdraw(inputs);
		};

		return () => {
			acc.settle = originalSettle;
			am.internalTransfer = originalInternalTransfer;
			am.withdraw = originalWithdraw;
		};
	}, [account]);

	return null;
}
