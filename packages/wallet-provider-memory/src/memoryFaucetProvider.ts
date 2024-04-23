// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IFaucetProvider } from "@gtsc/wallet-provider-models";
import type { IMemoryFaucetProviderConfig } from "./models/IMemoryFaucetProviderConfig";

/**
 * Class for performing faucet operations using in-memory storage.
 */
export class MemoryFaucetProvider implements IFaucetProvider {
	/**
	 * The namespace supported by the wallet provider.
	 */
	public static NAMESPACE: string = "mem";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<MemoryFaucetProvider>();

	/**
	 * The balance for the faucet.
	 * @internal
	 */
	private _balance: bigint;

	/**
	 * Create a new instance of IotaWalletProvider.
	 * @param config The configuration to use.
	 */
	constructor(config?: IMemoryFaucetProviderConfig) {
		this._balance = config?.initialBalance
			? BigInt(config.initialBalance)
			: 1000000000000000000000000000n;
	}

	/**
	 * Fund the wallet from the faucet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount added to the address by the faucet.
	 */
	public async fundAddress(
		requestContext: IRequestContext,
		address: string,
		timeoutInSeconds: number = 60
	): Promise<bigint> {
		const maxFundAmount = 1000000000n;
		const fundAmount = this._balance < maxFundAmount ? this._balance : maxFundAmount;
		if (this._balance < fundAmount) {
			return 0n;
		}
		this._balance -= fundAmount;
		return fundAmount;
	}
}
