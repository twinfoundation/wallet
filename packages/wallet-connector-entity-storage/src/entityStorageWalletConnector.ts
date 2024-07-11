// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Coerce, GeneralError, Guards, Is } from "@gtsc/core";
import { Bip39, Bip44, Ed25519, KeyType, Secp256k1 } from "@gtsc/crypto";
import { ComparisonOperator, LogicalOperator } from "@gtsc/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import { VaultConnectorFactory, type IVaultConnector } from "@gtsc/vault-models";
import {
	FaucetConnectorFactory,
	type IFaucetConnector,
	type IWalletConnector
} from "@gtsc/wallet-models";
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
	 */
	public readonly CLASS_NAME: string = nameof<EntityStorageWalletConnector>();

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
	 * @param options The options for the wallet connector.
	 * @param options.vaultConnectorType Vault connector to use for wallet secrets, defaults to "vault".
	 * @param options.faucetConnectorType Optional faucet for requesting funds, defaults to "faucet".
	 * @param options.walletAddressEntityStorageType The entity storage for wallets, defaults to "wallet-address".
	 * @param options.config The configuration to use.
	 */
	constructor(options?: {
		vaultConnectorType?: string;
		faucetConnectorType?: string;
		walletAddressEntityStorageType?: string;
		config?: IEntityStorageWalletConnectorConfig;
	}) {
		this._vaultConnector = VaultConnectorFactory.get(options?.vaultConnectorType ?? "vault");
		this._faucetConnector = FaucetConnectorFactory.getIfExists(
			options?.faucetConnectorType ?? "faucet"
		);
		this._walletAddressEntityStorage = EntityStorageConnectorFactory.get(
			options?.walletAddressEntityStorageType ?? "wallet-address"
		);
		this._config = options?.config ?? {};
		this._config.coinType ??= EntityStorageWalletConnector._DEFAULT_COIN_TYPE;
		this._config.bech32Hrp ??= EntityStorageWalletConnector._DEFAULT_BECH32_HRP;
	}

	/**
	 * Create a new wallet.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async create(requestContext: IRequestContext): Promise<void> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);

		const mnemonic = Bip39.randomMnemonic();
		await this._vaultConnector.setSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME,
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.integer(this.CLASS_NAME, nameof(startAddressIndex), startAddressIndex);
		Guards.integer(this.CLASS_NAME, nameof(count), count);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const keyPairs: string[] = [];

		for (let i = startAddressIndex; i < startAddressIndex + count; i++) {
			const addressKeyPair = Bip44.addressBech32(
				seed,
				KeyType.Ed25519,
				this._config.bech32Hrp ?? EntityStorageWalletConnector._DEFAULT_BECH32_HRP,
				this._config.coinType ?? EntityStorageWalletConnector._DEFAULT_COIN_TYPE,
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);

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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);

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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(addressSource), addressSource);
		Guards.stringValue(this.CLASS_NAME, nameof(addressDest), addressDest);
		Guards.bigint(this.CLASS_NAME, nameof(amount), amount);

		const walletAddresses = await this._walletAddressEntityStorage.query(requestContext, {
			logicalOperator: LogicalOperator.And,
			conditions: [
				{
					property: "identity",
					operator: ComparisonOperator.Equals,
					value: requestContext.identity
				},
				{
					property: "address",
					operator: ComparisonOperator.Equals,
					value: addressSource
				}
			]
		});

		let walletAddress: WalletAddress | undefined;
		let balance = 0n;
		if (walletAddresses.entities.length > 0) {
			walletAddress = walletAddresses.entities[0] as WalletAddress;
			balance = BigInt(walletAddress.balance);
			walletAddress.balance = (BigInt(walletAddress.balance) - amount).toString();
		}

		if (balance < amount) {
			throw new GeneralError(this.CLASS_NAME, "insufficientFunds");
		}

		if (!Is.empty(walletAddress)) {
			await this._walletAddressEntityStorage.set(requestContext, walletAddress);

			let destWalletAddress = await this._walletAddressEntityStorage.get(
				requestContext,
				addressDest
			);

			if (Is.empty(destWalletAddress)) {
				destWalletAddress = {
					identity: "",
					balance: "0",
					address: addressDest
				};
			}

			destWalletAddress.balance = (BigInt(destWalletAddress.balance) + amount).toString();

			await this._walletAddressEntityStorage.set(requestContext, destWalletAddress);
		}

		return undefined;
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.arrayOneOf(
			this.CLASS_NAME,
			nameof(signatureType),
			signatureType,
			Object.values(KeyType)
		);
		Guards.integer(this.CLASS_NAME, nameof(addressIndex), addressIndex);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? EntityStorageWalletConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);

		const addressKeyPair = Bip44.addressBech32(
			seed,
			signatureType,
			this._config.bech32Hrp ?? EntityStorageWalletConnector._DEFAULT_BECH32_HRP,
			this._config.coinType ?? EntityStorageWalletConnector._DEFAULT_COIN_TYPE,
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
}
