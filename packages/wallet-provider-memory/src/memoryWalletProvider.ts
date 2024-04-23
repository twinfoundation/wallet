// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, Guards, Is, RandomHelper } from "@gtsc/core";
import { Bip39, Bip44, KeyType } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultProvider } from "@gtsc/vault-provider-models";
import type { IFaucetProvider, IWalletProvider } from "@gtsc/wallet-provider-models";
import type { IMemoryWalletProviderConfig } from "./models/IMemoryWalletProviderConfig";

/**
 * Class for performing wallet operations using in-memory storage.
 */
export class MemoryWalletProvider implements IWalletProvider {
	/**
	 * The namespace supported by the wallet provider.
	 */
	public static NAMESPACE: string = "mem";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<MemoryWalletProvider>();

	/**
	 * The vault for the mnemonic.
	 * @internal
	 */
	private readonly _vaultProvider: IVaultProvider;

	/**
	 * The faucet.
	 * @internal
	 */
	private readonly _faucetProvider?: IFaucetProvider;

	/**
	 * The configuration to use for provider.
	 * @internal
	 */
	private readonly _config: IMemoryWalletProviderConfig;

	/**
	 * The balance in the wallet.
	 */
	private _balance: bigint;

	/**
	 * The address for the wallet.
	 */
	private _addressBech32?: string;

	/**
	 * Create a new instance of MemoryWalletProvider.
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
		config: IMemoryWalletProviderConfig
	) {
		Guards.object<IMemoryWalletProviderConfig>(
			MemoryWalletProvider._CLASS_NAME,
			nameof(dependencies),
			dependencies
		);
		Guards.object<IMemoryWalletProviderConfig>(
			MemoryWalletProvider._CLASS_NAME,
			nameof(dependencies.vaultProvider),
			dependencies.vaultProvider
		);
		Guards.object<IMemoryWalletProviderConfig>(
			MemoryWalletProvider._CLASS_NAME,
			nameof(config),
			config
		);
		Guards.number(MemoryWalletProvider._CLASS_NAME, nameof(config.coinType), config.coinType);
		Guards.string(MemoryWalletProvider._CLASS_NAME, nameof(config.bech32Hrp), config.bech32Hrp);
		Guards.string(
			MemoryWalletProvider._CLASS_NAME,
			nameof(config.walletMnemonicId),
			config.walletMnemonicId
		);

		this._vaultProvider = dependencies.vaultProvider;
		this._faucetProvider = dependencies.faucetProvider;
		this._config = config;
		this._balance = !Is.empty(config?.balance) ? BigInt(config.balance) : 0n;
	}

	/**
	 * Bootstrap the service by creating and initializing any resources it needs.
	 * @param requestContext The request context for bootstrapping.
	 * @returns Nothing.
	 */
	public async bootstrap(requestContext: IRequestContext): Promise<void> {
		const mnemonic = await this._vaultProvider.get<string>(
			requestContext,
			this._config.walletMnemonicId
		);

		const seed = Bip39.mnemonicToSeed(mnemonic);
		const addressKeyPair = Bip44.addressBech32(
			seed,
			KeyType.Ed25519,
			this._config.bech32Hrp,
			this._config.coinType,
			0,
			false,
			0
		);
		this._addressBech32 = addressKeyPair.address;
	}

	/**
	 * Get the balance for an address in a wallet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address.
	 * @returns The balance of the wallet address.
	 */
	public async getBalance(requestContext: IRequestContext, address: string): Promise<bigint> {
		return address === this._addressBech32 ? this._balance : 0n;
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
		if (this._faucetProvider && address === this._addressBech32) {
			let retryCount = 10;
			let currentBalance = await this.getBalance(requestContext, address);

			while (currentBalance < ensureBalance && retryCount > 0) {
				const addedBalance = await this._faucetProvider.fundAddress(
					requestContext,
					address,
					timeoutInSeconds
				);
				if (addedBalance === 0n) {
					// The balance has not increased, so return.
					return false;
				}
				this._balance += addedBalance;
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
	 * @returns The block created.
	 */
	public async transfer(
		requestContext: IRequestContext,
		address: string,
		amount: bigint
	): Promise<string> {
		if (address !== this._addressBech32) {
			this._balance -= amount;
		}

		return Converter.bytesToHex(RandomHelper.generate(32));
	}
}
