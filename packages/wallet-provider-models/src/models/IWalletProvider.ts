// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing a wallet provider.
 */
export interface IWalletProvider extends IService {
	/**
	 * Get the balance for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	getBalance(requestContext: IRequestContext, address: string): Promise<bigint>;

	/**
	 * Get the storage costs for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The storage costs for the address.
	 */
	getStorageCosts(requestContext: IRequestContext, address: string): Promise<bigint>;

	/**
	 * Ensure the balance for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @param balance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	ensureBalance(
		requestContext: IRequestContext,
		address: string,
		balance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean>;

	/**
	 * Transfer funds to an address.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns The block created.
	 */
	transfer(requestContext: IRequestContext, address: string, amount: bigint): Promise<string>;
}
