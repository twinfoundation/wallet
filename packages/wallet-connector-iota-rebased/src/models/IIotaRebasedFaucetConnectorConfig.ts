// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedConfig } from "@twin.org/dlt-iota-rebased";

/**
 * Configuration for the IOTA Rebased Faucet Connector.
 */
export interface IIotaRebasedFaucetConnectorConfig extends IIotaRebasedConfig {
	/**
	 * The faucet endpoint URL.
	 */
	endpoint: string;
}
