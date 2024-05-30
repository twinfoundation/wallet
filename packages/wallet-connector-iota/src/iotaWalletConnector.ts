// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards } from "@gtsc/core";
import { Bip39, Bip44, Ed25519, KeyType, Secp256k1 } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultConnector } from "@gtsc/vault-models";
import type { IFaucetConnector, IWalletConnector } from "@gtsc/wallet-models";
import {
	Client,
	CoinType,
	Utils,
	type Block,
	type IBuildBlockOptions,
	type IRent
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
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "wallet-mnemonic";

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
		this._config.walletMnemonicId ??= IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME;
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
			this._config.walletMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME,
			mnemonic
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

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

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
				this._config.walletMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
			);

			await this.prepareAndPostTransaction(client, mnemonic, {
				output: {
					address,
					amount
				}
			});
		} catch (error) {
			throw new GeneralError(IotaWalletConnector._CLASS_NAME, "transferFailed", undefined, error);
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
			this._config.walletMnemonicId ?? IotaWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
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

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param client The client to use.
	 * @param mnemonic The mnemonic to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		client: Client,
		mnemonic: string,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const prepared = await client.prepareTransaction(
			{ mnemonic },
			{
				coinType: this._config.coinType ?? IotaWalletConnector._DEFAULT_COIN_TYPE,
				...options
			}
		);

		const signed = await client.signTransaction({ mnemonic }, prepared);

		const blockIdAndBlock = await client.postBlockPayload(signed);

		try {
			const timeoutSeconds =
				this._config.inclusionTimeoutSeconds ?? IotaWalletConnector._DEFAULT_INCLUSION_TIMEOUT;

			await client.retryUntilIncluded(blockIdAndBlock[0], 2, Math.ceil(timeoutSeconds / 2));
		} catch (error) {
			throw new GeneralError(IotaWalletConnector._CLASS_NAME, "inclusionFailed", undefined, error);
		}

		return {
			blockId: blockIdAndBlock[0],
			block: blockIdAndBlock[1]
		};
	}
}
