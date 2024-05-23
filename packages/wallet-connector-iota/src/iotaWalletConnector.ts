// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards } from "@gtsc/core";
import { Bip39, Bip44, KeyType } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultConnector } from "@gtsc/vault-models";
import type { IFaucetConnector, IWalletConnector } from "@gtsc/wallet-models";
import { Client, CoinType, Utils, type IRent } from "@iota/sdk-wasm/node/lib/index.js";
import type { IIotaWalletConnectorConfig } from "./models/IIotaWalletConnectorConfig";

/**
 * Class for performing wallet operations on IOTA.
 */
export class IotaWalletConnector implements IWalletConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "iota";

	/**
	 * Default name for the mnemonic secret.
	 */
	public static MNEMONIC_SECRET_NAME: string = "wallet-mnemonic";

	/**
	 * Default coin type.
	 * @internal
	 */
	private static readonly _COIN_TYPE: number = CoinType.IOTA;

	/**
	 * Default bech32 hrp.
	 * @internal
	 */
	private static readonly _BECH32_HRP: string = "iota";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<IotaWalletConnector>();

	/**
	 * The configuration to use for tangle operations.
	 * @internal
	 */
	private readonly _config: IIotaWalletConnectorConfig;

	/**
	 * The IOTA Wallet client.
	 * @internal
	 */
	private _client?: Client;

	/**
	 * The vault for the mnemonic.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The IOTA faucet.
	 * @internal
	 */
	private readonly _faucetConnector?: IFaucetConnector;

	/**
	 * Information about the rent structure.
	 * @internal
	 */
	private _rentInfo?: IRent;

	/**
	 * Create a new instance of IotaWalletConnector.
	 * @param dependencies The dependencies for the wallet connector.
	 * @param dependencies.vaultConnector Vault connector to use for wallet secrets.
	 * @param dependencies.faucetConnector Optional faucet for requesting funds.
	 * @param config The configuration to use.
	 */
	constructor(
		dependencies: {
			vaultConnector: IVaultConnector;
			faucetConnector?: IFaucetConnector;
		},
		config: IIotaWalletConnectorConfig
	) {
		Guards.object<IIotaWalletConnectorConfig>(
			IotaWalletConnector._CLASS_NAME,
			nameof(dependencies),
			dependencies
		);
		Guards.object<IIotaWalletConnectorConfig>(
			IotaWalletConnector._CLASS_NAME,
			nameof(dependencies.vaultConnector),
			dependencies.vaultConnector
		);
		Guards.object<IIotaWalletConnectorConfig>(
			IotaWalletConnector._CLASS_NAME,
			nameof(config),
			config
		);
		Guards.object<IIotaWalletConnectorConfig>(
			IotaWalletConnector._CLASS_NAME,
			nameof(config.clientOptions),
			config.clientOptions
		);

		this._vaultConnector = dependencies.vaultConnector;
		this._faucetConnector = dependencies.faucetConnector;
		this._config = config;
		this._config.coinType ??= IotaWalletConnector._COIN_TYPE;
		this._config.bech32Hrp ??= IotaWalletConnector._BECH32_HRP;
	}

	/**
	 * Create a new wallet.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async create(requestContext: IRequestContext): Promise<void> {
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		const mnemonic = Bip39.randomMnemonic();
		await this._vaultConnector.setSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? IotaWalletConnector.MNEMONIC_SECRET_NAME,
			mnemonic
		);
	}

	/**
	 * Get the addresses for the requested range.
	 * @param requestContext The context for the request.
	 * @param startIndex The start index for the addresses.
	 * @param endIndex The end index for the addresses.
	 * @returns The list of addresses.
	 */
	public async getAddresses(
		requestContext: IRequestContext,
		startIndex: number,
		endIndex: number
	): Promise<string[]> {
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? IotaWalletConnector.MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const keyPairs: string[] = [];

		for (let i = startIndex; i < endIndex; i++) {
			const addressKeyPair = Bip44.addressBech32(
				seed,
				KeyType.Ed25519,
				this._config.bech32Hrp ?? IotaWalletConnector._BECH32_HRP,
				this._config.coinType ?? IotaWalletConnector._COIN_TYPE,
				0,
				false,
				i
			);

			keyPairs.push(addressKeyPair.address);
		}

		return keyPairs;
	}

	/**
	 * Get the balance for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	public async getBalance(requestContext: IRequestContext, address: string): Promise<bigint> {
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(address), address);

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
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(address), address);

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
	 * @param ensureBalance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
	 */
	public async ensureBalance(
		requestContext: IRequestContext,
		address: string,
		ensureBalance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean> {
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(address), address);
		Guards.bigint(IotaWalletConnector._CLASS_NAME, nameof(ensureBalance), ensureBalance);

		if (this._faucetConnector) {
			let retryCount = 10;
			let currentBalance = await this.getBalance(requestContext, address);

			while (currentBalance < ensureBalance && retryCount > 0) {
				const addedBalance = await this._faucetConnector.fundAddress(
					requestContext,
					address,
					timeoutInSeconds
				);
				if (addedBalance === 0n) {
					// The balance has not increased, so return.
					return false;
				}
				currentBalance += addedBalance;
				if (currentBalance < ensureBalance) {
					// The balance has increased but is still not enough, wait a second and try again.
					await new Promise(resolve => setTimeout(resolve, 1000));
					retryCount--;
				}
			}
			return currentBalance >= ensureBalance;
		}

		return false;
	}

	/**
	 * Transfer funds to an address.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns Nothing.
	 */
	public async transfer(
		requestContext: IRequestContext,
		address: string,
		amount: bigint
	): Promise<void> {
		Guards.object<IRequestContext>(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(address), address);
		Guards.bigint(IotaWalletConnector._CLASS_NAME, nameof(amount), amount);

		try {
			const client = await this.createClient();

			const mnemonic = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.walletMnemonicId ?? IotaWalletConnector.MNEMONIC_SECRET_NAME
			);

			await client.buildAndPostBlock(
				{ mnemonic },
				{
					output: {
						address,
						amount
					}
				}
			);
		} catch (error) {
			throw new GeneralError(IotaWalletConnector._CLASS_NAME, "transferFailed", undefined, error);
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
