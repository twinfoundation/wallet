// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageFaucetConnector } from "../src/entityStorageFaucetConnector";
import type { IWalletAddress } from "../src/models/IWalletAddress";
import { WalletAddressDescriptor } from "../src/models/walletAddressDescriptor";

const TEST_TENANT_ID = "test-tenant";
const TEST_IDENTITY_ID = "test-identity";

let walletAddressEntityStorage: MemoryEntityStorageConnector<IWalletAddress>;

describe("EntityStorageFaucetConnector", () => {
	beforeEach(() => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor
		);
	});

	test("can construct a faucet with details", () => {
		const faucet = new EntityStorageFaucetConnector({
			walletAddressEntityStorage
		});
		expect(faucet).toBeDefined();
	});

	test("can fund a non existent address from the faucet", async () => {
		const faucet = new EntityStorageFaucetConnector({
			walletAddressEntityStorage
		});

		const amountAdded = await faucet.fundAddress(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1"
		);

		expect(amountAdded).toBeGreaterThan(0);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual("addr1");
		expect(store?.[0].balance).toEqual("1000000000");
	});

	test("can fund an existing address from the faucet", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: "addr1",
							identity: TEST_IDENTITY_ID,
							balance: "1000"
						}
					]
				}
			}
		);

		const faucet = new EntityStorageFaucetConnector({
			walletAddressEntityStorage
		});

		const amountAdded = await faucet.fundAddress(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1"
		);

		expect(amountAdded).toBeGreaterThan(0);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual("addr1");
		expect(store?.[0].balance).toEqual("1000001000");
	});
});