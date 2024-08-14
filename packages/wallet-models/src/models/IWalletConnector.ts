// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@gtsc/core";

/**
 * Interface describing a wallet connector.
 */
export interface IWalletConnector extends IComponent {
	/**
	 * Create a new wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns Nothing.
	 */
	create(identity: string): Promise<void>;

	/**
	 * Get the addresses for the requested range.
	 * @param identity The identity of the user to access the vault keys.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The end index for the addresses.
	 * @returns The list of addresses.
	 */
	getAddresses(identity: string, startAddressIndex: number, count: number): Promise<string[]>;

	/**
	 * Get the balance for an address in a wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	getBalance(identity: string, address: string): Promise<bigint>;

	/**
	 * Ensure the balance for an address in a wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address.
	 * @param ensureBalance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	ensureBalance(
		identity: string,
		address: string,
		ensureBalance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean>;

	/**
	 * Transfer funds to an address.
	 * @param identity The identity of the user to access the vault keys.
	 * @param addressSource The bech32 encoded address to send the funds from.
	 * @param addressDest The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns An identifier for the transfer if there was one.
	 */
	transfer(
		identity: string,
		addressSource: string,
		addressDest: string,
		amount: bigint
	): Promise<string | undefined>;
}
