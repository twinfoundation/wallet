// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Client } from "@iota/sdk-wasm/node/lib/index.js";
import { GeneralError, Guards } from "@twin.org/core";
import { IotaStardust } from "@twin.org/dlt-iota-stardust";
import { nameof } from "@twin.org/nameof";
import type { IFaucetConnector } from "@twin.org/wallet-models";
import type { IIotaStardustFaucetConnectorConfig } from "./models/IIotaStardustFaucetConnectorConfig";
import type { IIotaStardustFaucetConnectorConstructorOptions } from "./models/IIotaStardustFaucetConnectorConstructorOptions";

/**
 * Class for performing faucet operations on IOTA Stardust.
 */
export class IotaStardustFaucetConnector implements IFaucetConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static readonly NAMESPACE: string = "iota-stardust";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaStardustFaucetConnector>();

	/**
	 * The configuration to use for tangle operations.
	 * @internal
	 */
	private readonly _config: IIotaStardustFaucetConnectorConfig;

	/**
	 * The IOTA Wallet client.
	 * @internal
	 */
	private _client?: Client;

	/**
	 * Create a new instance of IotaFaucetConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaStardustFaucetConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaStardustFaucetConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaStardustFaucetConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.endpoint), options.config.endpoint);

		this._config = options.config;
	}

	/**
	 * Fund the wallet from the faucet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount added to the address by the faucet.
	 */
	public async fundAddress(
		identity: string,
		address: string,
		timeoutInSeconds: number = 60
	): Promise<bigint> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const client = await this.createClient();

			const oldBalance = await this.getBalance(address);
			await client.requestFundsFromFaucet(this._config.endpoint, address);

			const numTries = Math.ceil(timeoutInSeconds / 5);

			for (let i = 0; i < numTries; i++) {
				const newBalance = await this.getBalance(address);
				if (newBalance > oldBalance) {
					// The balance increased so we can return the new balance
					return newBalance - oldBalance;
				}

				// Still waiting for the balance to update so wait and try again
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"fundingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
			);
		}

		return 0n;
	}

	/**
	 * Calculate the balance on an address.
	 * @param address The bech32 encoded address to get the balance.
	 * @returns The amount available on the wallet address.
	 * @internal
	 */
	private async getBalance(address: string): Promise<bigint> {
		const client = await this.createClient();
		const outputIds = await client.basicOutputIds([
			{ address },
			{ hasExpiration: false },
			{ hasTimelock: false },
			{ hasStorageDepositReturn: false }
		]);
		const outputs = await client.getOutputs(outputIds.items);

		let totalAmount = BigInt(0);
		for (const output of outputs) {
			totalAmount += output.output.getAmount();
		}

		return totalAmount;
	}

	/**
	 * Create a client for the IOTA network.
	 * @returns The client.
	 * @internal
	 */
	private async createClient(): Promise<Client> {
		if (!this._client) {
			this._client = new Client(this._config.clientOptions);
		}
		return this._client;
	}
}
