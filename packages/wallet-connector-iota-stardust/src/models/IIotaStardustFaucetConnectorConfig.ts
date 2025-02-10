// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustConfig } from "@twin.org/dlt-iota-stardust";

/**
 * Configuration for the IOTA Stardust Faucet Connector.
 */
export interface IIotaStardustFaucetConnectorConfig extends IIotaStardustConfig {
	/**
	 * The endpoint for the faucet.
	 */
	endpoint: string;
}
