// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { VaultSecret } from "@gtsc/vault-connector-entity-storage";
import { FaucetConnectorFactory } from "@gtsc/wallet-models";
import { TEST_CONTEXT, TEST_IDENTITY_ID, TEST_IDENTITY_ID_2, TEST_TENANT_ID } from "./setupTestEnv";
import { WalletAddress } from "../src/entities/walletAddress";
import { EntityStorageFaucetConnector } from "../src/entityStorageFaucetConnector";
import { EntityStorageWalletConnector } from "../src/entityStorageWalletConnector";

let walletAddressEntityStorage: MemoryEntityStorageConnector<WalletAddress>;
let faucetConnector: EntityStorageFaucetConnector;

let testAddresses: string[] = [];

describe("EntityStorageWalletConnector", () => {
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
		faucetConnector = new EntityStorageFaucetConnector();
		FaucetConnectorFactory.register("faucet", () => faucetConnector);
	});

	afterEach(() => {
		EntityStorageConnectorFactory.unregister("wallet-address");
	});

	test("can construct a wallet", () => {
		const faucet = new EntityStorageWalletConnector();
		expect(faucet).toBeDefined();
	});

	test("can create a new wallet", async () => {
		const wallet = new EntityStorageWalletConnector();

		await wallet.create(TEST_CONTEXT);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VaultSecret>>(
				"vault-secret"
			).getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/wallet-mnemonic`);
		expect(JSON.parse(store?.[0].data ?? "").split(" ").length).toEqual(24);
	});

	test("can generate addresses for the wallet", async () => {
		const wallet = new EntityStorageWalletConnector();

		testAddresses = await wallet.getAddresses(TEST_CONTEXT, 0, 10);
		expect(testAddresses.length).toEqual(10);
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		FaucetConnectorFactory.unregister("faucet");
		const wallet = new EntityStorageWalletConnector();

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can fail to ensure a balance with faucet depleted", async () => {
		FaucetConnectorFactory.register("faucet", () => ({
			fundAddress: async (): Promise<bigint> => 0n
		}));
		const wallet = new EntityStorageWalletConnector();

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address with retries", async () => {
		const wallet = new EntityStorageWalletConnector();

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 2000000000n);

		expect(ensured).toBeTruthy();

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("2000000000");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new EntityStorageWalletConnector();

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);

		expect(ensured).toBeTruthy();

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("1000000000");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);
	});

	test("can get a balance for an address", async () => {
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[0],
			identity: TEST_IDENTITY_ID,
			balance: "1000000000"
		});

		const wallet = new EntityStorageWalletConnector();

		const balance = await wallet.getBalance(TEST_CONTEXT, testAddresses[0]);

		expect(balance).toEqual(1000000000n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new EntityStorageWalletConnector();

		const storageCosts = await wallet.getStorageCosts(TEST_CONTEXT, testAddresses[0]);

		expect(storageCosts).toEqual(0n);
	});

	test("can fail to transfer with insufficient funds", async () => {
		const wallet = new EntityStorageWalletConnector();

		await expect(wallet.transfer(TEST_CONTEXT, "addr1", "addr2", 100n)).rejects.toMatchObject({
			name: "GeneralError",
			message: "entityStorageWalletConnector.insufficientFunds"
		});
	});

	test("can transfer to another address that does not exist", async () => {
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[0],
			identity: TEST_IDENTITY_ID,
			balance: "1"
		});
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[1],
			identity: TEST_IDENTITY_ID,
			balance: "1000000000"
		});

		const wallet = new EntityStorageWalletConnector();

		await wallet.transfer(TEST_CONTEXT, testAddresses[1], testAddresses[2], 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("1");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual(testAddresses[1]);
		expect(store?.[1].balance).toEqual("999999900");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual(testAddresses[2]);
		expect(store?.[2].balance).toEqual("100");
		expect(store?.[2].identity).toEqual("");
	});

	test("can transfer to another address that exists", async () => {
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[0],
			identity: TEST_IDENTITY_ID,
			balance: "1"
		});
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[1],
			identity: TEST_IDENTITY_ID,
			balance: "1000000000"
		});
		await walletAddressEntityStorage.set(TEST_CONTEXT, {
			address: testAddresses[2],
			identity: TEST_IDENTITY_ID_2,
			balance: "500"
		});

		const wallet = new EntityStorageWalletConnector();

		await wallet.transfer(TEST_CONTEXT, testAddresses[1], testAddresses[2], 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("1");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual(testAddresses[1]);
		expect(store?.[1].balance).toEqual("999999900");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual(testAddresses[2]);
		expect(store?.[2].balance).toEqual("600");
		expect(store?.[2].identity).toEqual("test-identity-2");
	});
});
