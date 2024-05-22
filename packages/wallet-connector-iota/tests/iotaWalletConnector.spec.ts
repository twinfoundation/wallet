// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Bip44, KeyType } from "@gtsc/crypto";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import {
	EntityStorageVaultConnector,
	VaultKey,
	VaultSecret
} from "@gtsc/vault-connector-entity-storage";
import type { IVaultConnector } from "@gtsc/vault-models";
import {
	TEST_ADDRESS_BECH32,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_CONTEXT,
	TEST_BECH32_HRP,
	TEST_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	TEST_SEED,
	TEST_TENANT_ID,
	TEST_VAULT,
	setupTestEnv
} from "./setupTestEnv";
import { IotaFaucetConnector } from "../src/iotaFaucetConnector";
import { IotaWalletConnector } from "../src/iotaWalletConnector";
import type { IIotaWalletConnectorConfig } from "../src/models/IIotaWalletConnectorConfig";

describe("IotaWalletConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("can fail to construct a wallet with no dependencies", () => {
		expect(
			() =>
				new IotaWalletConnector(
					undefined as unknown as { vaultConnector: IVaultConnector },
					undefined as unknown as IIotaWalletConnectorConfig
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

	test("can fail to construct a wallet with no vault", () => {
		expect(
			() =>
				new IotaWalletConnector(
					{ vaultConnector: undefined as unknown as IVaultConnector },
					undefined as unknown as IIotaWalletConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies.vaultConnector",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no config", () => {
		expect(
			() =>
				new IotaWalletConnector(
					{ vaultConnector: {} as unknown as IVaultConnector },
					undefined as unknown as IIotaWalletConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "config",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no config client options", () => {
		expect(
			() =>
				new IotaWalletConnector(
					{ vaultConnector: {} as unknown as IVaultConnector },
					{} as unknown as IIotaWalletConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "config.clientOptions",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a wallet with details", () => {
		const faucet = new IotaWalletConnector(
			{
				vaultConnector: TEST_VAULT
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);
		expect(faucet).toBeDefined();
	});

	test("can create a new wallet", async () => {
		const vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<VaultSecret>(
			EntitySchemaHelper.getSchema(VaultSecret)
		);

		const wallet = new IotaWalletConnector(
			{
				vaultConnector: new EntityStorageVaultConnector({
					vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<VaultKey>(
						EntitySchemaHelper.getSchema(VaultKey)
					),
					vaultSecretEntityStorageConnector
				})
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);

		await wallet.create(TEST_CONTEXT);

		const store = vaultSecretEntityStorageConnector.getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_MNEMONIC_NAME}`);
		expect(JSON.parse(store?.[0].data ?? "").split(" ").length).toEqual(24);
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new IotaWalletConnector(
			{
				vaultConnector: TEST_VAULT
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32, 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address", async () => {
		// Use a random address which has not yet been used
		const addressKeyPair = Bip44.addressBech32(
			TEST_SEED,
			KeyType.Ed25519,
			TEST_BECH32_HRP,
			TEST_COIN_TYPE,
			0,
			false,
			Math.floor(Math.random() * 100000000) + 1000
		);

		const wallet = new IotaWalletConnector(
			{
				vaultConnector: TEST_VAULT,
				faucetConnector: new IotaFaucetConnector({
					clientOptions: TEST_CLIENT_OPTIONS,
					endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
				})
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, addressKeyPair.address, 1000000000n);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const wallet = new IotaWalletConnector(
			{
				vaultConnector: TEST_VAULT
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);

		const balance = await wallet.getBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32);

		expect(balance).toBeGreaterThan(0n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new IotaWalletConnector(
			{
				vaultConnector: TEST_VAULT
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_NAME
			}
		);

		const storageCosts = await wallet.getStorageCosts(TEST_CONTEXT, TEST_ADDRESS_BECH32);

		expect(storageCosts).toBeGreaterThan(0);
	});
});
