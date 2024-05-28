// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Coerce, Converter, GeneralError, Guards, Is } from "@gtsc/core";
import { Bip39, Bip44, Ed25519, KeyType, Secp256k1 } from "@gtsc/crypto";
import { ComparisonOperator, LogicalOperator } from "@gtsc/entity";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultConnector } from "@gtsc/vault-models";
import type { IFaucetConnector, IWalletConnector } from "@gtsc/wallet-models";
import type { WalletAddress } from "./entities/walletAddress";
import type { IEntityStorageWalletConnectorConfig } from "./models/IEntityStorageWalletConnectorConfig";

/**
 * Class for performing wallet operations using in-memory storage.
 */
export class EntityStorageWalletConnector implements IWalletConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Default name for the mnemonic secret.
	 */
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "wallet-mnemonic";

	/**
	 * Default coin type.
	 * @internal
	 */
	private static readonly _DEFAULT_COIN_TYPE: number = 9999;

	/**
	 * Default bech32 hrp.
	 * @internal
	 */
	private static readonly _DEFAULT_BECH32_HRP: string = "ent";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<EntityStorageWalletConnector>();

	/**
	 * The vault for the mnemonic.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The faucet.
	 * @internal
	 */
	private readonly _faucetConnector?: IFaucetConnector;

	/**
	 * The entity storage for wallets.
	 * @internal
	 */
	private readonly _walletAddressEntityStorage: IEntityStorageConnector<WalletAddress>;

	/**
	 * The configuration to use for tangle operations.
	 * @internal
	 */
	private readonly _config: IEntityStorageWalletConnectorConfig;

	/**
	 * Create a new instance of EntityStorageWalletConnector.
	 * @param dependencies The dependencies for the wallet connector.
	 * @param dependencies.vaultConnector Vault connector to use for wallet secrets.
	 * @param dependencies.faucetConnector Optional faucet for requesting funds.
	 * @param dependencies.walletAddressEntityStorage The entity storage for wallets.
	 * @param config The configuration to use.
	 */
	constructor(
		dependencies: {
			vaultConnector: IVaultConnector;
			faucetConnector?: IFaucetConnector;
			walletAddressEntityStorage: IEntityStorageConnector<WalletAddress>;
		},
		config?: IEntityStorageWalletConnectorConfig
	) {
		Guards.object<EntityStorageWalletConnector>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(dependencies),
			dependencies
		);
		Guards.object<IVaultConnector>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(dependencies.vaultConnector),
			dependencies.vaultConnector
		);
		Guards.object<EntityStorageWalletConnector>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(dependencies.walletAddressEntityStorage),
			dependencies.walletAddressEntityStorage
		);

		this._walletAddressEntityStorage = dependencies.walletAddressEntityStorage;
		this._vaultConnector = dependencies.vaultConnector;
		this._faucetConnector = dependencies.faucetConnector;
		this._config = config ?? {};
		this._config.coinType ??= EntityStorageWalletConnector._DEFAULT_COIN_TYPE;
		this._config.bech32Hrp ??= EntityStorageWalletConnector._DEFAULT_BECH32_HRP;
	}

	/**
	 * Create a new wallet.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async create(requestContext: IRequestContext): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		const mnemonic = Bip39.randomMnemonic();
		await this._vaultConnector.setSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME,
			mnemonic
		);
	}

	/**
	 * Get the addresses for the requested range.
	 * @param requestContext The context for the request.
	 * @param accountIndex The account index for the addresses.
	 * @param startIndex The start index for the addresses.
	 * @param endIndex The end index for the addresses.
	 * @returns The list of addresses.
	 */
	public async getAddresses(
		requestContext: IRequestContext,
		accountIndex: number,
		startIndex: number,
		endIndex: number
	): Promise<string[]> {
		Guards.object<IRequestContext>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.integer(EntityStorageWalletConnector._CLASS_NAME, nameof(accountIndex), accountIndex);
		Guards.integer(EntityStorageWalletConnector._CLASS_NAME, nameof(startIndex), startIndex);
		Guards.integer(EntityStorageWalletConnector._CLASS_NAME, nameof(endIndex), endIndex);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const keyPairs: string[] = [];

		for (let i = startIndex; i < endIndex; i++) {
			const addressKeyPair = Bip44.addressBech32(
				seed,
				KeyType.Ed25519,
				this._config.bech32Hrp ?? EntityStorageWalletConnector._DEFAULT_BECH32_HRP,
				this._config.coinType ?? EntityStorageWalletConnector._DEFAULT_COIN_TYPE,
				accountIndex,
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
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		const walletAddress = await this._walletAddressEntityStorage.get(requestContext, address);

		return Coerce.bigint(walletAddress?.balance) ?? 0n;
	}

	/**
	 * Get the storage costs for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The storage costs for the address.
	 */
	public async getStorageCosts(requestContext: IRequestContext, address: string): Promise<bigint> {
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
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

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
					// The balance has increased but is still not enough, wait and try again.
					await new Promise(resolve => setTimeout(resolve, 100));
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
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		const walletAddresses = await this._walletAddressEntityStorage.query(requestContext, {
			logicalOperator: LogicalOperator.And,
			conditions: [
				{
					property: "identity",
					operator: ComparisonOperator.Equals,
					value: requestContext.identity
				}
			]
		});

		let amountRequired = amount;
		const updates: Partial<WalletAddress>[] = [];
		for (const walletAddress of walletAddresses.entities) {
			if (Is.stringValue(walletAddress.balance)) {
				let balance = BigInt(walletAddress.balance);
				if (balance > 0) {
					const transferAmount = amountRequired < balance ? amountRequired : balance;
					balance -= transferAmount;
					amountRequired -= transferAmount;
					walletAddress.balance = balance.toString();
					updates.push(walletAddress);
				}
				if (amountRequired === 0n) {
					break;
				}
			}
		}

		if (amountRequired > 0n) {
			throw new GeneralError(EntityStorageWalletConnector._CLASS_NAME, "insufficientFunds");
		}

		for (const update of updates) {
			await this._walletAddressEntityStorage.set(requestContext, update as WalletAddress);
		}

		let destWalletAddress = await this._walletAddressEntityStorage.get(requestContext, address);

		if (Is.empty(destWalletAddress)) {
			destWalletAddress = {
				identity: "",
				balance: "0",
				address
			};
		}

		destWalletAddress.balance = (BigInt(destWalletAddress.balance) + amount).toString();

		await this._walletAddressEntityStorage.set(requestContext, destWalletAddress);
	}

	/**
	 * Sign data using a wallet based key.
	 * @param requestContext The context for the request.
	 * @param signatureType The type of signature to create.
	 * @param accountIndex The account index for the address.
	 * @param addressIndex The index for the address.
	 * @param data The data as a base64 encoded string.
	 * @returns The signature and public key base64 encoded.
	 */
	public async sign(
		requestContext: IRequestContext,
		signatureType: KeyType,
		accountIndex: number,
		addressIndex: number,
		data: string
	): Promise<{
		publicKey: string;
		signature: string;
	}> {
		Guards.object<IRequestContext>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.arrayOneOf(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(signatureType),
			signatureType,
			Object.values(KeyType)
		);
		Guards.integer(EntityStorageWalletConnector._CLASS_NAME, nameof(accountIndex), accountIndex);
		Guards.integer(EntityStorageWalletConnector._CLASS_NAME, nameof(addressIndex), addressIndex);
		Guards.stringBase64(EntityStorageWalletConnector._CLASS_NAME, nameof(data), data);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.walletMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const addressKeyPair = Bip44.addressBech32(
			seed,
			KeyType.Ed25519,
			this._config.bech32Hrp ?? EntityStorageWalletConnector._DEFAULT_BECH32_HRP,
			this._config.coinType ?? EntityStorageWalletConnector._DEFAULT_COIN_TYPE,
			accountIndex,
			false,
			addressIndex
		);

		const signature =
			signatureType === KeyType.Ed25519
				? Ed25519.sign(Converter.base64ToBytes(data), addressKeyPair.privateKey)
				: Secp256k1.sign(Converter.base64ToBytes(data), addressKeyPair.privateKey);

		return {
			publicKey: Converter.bytesToBase64(addressKeyPair.publicKey),
			signature: Converter.bytesToBase64(signature)
		};
	}
}
