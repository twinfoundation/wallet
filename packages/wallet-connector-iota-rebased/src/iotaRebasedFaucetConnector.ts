// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClient } from "@iota/iota-sdk/client";
import { requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
import { GeneralError, Guards } from "@twin.org/core";
import { IotaRebased } from "@twin.org/dlt-iota-rebased";
import { nameof } from "@twin.org/nameof";
import type { IFaucetConnector } from "@twin.org/wallet-models";
import type { IIotaRebasedFaucetConnectorConfig } from "./models/IIotaRebasedFaucetConnectorConfig";
import type { IIotaRebasedFaucetConnectorConstructorOptions } from "./models/IIotaRebasedFaucetConnectorConstructorOptions";

/**
 * Class for performing faucet operations on IOTA Rebased.
 */
export class IotaRebasedFaucetConnector implements IFaucetConnector {
	/**
	 * The namespace supported by the faucet connector.
	 */
	public static readonly NAMESPACE: string = "iota-rebased";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaRebasedFaucetConnector>();

	/**
	 * The configuration to use for IOTA Rebased operations.
	 * @internal
	 */
	private readonly _config: IIotaRebasedFaucetConnectorConfig;

	/**
	 * The IOTA Rebased client.
	 * @internal
	 */
	private readonly _client: IotaClient;

	/**
	 * Create a new instance of IotaRebasedFaucetConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaRebasedFaucetConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaRebasedFaucetConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		Guards.string(this.CLASS_NAME, nameof(options.config.endpoint), options.config.endpoint);

		this._config = options.config;
		IotaRebased.populateConfig(this._config);
		this._client = IotaRebased.createClient(this._config);
	}

	/**
	 * Fund an address with IOTA Rebased from the faucet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount funded.
	 */
	public async fundAddress(
		identity: string,
		address: string,
		timeoutInSeconds: number = 60
	): Promise<bigint> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(address), address);

		try {
			const initialBalance = await this._client.getBalance({
				owner: address
			});

			const response = await requestIotaFromFaucetV0({
				host: this._config.endpoint,
				recipient: address
			});

			if (response?.error) {
				throw new GeneralError(this.CLASS_NAME, "fundingFailed", undefined, response.error);
			}

			// Poll for balance change
			const numTries = Math.ceil(timeoutInSeconds / 5);
			for (let i = 0; i < numTries; i++) {
				const newBalance = await this._client.getBalance({
					owner: address
				});

				if (BigInt(newBalance.totalBalance) > BigInt(initialBalance.totalBalance)) {
					return BigInt(newBalance.totalBalance) - BigInt(initialBalance.totalBalance);
				}

				if (i < numTries - 1) {
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(error);
			throw new GeneralError(
				this.CLASS_NAME,
				"fundingFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}

		return 0n;
	}
}
