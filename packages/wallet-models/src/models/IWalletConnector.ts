// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { KeyType } from "@gtsc/crypto";
import type { IRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing a wallet connector.
 */
export interface IWalletConnector extends IService {
	/**
	 * Create a new wallet.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	create(requestContext: IRequestContext): Promise<void>;

	/**
	 * Get the addresses for the requested range.
	 * @param requestContext The context for the request.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The end index for the addresses.
	 * @returns The list of addresses.
	 */
	getAddresses(
		requestContext: IRequestContext,
		startAddressIndex: number,
		count: number
	): Promise<string[]>;

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
	 * @param ensureBalance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	ensureBalance(
		requestContext: IRequestContext,
		address: string,
		ensureBalance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean>;

	/**
	 * Transfer funds to an address.
	 * @param requestContext The context for the request.
	 * @param addressSource The bech32 encoded address to send the funds from.
	 * @param addressDest The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns An identifier for the transfer if there was one.
	 */
	transfer(
		requestContext: IRequestContext,
		addressSource: string,
		addressDest: string,
		amount: bigint
	): Promise<string | undefined>;

	/**
	 * Sign data using a wallet based key.
	 * @param requestContext The context for the request.
	 * @param signatureType The type of signature to create.
	 * @param addressIndex The index for the address.
	 * @param data The data bytes.
	 * @returns The signature and public key bytes.
	 */
	sign(
		requestContext: IRequestContext,
		signatureType: KeyType,
		addressIndex: number,
		data: Uint8Array
	): Promise<{
		publicKey: Uint8Array;
		signature: Uint8Array;
	}>;
}
