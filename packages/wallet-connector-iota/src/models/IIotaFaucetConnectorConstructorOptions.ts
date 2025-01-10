// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaFaucetConnectorConfig } from "./IIotaFaucetConnectorConfig";

/**
 * Options for the IOTA faucet connector.
 */
export interface IIotaFaucetConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaFaucetConnectorConfig;
}
