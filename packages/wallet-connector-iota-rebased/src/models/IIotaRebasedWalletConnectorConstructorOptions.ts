// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedWalletConnectorConfig } from "./IIotaRebasedWalletConnectorConfig";

/**
 * Options for the IOTA Rebased Wallet connector.
 */
export interface IIotaRebasedWalletConnectorConstructorOptions {
	/**
	 * Optional vault connector to use for wallet secrets.
	 */
	vaultConnectorType?: string;

	/**
	 * Optional faucet connector for requesting funds.
	 */
	faucetConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaRebasedWalletConnectorConfig;
}
