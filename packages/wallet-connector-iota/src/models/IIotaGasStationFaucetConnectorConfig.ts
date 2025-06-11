// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@twin.org/dlt-iota";

/**
 * Configuration for the IOTA Gas Station Faucet Connector.
 */
export interface IIotaGasStationFaucetConnectorConfig extends IIotaConfig {
	/**
	 * The gas station service URL.
	 */
	gasStationUrl: string;

	/**
	 * The authentication token for the gas station API.
	 */
	gasStationAuthToken: string;

	/**
	 * The package ID for the identity contract on the network.
	 * If not provided, a default value will be used based on the detected network type.
	 */
	identityPkgId?: string;

	/**
	 * The gas budget for transactions.
	 * @default 50000000
	 */
	gasBudget?: number;

	/**
	 * The wallet address index to use for identity operations.
	 * @default 0
	 */
	walletAddressIndex?: number;
}
