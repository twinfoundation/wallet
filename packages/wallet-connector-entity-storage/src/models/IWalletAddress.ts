// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface describing a wallet address.
 */
export interface IWalletAddress {
	/**
	 * The address of the wallet.
	 */
	address: string;

	/**
	 * The identity of the owner.
	 */
	identity: string;

	/**
	 * The balance of the wallet as bigint.
	 */
	balance: string;
}
