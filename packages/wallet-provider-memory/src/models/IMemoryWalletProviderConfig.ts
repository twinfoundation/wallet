// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Memory Wallet Provider.
 */
export interface IMemoryWalletProviderConfig {
	/**
	 * The id of the entry in the vault containing the wallet mnemonic.
	 */
	walletMnemonicId: string;

	/**
	 * The coin type to use for memory wallet.
	 */
	coinType: number;

	/**
	 * The string to use for memory wallet.
	 */
	bech32Hrp: string;

	/**
	 * The balance on the address stored as bigints.
	 */
	balance?: string;
}
