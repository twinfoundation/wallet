// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@twin.org/dlt-iota";

/**
 * Configuration for the IOTA Faucet Connector.
 */
export interface IIotaFaucetConnectorConfig extends IIotaConfig {
	/**
	 * The faucet endpoint URL.
	 */
	endpoint: string;
}
