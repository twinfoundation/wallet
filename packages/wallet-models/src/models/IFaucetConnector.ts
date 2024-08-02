// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IService } from "@gtsc/services";

/**
 * Interface describing a faucet connector.
 */
export interface IFaucetConnector extends IService {
	/**
	 * Fund the wallet from the faucet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount added to the address by the faucet.
	 */
	fundAddress(identity: string, address: string, timeoutInSeconds?: number): Promise<bigint>;
}
