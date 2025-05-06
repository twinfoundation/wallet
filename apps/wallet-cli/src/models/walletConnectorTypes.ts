// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The wallet connector types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const WalletConnectorTypes = {
	/**
	 * IOTA.
	 */
	Iota: "iota"
} as const;

/**
 * The wallet connector types.
 */
export type WalletConnectorTypes = (typeof WalletConnectorTypes)[keyof typeof WalletConnectorTypes];
