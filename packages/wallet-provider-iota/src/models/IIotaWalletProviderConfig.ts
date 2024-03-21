// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IClientOptions, SecretManagerType } from "@iota/sdk-wasm/node";

/**
 * Configuration for the IOTA Wallet Provider.
 */
export interface IIotaWalletProviderConfig {
	/**
	 * The configuration for the client.
	 */
	clientOptions: IClientOptions;

	/**
	 * The secret manager to use for proving ownership when signing transactions.
	 */
	secretManager: SecretManagerType;
}
