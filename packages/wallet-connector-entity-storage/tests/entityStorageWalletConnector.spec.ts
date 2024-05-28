// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import type { IVaultConnector } from "@gtsc/vault-models";
import type { IFaucetConnector } from "@gtsc/wallet-models";
import {
	TEST_CONTEXT,
	TEST_IDENTITY_ID,
	TEST_TENANT_ID,
	TEST_VAULT,
	TEST_VAULT_ENTITY_STORAGE
} from "./setupTestEnv";
import { WalletAddress } from "../src/entities/walletAddress";
import { EntityStorageFaucetConnector } from "../src/entityStorageFaucetConnector";
import { EntityStorageWalletConnector } from "../src/entityStorageWalletConnector";
import type { IEntityStorageWalletConnectorConfig } from "../src/models/IEntityStorageWalletConnectorConfig";

let walletAddressEntityStorage: MemoryEntityStorageConnector<WalletAddress>;
let faucetConnector: EntityStorageFaucetConnector;

const walletAddressSchema = EntitySchemaHelper.getSchema(WalletAddress);
let testAddresses: string[] = [];

describe("EntityStorageWalletConnector", () => {
	beforeEach(() => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>(
			walletAddressSchema
		);
		faucetConnector = new EntityStorageFaucetConnector({ walletAddressEntityStorage });
	});

	test("can fail to construct a wallet with no dependencies", () => {
		expect(
			() =>
				new EntityStorageWalletConnector(
					undefined as unknown as {
						vaultConnector: IVaultConnector;
						faucetConnector?: IFaucetConnector;
						walletAddressEntityStorage: IEntityStorageConnector<WalletAddress>;
					},
					{} as IEntityStorageWalletConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a wallet with details", () => {
		const faucet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});
		expect(faucet).toBeDefined();
	});

	test("can create a new wallet", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT
		});

		await wallet.create(TEST_CONTEXT);

		const store = TEST_VAULT_ENTITY_STORAGE.getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/wallet-mnemonic`);
		expect(JSON.parse(store?.[0].data ?? "").split(" ").length).toEqual(24);
	});

	test("can generate addresses for the wallet", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT
		});

		testAddresses = await wallet.getAddresses(TEST_CONTEXT, 0, 0, 10);
		expect(testAddresses.length).toEqual(10);
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT
		});

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can fail to ensure a balance with faucet depleted", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector: {
				fundAddress: async (): Promise<bigint> => 0n
			}
		});

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address with retries", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 2000000000n);

		expect(ensured).toBeTruthy();

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("2000000000");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, testAddresses[0], 1000000000n);

		expect(ensured).toBeTruthy();

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);
		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("1000000000");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);
	});

	test("can get a balance for an address", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>(
			walletAddressSchema,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: testAddresses[0],
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		const balance = await wallet.getBalance(TEST_CONTEXT, testAddresses[0]);

		expect(balance).toEqual(1000000000n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		const storageCosts = await wallet.getStorageCosts(TEST_CONTEXT, testAddresses[0]);

		expect(storageCosts).toEqual(0n);
	});

	test("can fail to transfer with insufficient funds", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		await expect(wallet.transfer(TEST_CONTEXT, "addr2", 100n)).rejects.toMatchObject({
			name: "GeneralError",
			message: "entityStorageWalletConnector.insufficientFunds"
		});
	});

	test("can transfer to another address that does not exist", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>(
			walletAddressSchema,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: testAddresses[0],
							identity: TEST_IDENTITY_ID,
							balance: "1"
						},
						{
							address: testAddresses[1],
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		await wallet.transfer(TEST_CONTEXT, testAddresses[2], 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("0");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual(testAddresses[1]);
		expect(store?.[1].balance).toEqual("999999901");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual(testAddresses[2]);
		expect(store?.[2].balance).toEqual("100");
		expect(store?.[2].identity).toEqual("");
	});

	test("can transfer to another address that exists", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>(
			walletAddressSchema,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: testAddresses[0],
							identity: TEST_IDENTITY_ID,
							balance: "1"
						},
						{
							address: testAddresses[1],
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						},
						{
							address: testAddresses[2],
							identity: "test-identity-2",
							balance: "0"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			vaultConnector: TEST_VAULT,
			faucetConnector
		});

		await wallet.transfer(TEST_CONTEXT, testAddresses[2], 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual(testAddresses[0]);
		expect(store?.[0].balance).toEqual("0");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual(testAddresses[1]);
		expect(store?.[1].balance).toEqual("999999901");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual(testAddresses[2]);
		expect(store?.[2].balance).toEqual("100");
		expect(store?.[2].identity).toEqual("test-identity-2");
	});
});
