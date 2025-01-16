// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { FaucetConnectorFactory } from "@twin.org/wallet-models";
import {
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	TEST_NETWORK
} from "./setupTestEnv";
import { IotaRebasedWalletConnector } from "../src/iotaRebasedWalletConnector";
import type { IIotaRebasedWalletConnectorConfig } from "../src/models/IIotaRebasedWalletConnectorConfig";

describe("IotaRebasedWalletConnector", () => {
	let wallet: IotaRebasedWalletConnector;

	beforeEach(async () => {
		// Unregister existing connectors
		EntityStorageConnectorFactory.unregister("vault-secret");
		EntityStorageConnectorFactory.unregister("vault-key");
		VaultConnectorFactory.unregister("vault");

		// Re-register fresh connectors
		EntityStorageConnectorFactory.register(
			"vault-key",
			() =>
				new MemoryEntityStorageConnector<VaultKey>({
					entitySchema: nameof<VaultKey>()
				})
		);

		const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof<VaultSecret>()
		});
		EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

		VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());

		// Create a new wallet for each test
		wallet = new IotaRebasedWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				vaultSeedId: "test-seed",
				coinType: TEST_COIN_TYPE
			}
		});

		await wallet.create(TEST_IDENTITY_ID);
	});

	test("can fail to construct a wallet with no options", () => {
		expect(
			() =>
				new IotaRebasedWalletConnector(
					undefined as unknown as { config: IIotaRebasedWalletConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "options",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no config", () => {
		expect(
			() =>
				new IotaRebasedWalletConnector(
					{} as unknown as { config: IIotaRebasedWalletConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "options.config",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a wallet with details", () => {
		wallet = new IotaRebasedWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				network: TEST_NETWORK,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				vaultSeedId: "test-seed",
				coinType: TEST_COIN_TYPE
			}
		});
		expect(wallet).toBeDefined();
	});

	describe("create", () => {
		test("can create a new wallet", async () => {
			const store =
				EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VaultSecret>>(
					"vault-secret"
				).getStore();
			expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_MNEMONIC_NAME}`);
			expect((store?.[0].data as string).split(" ").length).toEqual(24);
		});

		test("stores both mnemonic and seed in vault", async () => {
			const store =
				EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VaultSecret>>(
					"vault-secret"
				).getStore();

			const mnemonicEntry = store?.find(s => s.id === `${TEST_IDENTITY_ID}/${TEST_MNEMONIC_NAME}`);
			const seedEntry = store?.find(s => s.id === `${TEST_IDENTITY_ID}/test-seed`);

			expect(mnemonicEntry).toBeDefined();
			expect(seedEntry).toBeDefined();
			expect((mnemonicEntry?.data as string).split(" ").length).toEqual(24);
		});
	});

	test("generates a single address by default", async () => {
		const addresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1);
		expect(addresses).toHaveLength(1);
		expect(addresses[0]).toBeDefined();
		expect(typeof addresses[0]).toBe("string");
	});

	test("generates multiple addresses with count parameter", async () => {
		const count = 3;
		const addresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, count);
		expect(addresses).toHaveLength(count);
		// Ensure all addresses are unique
		const uniqueAddresses = new Set(addresses);
		expect(uniqueAddresses.size).toBe(count);
	});

	test("generates different addresses for different address indices", async () => {
		const addresses1 = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1);
		const addresses2 = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 1, 1);

		const address1 = addresses1[0];
		const address2 = addresses2[0];

		expect(address1).not.toBe(address2);
	});

	test("generates different addresses for internal vs external", async () => {
		const externalAddresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1, false);
		const internalAddresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1, true);

		expect(externalAddresses[0]).not.toBe(internalAddresses[0]);
	});

	test("generates consistent addresses for same parameters", async () => {
		const addresses1 = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 2);
		const addresses2 = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 2);
		expect(addresses1).toEqual(addresses2);
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		// Unregister the faucet before creating the wallet
		const faucet = FaucetConnectorFactory.get("faucet");
		FaucetConnectorFactory.unregister("faucet");

		// Reconstruct the wallet after faucet is unregistered
		wallet = new IotaRebasedWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				network: TEST_NETWORK,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				vaultSeedId: "test-seed",
				coinType: TEST_COIN_TYPE
			}
		});
		await wallet.create(TEST_IDENTITY_ID);

		const addresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1);
		const address = addresses[0];

		const ensured = await wallet.ensureBalance(TEST_IDENTITY_ID, address, 1000000000n);
		expect(ensured).toBeFalsy();

		// Re-register the faucet for other tests
		FaucetConnectorFactory.register("faucet", () => faucet);
	});

	test("can ensure a balance on an address", async () => {
		const addresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1);
		const address = addresses[0];

		const ensured = await wallet.ensureBalance(TEST_IDENTITY_ID, address, 1000000000n);
		expect(ensured).toBeTruthy();

		const balance = await wallet.getBalance(TEST_IDENTITY_ID, address);
		expect(balance).toBeGreaterThanOrEqual(1000000000n);
	});

	test("can get a balance for an address", async () => {
		const addresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 1);
		const address = addresses[0];

		// Ensure the address has some balance
		await wallet.ensureBalance(TEST_IDENTITY_ID, address, 1000000000n);

		const balance = await wallet.getBalance(TEST_IDENTITY_ID, address);
		expect(balance).toBeGreaterThan(0n);
	});
});
