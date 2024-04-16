// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IService } from "@gtsc/services";

/**
 * Interface describing a faucet.
 */
export interface IFaucetProvider extends IService {
	/**
	 * Fund the wallet from the faucet.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount available on the wallet address.
	 */
	fundAddress(address: string, timeoutInSeconds?: number): Promise<bigint>;
}
