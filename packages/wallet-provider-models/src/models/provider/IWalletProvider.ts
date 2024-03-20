// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IService } from "@gtsc/services";

/**
 * Interface describing a wallet provider.
 */
export interface IWalletProvider extends IService {
	/**
	 * Get the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	getBalance(address: string): Promise<bigint>;

	/**
	 * Get the storage costs for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The storage costs for the address.
	 */
	getStorageCosts(address: string): Promise<bigint>;

	/**
	 * Ensure the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @param balance The balance to ensure on the address.
	 * @returns True if the balance has been ensured.
	 */
	ensureBalance(address: string, balance: bigint): Promise<boolean>;
}
