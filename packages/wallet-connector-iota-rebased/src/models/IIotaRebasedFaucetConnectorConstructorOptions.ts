// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedFaucetConnectorConfig } from "./IIotaRebasedFaucetConnectorConfig";

/**
 * Options for the IOTA Rebased Faucet Connector constructor.
 */
export interface IIotaRebasedFaucetConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IIotaRebasedFaucetConnectorConfig;

	/**
	 * Vault connector to use for faucet secrets.
	 */
	vaultConnectorType?: string;
}
