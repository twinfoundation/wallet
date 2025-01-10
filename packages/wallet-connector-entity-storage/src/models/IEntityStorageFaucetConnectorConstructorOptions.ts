// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Options for the entity storage faucet connector.
 */
export interface IEntityStorageFaucetConnectorConstructorOptions {
	/**
	 * The entity storage type for wallet addresses.
	 * @default wallet-address
	 */
	walletAddressEntityStorageType?: string;
}
