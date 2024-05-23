// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Entity Storage Wallet Connector.
 */
export interface IEntityStorageWalletConnectorConfig {
	/**
	 * The id of the entry in the vault containing the wallet mnemonic.
	 */
	walletMnemonicId?: string;

	/**
	 * The coin type, defaults to 9999.
	 */
	coinType?: number;

	/**
	 * The bech32 human readable part for the addresses, defaults to ent.
	 */
	bech32Hrp?: string;
}
