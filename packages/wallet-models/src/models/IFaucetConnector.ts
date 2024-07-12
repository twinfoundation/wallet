// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IServiceRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing a faucet connector.
 */
export interface IFaucetConnector extends IService {
	/**
	 * Fund the wallet from the faucet.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @param requestContext The context for the request.
	 * @returns The amount added to the address by the faucet.
	 */
	fundAddress(
		address: string,
		timeoutInSeconds?: number,
		requestContext?: IServiceRequestContext
	): Promise<bigint>;
}
