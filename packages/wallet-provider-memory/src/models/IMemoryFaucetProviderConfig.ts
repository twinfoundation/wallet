// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Memory Faucet Provider.
 */
export interface IMemoryFaucetProviderConfig {
	/**
	 * The initial balance for the faucet stored as bigint.
	 */
	initialBalance: string;
}
