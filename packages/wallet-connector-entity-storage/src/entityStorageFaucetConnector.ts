// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Coerce, Guards, Is } from "@gtsc/core";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IFaucetConnector } from "@gtsc/wallet-models";
import type { WalletAddress } from "./entities/walletAddress";

/**
 * Class for performing faucet operations using entity storage.
 */
export class EntityStorageFaucetConnector implements IFaucetConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<EntityStorageFaucetConnector>();

	/**
	 * The entity storage for wallets.
	 * @internal
	 */
	private readonly _walletAddressEntityStorage: IEntityStorageConnector<WalletAddress>;

	/**
	 * Create a new instance of EntityStorageFaucetConnector.
	 * @param options The options for the wallet connector.
	 * @param options.walletAddressEntityStorageType The entity storage type for wallet addresses, defaults to "wallet-address".
	 */
	constructor(options?: { walletAddressEntityStorageType?: string }) {
		this._walletAddressEntityStorage = EntityStorageConnectorFactory.get(
			options?.walletAddressEntityStorageType ?? "wallet-address"
		);
	}

	/**
	 * Fund the wallet from the faucet.
	 * @param requestContext The context for the request.
	 * @param address The bech32 encoded address of the address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount added to the address by the faucet.
	 */
	public async fundAddress(
		requestContext: IRequestContext,
		address: string,
		timeoutInSeconds: number = 60
	): Promise<bigint> {
		Guards.object<IRequestContext>(
			EntityStorageFaucetConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageFaucetConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageFaucetConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);

		let walletAddress = await this._walletAddressEntityStorage.get(requestContext, address);
		if (Is.empty(walletAddress)) {
			walletAddress = {
				identity: requestContext.identity,
				balance: "0",
				address
			};
		}

		const maxFundAmount = 1000000000n;
		const balance = Coerce.bigint(walletAddress.balance) ?? 0n;
		walletAddress.balance = (balance + maxFundAmount).toString();

		await this._walletAddressEntityStorage.set(requestContext, walletAddress);

		return maxFundAmount;
	}
}
