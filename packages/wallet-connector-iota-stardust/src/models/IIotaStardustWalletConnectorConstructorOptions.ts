// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustWalletConnectorConfig } from "./IIotaStardustWalletConnectorConfig";

/**
 * Options for the IOTA Stardust Wallet Connector.
 */
export interface IIotaStardustWalletConnectorConstructorOptions {
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
	config: IIotaStardustWalletConnectorConfig;
}
