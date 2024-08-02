// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseError, Converter, GeneralError, Guards, Is, type IError } from "@gtsc/core";
import { Bip39, Bip44, KeyType } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@gtsc/vault-models";
import {
	FaucetConnectorFactory,
	type IFaucetConnector,
	type IWalletConnector
} from "@gtsc/wallet-models";
import {
	Client,
	CoinType,
	type Block,
	type IBuildBlockOptions
} from "@iota/sdk-wasm/node/lib/index.js";
import type { IIotaWalletConnectorConfig } from "./models/IIotaWalletConnectorConfig";

/**
 * Class for performing wallet operations on IOTA.
 */
export class IotaWalletConnector implements IWalletConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Default name for the mnemonic secret.
	 */
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "mnemonic";

	/**
	 * Default name for the seed secret.
	 */
	private static readonly _DEFAULT_SEED_SECRET_NAME: string = "seed";

	/**
	 * Default coin type.
	 * @internal
	 */
	private static readonly _DEFAULT_COIN_TYPE: number = CoinType.IOTA;

	/**
	 * Default bech32 hrp.
	 * @internal
	 */
	private static readonly _DEFAULT_BECH32_HRP: string = "iota";

	/**
	 * The default length of time to wait for the inclusion of a transaction in seconds.
	 * @internal
	 */
	private static readonly _DEFAULT_INCLUSION_TIMEOUT: number = 60;

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaWalletConnector>();

	/**
	 * The configuration to use for tangle operations.
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
	 * Create a new instance of IotaWalletConnector.
	 * @param options The options for the wallet connector.
	 * @param options.vaultConnectorType Vault connector to use for wallet secrets, defaults to "vault".
	 * @param options.faucetConnectorType Optional faucet for requesting funds, defaults to "faucet".
	 * @param options.config The configuration to use.
	 */
	constructor(options: {
		vaultConnectorType?: string;
		faucetConnectorType?: string;
		config: IIotaWalletConnectorConfig;
	}) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaWalletConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaWalletConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);

		this._vaultConnector = VaultConnectorFactory.get(options?.vaultConnectorType ?? "vault");
		this._faucetConnector = FaucetConnectorFactory.getIfExists(
			options?.faucetConnectorType ?? "faucet"
		);
		this._config = options.config;
		this._config.vaultMnemonicId ??= IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME;
		this._config.vaultSeedId ??= IotaWalletConnector._DEFAULT_SEED_SECRET_NAME;
		this._config.coinType ??= IotaWalletConnector._DEFAULT_COIN_TYPE;
		this._config.bech32Hrp ??= IotaWalletConnector._DEFAULT_BECH32_HRP;
		this._config.inclusionTimeoutSeconds ??= IotaWalletConnector._DEFAULT_INCLUSION_TIMEOUT;
	}

	/**
	 * Create a new wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns Nothing.
	 */
	public async create(identity: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		const mnemonic = Bip39.randomMnemonic();
		await this._vaultConnector.setSecret<string>(this.buildMnemonicKey(identity), mnemonic);
		const seed = Bip39.mnemonicToSeed(mnemonic);
		await this._vaultConnector.setSecret<string>(
			this.buildSeedKey(identity),
			Converter.bytesToBase64(seed)
		);
	}

	/**
	 * Get the addresses for the requested range.
	 * @param identity The identity of the user to access the vault keys.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The number of addresses to generate.
	 * @returns The list of addresses.
	 */
	public async getAddresses(
		identity: string,
		startAddressIndex: number,
		count: number
	): Promise<string[]> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.integer(this.CLASS_NAME, nameof(startAddressIndex), startAddressIndex);
		Guards.integer(this.CLASS_NAME, nameof(count), count);

		const seed = await this.getSeed(identity);

		const keyPairs: string[] = [];

		for (let i = startAddressIndex; i < startAddressIndex + count; i++) {
			const addressKeyPair = Bip44.addressBech32(
				seed,
				KeyType.Ed25519,
				this._config.bech32Hrp ?? IotaWalletConnector._DEFAULT_BECH32_HRP,
				this._config.coinType ?? IotaWalletConnector._DEFAULT_COIN_TYPE,
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
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	public async getBalance(identity: string, address: string): Promise<bigint> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(address), address);

		const client = new Client(this._config.clientOptions);

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
	 * Ensure the balance for an address in a wallet.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The bech32 encoded address.
	 * @param ensureBalance The balance to ensure on the address.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns True if the balance has been ensured.
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
	 * @param identity The identity of the user to access the vault keys.
	 * @param addressSource The bech32 encoded address to send the funds from.
	 * @param addressDest The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns An identifier for the transfer if there was one.
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
			const client = new Client(this._config.clientOptions);

			const inputs = await client.findInputs([addressSource], amount);

			const blockDetails = await this.prepareAndPostTransaction(identity, client, {
				inputs,
				output: {
					address: addressDest,
					amount: amount.toString()
				}
			});

			return blockDetails.blockId;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"transferFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param identity The identity of the user to access the vault keys.
	 * @param client The client to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		identity: string,
		client: Client,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const seed = await this.getSeed(identity);
		const secretManager = { hexSeed: Converter.bytesToHex(seed, true) };
		const prepared = await client.prepareTransaction(secretManager, {
			coinType: this._config.coinType ?? IotaWalletConnector._DEFAULT_COIN_TYPE,
			...options
		});

		const signed = await client.signTransaction(secretManager, prepared);

		const blockIdAndBlock = await client.postBlockPayload(signed);

		try {
			const timeoutSeconds =
				this._config.inclusionTimeoutSeconds ?? IotaWalletConnector._DEFAULT_INCLUSION_TIMEOUT;

			await client.retryUntilIncluded(blockIdAndBlock[0], 2, Math.ceil(timeoutSeconds / 2));
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"inclusionFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}

		return {
			blockId: blockIdAndBlock[0],
			block: blockIdAndBlock[1]
		};
	}

	/**
	 * Get the seed from the vault.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The seed.
	 * @internal
	 */
	private async getSeed(identity: string): Promise<Uint8Array> {
		try {
			const seedBase64 = await this._vaultConnector.getSecret<string>(this.buildSeedKey(identity));
			return Converter.base64ToBytes(seedBase64);
		} catch {}

		const mnemonic = await this._vaultConnector.getSecret<string>(this.buildMnemonicKey(identity));

		return Bip39.mnemonicToSeed(mnemonic);
	}

	/**
	 * Extract error from SDK payload.
	 * @param error The error to extract.
	 * @returns The extracted error.
	 */
	private extractPayloadError(error: unknown): IError {
		if (Is.json(error)) {
			const obj = JSON.parse(error);
			const message = obj.payload?.error;
			if (message === "no input with matching ed25519 address provided") {
				return new GeneralError(this.CLASS_NAME, "insufficientFunds");
			}
			return {
				name: "IOTA",
				message
			};
		}

		return BaseError.fromError(error);
	}

	/**
	 * Build the key name to access the mnemonic in the vault.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The vault key.
	 * @internal
	 */
	private buildMnemonicKey(identity: string): string {
		return `${identity}/${this._config.vaultMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME}`;
	}

	/**
	 * Build the key name to access the seed in the vault.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The vault key.
	 * @internal
	 */
	private buildSeedKey(identity: string): string {
		return `${identity}/${this._config.vaultSeedId ?? IotaWalletConnector._DEFAULT_SEED_SECRET_NAME}`;
	}
}
