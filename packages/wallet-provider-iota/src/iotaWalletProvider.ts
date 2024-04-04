// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IFaucetProvider, IWalletProvider } from "@gtsc/wallet-provider-models";
import { Client, Utils, type IRent } from "@iota/sdk-wasm/node";
import type { IIotaWalletProviderConfig } from "./models/IIotaWalletProviderConfig";

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
	 * The IOTA faucet.
	 * @internal
	 */
	private readonly _faucet?: IFaucetProvider;

	/**
	 * Information about the rent structure.
	 * @internal
	 */
	private _rentInfo?: IRent;

	/**
	 * Create a new instance of IotaWalletProvider.
	 * @param config The configuration to use.
	 * @param faucet Optional faucet for requesting funds.
	 */
	constructor(config: IIotaWalletProviderConfig, faucet?: IFaucetProvider) {
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(config),
			config
		);
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(config.clientOptions),
			config.clientOptions
		);
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(config.secretManager),
			config.secretManager
		);

		this._config = config;
		this._faucet = faucet;
	}

	/**
	 * Get the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	public async getBalance(address: string): Promise<bigint> {
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
	 * Get the storage costs for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @returns The storage costs for the address.
	 */
	public async getStorageCosts(address: string): Promise<bigint> {
		const client = await this.createClient();

		if (this._rentInfo) {
			const outputIds = await client.basicOutputIds([
				{ address },
				{ hasExpiration: false },
				{ hasTimelock: false },
				{ hasStorageDepositReturn: false }
			]);

			const outputs = await client.getOutputs(outputIds.items);

			let totalStorageCosts = BigInt(0);
			for (const output of outputs) {
				totalStorageCosts += Utils.computeStorageDeposit(output.output, this._rentInfo);
			}

			return totalStorageCosts;
		}

		return 0n;
	}

	/**
	 * Ensure the balance for an address in a wallet.
	 * @param address The bech32 encoded address.
	 * @param balance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	public async ensureBalance(
		address: string,
		balance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean> {
		if (this._faucet) {
			let currentBalance = await this.getBalance(address);

			while (currentBalance < balance) {
				const newBalance = await this._faucet.fundAddress(address, timeoutInSeconds);
				if (newBalance === currentBalance) {
					// The balance has not increased, so return.
					return false;
				}
				currentBalance = newBalance;
				if (newBalance < balance) {
					// The balance has increased but is still not enough, wait a second and try again.
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
			return currentBalance >= balance;
		}

		return false;
	}

	/**
	 * Transfer funds to an address.
	 * @param address The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns The block created.
	 */
	public async transfer(address: string, amount: bigint): Promise<string> {
		const client = await this.createClient();

		const blockIdAndBlock = await client.buildAndPostBlock(this._config.secretManager, {
			output: {
				address,
				amount
			}
		});

		return blockIdAndBlock[0];
	}

	/**
	 * Create a client for the IOTA network.
	 * @returns The client.
	 * @internal
	 */
	private async createClient(): Promise<Client> {
		if (!this._client) {
			this._client = new Client(this._config.clientOptions);
			const info = await this._client.getInfo();
			this._rentInfo = info.nodeInfo.protocol.rentStructure;
		}
		return this._client;
	}
}
