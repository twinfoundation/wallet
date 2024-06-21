// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import { TEST_CONTEXT } from "./setupTestEnv";
import { WalletAddress } from "../src/entities/walletAddress";
import { EntityStorageFaucetConnector } from "../src/entityStorageFaucetConnector";

const TEST_TENANT_ID = "test-tenant";
const TEST_IDENTITY_ID = "test-identity";

let walletAddressEntityStorage: MemoryEntityStorageConnector<WalletAddress>;

describe("EntityStorageFaucetConnector", () => {
	beforeAll(() => {
		EntitySchemaFactory.register(nameof(WalletAddress), () =>
			EntitySchemaHelper.getSchema(WalletAddress)
		);
	});

	beforeEach(() => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>({
			entitySchema: nameof<WalletAddress>()
		});
		EntityStorageConnectorFactory.register("wallet-address", () => walletAddressEntityStorage);
	});

	afterEach(() => {
		EntityStorageConnectorFactory.unregister("wallet-address");
	});

	test("can construct a faucet with details", () => {
		const faucet = new EntityStorageFaucetConnector();
		expect(faucet).toBeDefined();
	});

	test("can fund a non existent address from the faucet", async () => {
		const faucet = new EntityStorageFaucetConnector();

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
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: "addr1",
			identity: TEST_IDENTITY_ID,
			balance: "1000"
		});

		const faucet = new EntityStorageFaucetConnector();

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
