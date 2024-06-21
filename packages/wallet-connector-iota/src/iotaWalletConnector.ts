// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseError, Converter, GeneralError, Guards, Is, type IError } from "@gtsc/core";
import { Bip39, Bip44, Ed25519, KeyType, Secp256k1 } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import { VaultConnectorFactory, type IVaultConnector } from "@gtsc/vault-models";
import {
	FaucetConnectorFactory,
	type IFaucetConnector,
	type IWalletConnector
} from "@gtsc/wallet-models";
import {
	Client,
	CoinType,
	Utils,
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
	public static NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<IotaWalletConnector>();

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
		Guards.object(IotaWalletConnector._CLASS_NAME, nameof(options), options);
		Guards.object<IIotaWalletConnectorConfig>(
			IotaWalletConnector._CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaWalletConnectorConfig["clientOptions"]>(
			IotaWalletConnector._CLASS_NAME,
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
			this._config.vaultMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME,
			mnemonic
		);
		const seed = Bip39.mnemonicToSeed(mnemonic);
		await this._vaultConnector.setSecret<string>(
			requestContext,
			this._config.vaultSeedId ?? IotaWalletConnector._DEFAULT_SEED_SECRET_NAME,
			Converter.bytesToBase64(seed)
		);
	}

	/**
	 * Get the addresses for the requested range.
	 * @param requestContext The context for the request.
	 * @param startAddressIndex The start index for the addresses.
	 * @param count The number of addresses to generate.
	 * @returns The list of addresses.
	 */
	public async getAddresses(
		requestContext: IRequestContext,
		startAddressIndex: number,
		count: number
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
		Guards.integer(IotaWalletConnector._CLASS_NAME, nameof(startAddressIndex), startAddressIndex);
		Guards.integer(IotaWalletConnector._CLASS_NAME, nameof(count), count);

		const seed = await this.getSeed(requestContext);

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

		const client = new Client(this._config.clientOptions);
		const info = await client.getInfo();
		const rentInfo = info.nodeInfo.protocol.rentStructure;

		const outputIds = await client.basicOutputIds([
			{ address },
			{ hasExpiration: false },
			{ hasTimelock: false },
			{ hasStorageDepositReturn: false }
		]);

		const outputs = await client.getOutputs(outputIds.items);

		let totalStorageCosts = BigInt(0);
		for (const output of outputs) {
			totalStorageCosts += Utils.computeStorageDeposit(output.output, rentInfo);
		}

		return totalStorageCosts;
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
	 * @param addressSource The bech32 encoded address to send the funds from.
	 * @param addressDest The bech32 encoded address to send the funds to.
	 * @param amount The amount to transfer.
	 * @returns An identifier for the transfer if there was one.
	 */
	public async transfer(
		requestContext: IRequestContext,
		addressSource: string,
		addressDest: string,
		amount: bigint
	): Promise<string | undefined> {
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
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(addressSource), addressSource);
		Guards.stringValue(IotaWalletConnector._CLASS_NAME, nameof(addressDest), addressDest);
		Guards.bigint(IotaWalletConnector._CLASS_NAME, nameof(amount), amount);

		try {
			const client = new Client(this._config.clientOptions);

			const inputs = await client.findInputs([addressSource], amount);

			const blockDetails = await this.prepareAndPostTransaction(requestContext, client, {
				inputs,
				output: {
					address: addressDest,
					amount: amount.toString()
				}
			});

			return blockDetails.blockId;
		} catch (error) {
			throw new GeneralError(
				IotaWalletConnector._CLASS_NAME,
				"transferFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Sign data using a wallet based key.
	 * @param requestContext The context for the request.
	 * @param signatureType The type of signature to create.
	 * @param addressIndex The index for the address.
	 * @param data The data bytes.
	 * @returns The signature and public key bytes.
	 */
	public async sign(
		requestContext: IRequestContext,
		signatureType: KeyType,
		addressIndex: number,
		data: Uint8Array
	): Promise<{
		publicKey: Uint8Array;
		signature: Uint8Array;
	}> {
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
		Guards.arrayOneOf(
			IotaWalletConnector._CLASS_NAME,
			nameof(signatureType),
			signatureType,
			Object.values(KeyType)
		);
		Guards.integer(IotaWalletConnector._CLASS_NAME, nameof(addressIndex), addressIndex);
		Guards.uint8Array(IotaWalletConnector._CLASS_NAME, nameof(data), data);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const addressKeyPair = Bip44.addressBech32(
			seed,
			signatureType,
			this._config.bech32Hrp ?? IotaWalletConnector._DEFAULT_BECH32_HRP,
			this._config.coinType ?? IotaWalletConnector._DEFAULT_COIN_TYPE,
			0,
			false,
			addressIndex
		);

		const signature =
			signatureType === KeyType.Ed25519
				? Ed25519.sign(data, addressKeyPair.privateKey)
				: Secp256k1.sign(data, addressKeyPair.privateKey);

		return {
			publicKey: addressKeyPair.publicKey,
			signature
		};
	}

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param requestContext The context for the request.
	 * @param client The client to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		requestContext: IRequestContext,
		client: Client,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const seed = await this.getSeed(requestContext);
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
				IotaWalletConnector._CLASS_NAME,
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
	 * @param requestContext The context for the request.
	 * @returns The seed.
	 * @internal
	 */
	private async getSeed(requestContext: IRequestContext): Promise<Uint8Array> {
		try {
			const seedBase64 = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.vaultSeedId ?? IotaWalletConnector._DEFAULT_SEED_SECRET_NAME
			);
			return Converter.base64ToBytes(seedBase64);
		} catch {}

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

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
			let message = obj.payload?.error;
			if (message === "no input with matching ed25519 address provided") {
				message = "There were insufficient funds to complete the operation";
			}
			return {
				name: "IOTA",
				message
			};
		}

		return BaseError.fromError(error);
	}
}
