// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IClientOptions } from "@iota/sdk-wasm/node/lib/index.js";

/**
 * Configuration for the IOTA Wallet Connector.
 */
export interface IIotaWalletConnectorConfig {
	/**
	 * The configuration for the client.
	 */
	clientOptions: IClientOptions;

	/**
	 * The id of the entry in the vault containing the wallet mnemonic.
	 */
	walletMnemonicId?: string;

	/**
	 * The coin type.
	 * @default IOTA 4218
	 */
	coinType?: number;

	/**
	 * The bech32 human readable part for the addresses.
	 * @default iota
	 */
	bech32Hrp?: string;
}
