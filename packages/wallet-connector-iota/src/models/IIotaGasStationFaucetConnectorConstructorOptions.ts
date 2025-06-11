// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaGasStationFaucetConnectorConfig } from "./IIotaGasStationFaucetConnectorConfig";

/**
 * Options for the IOTA Gas Station Faucet Connector constructor.
 */
export interface IIotaGasStationFaucetConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IIotaGasStationFaucetConnectorConfig;

	/**
	 * Vault connector to use for identity keys.
	 */
	vaultConnectorType?: string;
}
