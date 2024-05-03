// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Coerce, GeneralError, Guards, Is } from "@gtsc/core";
import { ComparisonOperator, LogicalOperator } from "@gtsc/entity";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IFaucetConnector, IWalletConnector } from "@gtsc/wallet-models";
import type { IWalletAddress } from "./models/IWalletAddress";

/**
 * Class for performing wallet operations using in-memory storage.
 */
export class EntityStorageWalletConnector implements IWalletConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<EntityStorageWalletConnector>();

	/**
	 * The faucet.
	 * @internal
	 */
	private readonly _faucetConnector?: IFaucetConnector;

	/**
	 * The entity storage for wallets.
	 * @internal
	 */
	private readonly _walletAddressEntityStorage: IEntityStorageConnector<IWalletAddress>;

	/**
	 * Create a new instance of EntityStorageWalletConnector.
	 * @param dependencies The dependencies for the wallet connector.
	 * @param dependencies.faucetConnector Optional faucet for requesting funds.
	 * @param dependencies.walletAddressEntityStorage The entity storage for wallets.
	 */
	constructor(dependencies: {
		faucetConnector?: IFaucetConnector;
		walletAddressEntityStorage: IEntityStorageConnector<IWalletAddress>;
	}) {
		Guards.object<EntityStorageWalletConnector>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(dependencies),
			dependencies
		);
		Guards.object<EntityStorageWalletConnector>(
			EntityStorageWalletConnector._CLASS_NAME,
			nameof(dependencies.walletAddressEntityStorage),
			dependencies.walletAddressEntityStorage
		);

		this._walletAddressEntityStorage = dependencies.walletAddressEntityStorage;
		this._faucetConnector = dependencies.faucetConnector;
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
		const updates: Partial<IWalletAddress>[] = [];
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
			await this._walletAddressEntityStorage.set(requestContext, update as IWalletAddress);
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
}
