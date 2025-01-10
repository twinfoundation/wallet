// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClientOptions } from "@iota/iota-sdk/client";
import type { IIotaRebasedConfig } from "@twin.org/dlt-iota-rebased";

/**
 * Configuration for the IOTA Rebased Wallet Connector.
 */
export interface IIotaRebasedWalletConnectorConfig extends IIotaRebasedConfig {
	/**
	 * The client options for connecting to the IOTA Rebased network.
	 */
	clientOptions: IotaClientOptions;

	/**
	 * The vault mnemonic identifier.
	 */
	vaultMnemonicId: string;

	/**
	 * The coin type for the wallet (e.g., 4218 for IOTA).
	 */
	coinType: number;
}
