// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import type { IFaucetConnector } from "@gtsc/wallet-models";
import { EntityStorageFaucetConnector } from "../src/entityStorageFaucetConnector";
import { EntityStorageWalletConnector } from "../src/entityStorageWalletConnector";
import type { IWalletAddress } from "../src/models/IWalletAddress";
import { WalletAddressDescriptor } from "../src/models/walletAddressDescriptor";

const TEST_TENANT_ID = "test-tenant";
const TEST_IDENTITY_ID = "test-identity";

let walletAddressEntityStorage: MemoryEntityStorageConnector<IWalletAddress>;
let faucetConnector: EntityStorageFaucetConnector;

describe("EntityStorageWalletConnector", () => {
	beforeEach(() => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor
		);
		faucetConnector = new EntityStorageFaucetConnector({ walletAddressEntityStorage });
	});

	test("can fail to construct a wallet with no dependencies", () => {
		expect(
			() =>
				new EntityStorageWalletConnector(
					undefined as unknown as {
						faucetConnector?: IFaucetConnector;
						walletAddressEntityStorage: IEntityStorageConnector<IWalletAddress>;
					}
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
			faucetConnector
		});
		expect(faucet).toBeDefined();
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage
		});

		const ensured = await wallet.ensureBalance(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1",
			1000000000n
		);
		expect(ensured).toBeFalsy();
	});

	test("can fail to ensure a balance with faucet depleted", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector: {
				fundAddress: async (): Promise<bigint> => 0n
			}
		});

		const ensured = await wallet.ensureBalance(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1",
			1000000000n
		);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address with retries", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		const ensured = await wallet.ensureBalance(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1",
			2000000000n
		);

		expect(ensured).toBeTruthy();
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		const ensured = await wallet.ensureBalance(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1",
			1000000000n
		);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: "addr1",
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		const balance = await wallet.getBalance(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1"
		);

		expect(balance).toEqual(1000000000n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		const storageCosts = await wallet.getStorageCosts(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			"addr1"
		);

		expect(storageCosts).toEqual(0n);
	});

	test("can fail to transfer with insufficient funds", async () => {
		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		await expect(
			wallet.transfer({ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID }, "addr2", 100n)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "entityStorageWalletConnector.insufficientFunds"
		});
	});

	test("can transfer to another address that does not exist", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: "addr1",
							identity: TEST_IDENTITY_ID,
							balance: "1"
						},
						{
							address: "addr2",
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		await wallet.transfer({ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID }, "addr3", 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual("addr1");
		expect(store?.[0].balance).toEqual("0");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual("addr2");
		expect(store?.[1].balance).toEqual("999999901");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual("addr3");
		expect(store?.[2].balance).toEqual("100");
		expect(store?.[2].identity).toEqual("");
	});

	test("can transfer to another address that exists", async () => {
		walletAddressEntityStorage = new MemoryEntityStorageConnector<IWalletAddress>(
			WalletAddressDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							address: "addr1",
							identity: TEST_IDENTITY_ID,
							balance: "1"
						},
						{
							address: "addr2",
							identity: TEST_IDENTITY_ID,
							balance: "1000000000"
						},
						{
							address: "addr3",
							identity: "test-identity-2",
							balance: "0"
						}
					]
				}
			}
		);

		const wallet = new EntityStorageWalletConnector({
			walletAddressEntityStorage,
			faucetConnector
		});

		await wallet.transfer({ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID }, "addr3", 100n);

		const store = walletAddressEntityStorage.getStore(TEST_TENANT_ID);

		expect(store?.[0].address).toEqual("addr1");
		expect(store?.[0].balance).toEqual("0");
		expect(store?.[0].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[1].address).toEqual("addr2");
		expect(store?.[1].balance).toEqual("999999901");
		expect(store?.[1].identity).toEqual(TEST_IDENTITY_ID);

		expect(store?.[2].address).toEqual("addr3");
		expect(store?.[2].balance).toEqual("100");
		expect(store?.[2].identity).toEqual("test-identity-2");
	});
});
