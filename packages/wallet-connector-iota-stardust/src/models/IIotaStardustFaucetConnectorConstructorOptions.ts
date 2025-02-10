// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustFaucetConnectorConfig } from "./IIotaStardustFaucetConnectorConfig";

/**
 * Options for the IOTA Stardust faucet connector.
 */
export interface IIotaStardustFaucetConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaStardustFaucetConnectorConfig;
}
