// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { KeyType } from "@gtsc/crypto";
import type { IServiceRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing a wallet connector.
 */
export interface IWalletConnector extends IService {
	/**
	 * Create a new wallet.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	create(requestContext?: IServiceRequestContext): Promise<void>;

	/**
	 * Get the addresses for the requested range.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The end index for the addresses.
	 * @param requestContext The context for the request.
	 * @returns The list of addresses.
	 */
	getAddresses(
		startAddressIndex: number,
		count: number,
		requestContext?: IServiceRequestContext
	): Promise<string[]>;

	/**
	 * Get the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @param requestContext The context for the request.
	 * @returns The balance of the wallet address.
	 */
	getBalance(address: string, requestContext?: IServiceRequestContext): Promise<bigint>;

	/**
	 * Get the storage costs for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @param requestContext The context for the request.
	 * @returns The storage costs for the address.
	 */
	getStorageCosts(address: string, requestContext?: IServiceRequestContext): Promise<bigint>;

	/**
	 * Ensure the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @param ensureBalance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @param requestContext The context for the request.
	 * @returns True if the balance has been ensured.
	 */
	ensureBalance(
		address: string,
		ensureBalance: bigint,
		timeoutInSeconds?: number,
		requestContext?: IServiceRequestContext
	): Promise<boolean>;

	/**
	 * Transfer funds to an address.
	 * @param addressSource The bech32 encoded address to send the funds from.
	 * @param addressDest The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @param requestContext The context for the request.
	 * @returns An identifier for the transfer if there was one.
	 */
	transfer(
		addressSource: string,
		addressDest: string,
		amount: bigint,
		requestContext?: IServiceRequestContext
	): Promise<string | undefined>;

	/**
	 * Sign data using a wallet based key.
	 * @param signatureType The type of signature to create.
	 * @param addressIndex The index for the address.
	 * @param data The data bytes.,
	 * @param requestContext The context for the request.
	 * @returns The signature and public key bytes.
	 */
	sign(
		signatureType: KeyType,
		addressIndex: number,
		data: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<{
		publicKey: Uint8Array;
		signature: Uint8Array;
	}>;
}
