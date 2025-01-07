// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaWalletConnectorConfig } from "./IIotaWalletConnectorConfig";

/**
 * Options for the IOTA Wallet Connector.
 */
export interface IIotaWalletConnectorConstructorOptions {
	/**
	 * Vault connector to use for wallet secrets.
	 * @default vault
	 */
	vaultConnectorType?: string;

	/**
	 * Optional faucet for requesting funds.
	 * @default faucet
	 */
	faucetConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaWalletConnectorConfig;
}
