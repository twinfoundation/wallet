// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IService } from "@gtsc/services";

/**
 * Interface describing an identify provider.
 */
export interface IWalletProvider extends IService {
	/**
	 * Get the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The created document.
	 */
	getBalance(address: string): Promise<bigint>;
}
