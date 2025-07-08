// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClient } from "@iota/iota-sdk/client";
import { Converter, GeneralError, Guards } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import { Iota } from "@twin.org/dlt-iota";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import {
	FaucetConnectorFactory,
	type IFaucetConnector,
	type IWalletConnector
} from "@twin.org/wallet-models";
import type { IIotaWalletConnectorConfig } from "./models/IIotaWalletConnectorConfig";
import type { IIotaWalletConnectorConstructorOptions } from "./models/IIotaWalletConnectorConstructorOptions";

/**
 * Class for performing wallet operations on IOTA.
 */
export class IotaWalletConnector implements IWalletConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaWalletConnector>();

	/**
	 * The configuration to use for IOTA operations.
	 * @internal
	 */
	private readonly _config: IIotaWalletConnectorConfig;

	/**
	 * The vault for the mnemonic or seed.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The IOTA faucet.
	 * @internal
	 */
	private readonly _faucetConnector?: IFaucetConnector;

	/**
	 * The IOTA client.
	 * @internal
	 */
	private readonly _client: IotaClient;

	/**
	 * Create a new instance of IOTA Wallet Connector.
	 * @param options The options for the wallet connector.
	 */
	constructor(options: IIotaWalletConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaWalletConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);

		this._vaultConnector = VaultConnectorFactory.get(options?.vaultConnectorType ?? "vault");
		this._faucetConnector = FaucetConnectorFactory.getIfExists(
			options?.faucetConnectorType ?? "faucet"
		);
		this._config = options.config;
		Iota.populateConfig(this._config);
		this._client = Iota.createClient(this._config);
	}

	/**
	 * Create a new wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns Nothing.
	 */
	public async create(identity: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		const mnemonic = Bip39.randomMnemonic();
		await this._vaultConnector.setSecret<string>(
			Iota.buildMnemonicKey(identity, this._config.vaultMnemonicId),
			mnemonic
		);
		const seed = Bip39.mnemonicToSeed(mnemonic);
		await this._vaultConnector.setSecret<string>(
			Iota.buildSeedKey(identity, this._config.vaultSeedId),
			Converter.bytesToBase64(seed)
		);
	}

	/**
	 * Get the addresses for the identity.
	 * @param identity The identity to get the addresses for.
	 * @param accountIndex The account index to get the addresses for.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The number of addresses to generate.
	 * @param isInternal Whether the addresses are internal.
	 * @returns The addresses.
	 */
	public async getAddresses(
		identity: string,
		accountIndex: number,
		startAddressIndex: number,
		count: number,
		isInternal?: boolean
	): Promise<string[]> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		const seed = await Iota.getSeed(this._config, this._vaultConnector, identity);

		return Iota.getAddresses(
			seed,
			this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
			accountIndex,
			startAddressIndex,
			count,
			isInternal
		);
	}

	/**
	 * Get the balance for the given address.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The address to get the balance for.
	 * @returns The balance.
	 */
	public async getBalance(identity: string, address: string): Promise<bigint> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(address), address);

		const balance = await this._client.getBalance({
			owner: address
		});

		return BigInt(balance.totalBalance);
	}

	/**
	 * Ensure the balance for the given address is at least the given amount.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The address to ensure the balance for.
	 * @param ensureBalance The minimum balance to ensure.
	 * @param timeoutInSeconds Optional timeout in seconds, defaults to 10 seconds.
	 * @returns True if the balance is at least the given amount, false otherwise.
	 */
	public async ensureBalance(
		identity: string,
		address: string,
		ensureBalance: bigint,
		timeoutInSeconds?: number
	): Promise<boolean> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(address), address);
		Guards.bigint(this.CLASS_NAME, nameof(ensureBalance), ensureBalance);

		if (this._faucetConnector) {
			let retryCount = 10;
			let currentBalance = await this.getBalance(identity, address);

			while (currentBalance < ensureBalance && retryCount > 0) {
				const addedBalance = await this._faucetConnector.fundAddress(
					identity,
					address,
					timeoutInSeconds
				);
				if (addedBalance === 0n) {
					return false;
				}
				currentBalance += addedBalance;
				if (currentBalance < ensureBalance) {
					await new Promise(resolve => setTimeout(resolve, 1000));
					retryCount--;
				}
			}
			return currentBalance >= ensureBalance;
		}

		return false;
	}

	/**
	 * Transfer an amount from one address to another.
	 * @param identity The identity of the user to access the vault keys.
	 * @param addressSource The source address to transfer from.
	 * @param addressDest The destination address to transfer to.
	 * @param amount The amount to transfer.
	 * @returns The transaction digest.
	 */
	public async transfer(
		identity: string,
		addressSource: string,
		addressDest: string,
		amount: bigint
	): Promise<string | undefined> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(addressSource), addressSource);
		Guards.stringValue(this.CLASS_NAME, nameof(addressDest), addressDest);
		Guards.bigint(this.CLASS_NAME, nameof(amount), amount);

		try {
			const result = await Iota.prepareAndPostValueTransaction(
				this._config,
				this._vaultConnector,
				undefined,
				identity,
				this._client,
				addressSource,
				amount,
				addressDest
			);

			return result.digest;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"transferFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}
}
