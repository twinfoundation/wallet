// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultProvider } from "@gtsc/vault-provider-models";
import type { IFaucetProvider, IWalletProvider } from "@gtsc/wallet-provider-models";
import { Client, Utils, type IRent } from "@iota/sdk-wasm/node/lib/index.js";
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
	 * The vault for the mnemonic.
	 * @internal
	 */
	private readonly _vaultProvider: IVaultProvider;

	/**
	 * The IOTA faucet.
	 * @internal
	 */
	private readonly _faucetProvider?: IFaucetProvider;

	/**
	 * Information about the rent structure.
	 * @internal
	 */
	private _rentInfo?: IRent;

	/**
	 * Create a new instance of IotaWalletProvider.
	 * @param dependencies The dependencies for the wallet provider.
	 * @param dependencies.vaultProvider Vault provider to use for wallet secrets.
	 * @param dependencies.faucetProvider Optional faucet for requesting funds.
	 * @param config The configuration to use.
	 */
	constructor(
		dependencies: {
			vaultProvider: IVaultProvider;
			faucetProvider?: IFaucetProvider;
		},
		config: IIotaWalletProviderConfig
	) {
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(dependencies),
			dependencies
		);
		Guards.object<IIotaWalletProviderConfig>(
			IotaWalletProvider._CLASS_NAME,
			nameof(dependencies.vaultProvider),
			dependencies.vaultProvider
		);

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
		Guards.string(
			IotaWalletProvider._CLASS_NAME,
			nameof(config.walletMnemonicId),
			config.walletMnemonicId
		);

		this._config = config;
		this._vaultProvider = dependencies.vaultProvider;
		this._faucetProvider = dependencies.faucetProvider;
	}

	/**
	 * Get the balance for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	public async getBalance(requestContext: IRequestContext, address: string): Promise<bigint> {
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
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The storage costs for the address.
	 */
	public async getStorageCosts(requestContext: IRequestContext, address: string): Promise<bigint> {
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
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @param balance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	public async ensureBalance(
		requestContext: IRequestContext,
		address: string,
		balance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean> {
		if (this._faucetProvider) {
			let currentBalance = await this.getBalance(requestContext, address);

			while (currentBalance < balance) {
				const newBalance = await this._faucetProvider.fundAddress(
					requestContext,
					address,
					timeoutInSeconds
				);
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
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns The block created.
	 */
	public async transfer(
		requestContext: IRequestContext,
		address: string,
		amount: bigint
	): Promise<string> {
		try {
			const client = await this.createClient();

			const mnemonic = await this._vaultProvider.get<string>(
				requestContext,
				this._config.walletMnemonicId
			);

			const blockIdAndBlock = await client.buildAndPostBlock(
				{ mnemonic },
				{
					output: {
						address,
						amount
					}
				}
			);

			return blockIdAndBlock[0];
		} catch (error) {
			throw new GeneralError(IotaWalletProvider._CLASS_NAME, "transferFailed", undefined, error);
		}
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
