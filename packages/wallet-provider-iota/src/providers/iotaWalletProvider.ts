// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IWalletProvider } from "@gtsc/wallet-provider-models";
import { Client } from "@iota/sdk-wasm/node";
import type { IIotaWalletProviderConfig } from "../models/IIotaWalletProviderConfig";

/**
 * Class for performing wallet operations on IOTA.
 */
export class IotaWalletProvider implements IWalletProvider {
	/**
	 * The namespace supported by the wallet provider.
	 */
	public static NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<IotaWalletProvider>();

	/**
	 * The configuration to use for tangle operations.
	 * @internal
	 */
	private readonly _config: IIotaWalletProviderConfig;

	/**
	 * The IOTA Wallet client.
	 * @internal
	 */
	private _client?: Client;

	/**
	 * Create a new instance of IotaWalletProvider.
	 * @param config The configuration to use.
	 */
	constructor(config: IIotaWalletProviderConfig) {
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(config),
			config
		);

		this._config = config;
	}

	/**
	 * Get the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The created document.
	 */
	public async getBalance(address: string): Promise<bigint> {
		return 0n;
	}

	/**
	 * Create a client for the IOTA network.
	 * @returns The client.
	 */
	private createClient(): Client {
		if (!this._client) {
			this._client = new Client(this._config.clientOptions);
		}
		return this._client;
	}
}
