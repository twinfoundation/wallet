// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClientOptions } from "@iota/iota-sdk/client";

/**
 * Configuration for the IOTA Rebased Faucet Connector.
 */
export interface IIotaRebasedFaucetConnectorConfig {
	/**
	 * The client options for connecting to the IOTA Rebased network.
	 */
	clientOptions: IotaClientOptions;

	/**
	 * The faucet endpoint URL.
	 */
	endpoint: string;
}
