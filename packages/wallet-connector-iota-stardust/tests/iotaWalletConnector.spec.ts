// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Bip44, KeyType } from "@twin.org/crypto";
import type { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import type { VaultSecret } from "@twin.org/vault-connector-entity-storage";
import { FaucetConnectorFactory } from "@twin.org/wallet-models";
import {
	TEST_ADDRESS_BECH32,
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	TEST_SEED,
	setupTestEnv
} from "./setupTestEnv";
import { IotaStardustWalletConnector } from "../src/iotaStardustWalletConnector";
import type { IIotaStardustWalletConnectorConfig } from "../src/models/IIotaStardustWalletConnectorConfig";

describe("IotaWalletConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("can fail to construct a wallet with no options", () => {
		expect(
			() =>
				new IotaStardustWalletConnector(
					undefined as unknown as { config: IIotaStardustWalletConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options", value: "undefined" }
			})
		);
	});

	test("can fail to construct a wallet with no config", () => {
		expect(
			() =>
				new IotaStardustWalletConnector(
					{} as unknown as { config: IIotaStardustWalletConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options.config", value: "undefined" }
			})
		);
	});

	test("can fail to construct a wallet with no config client options", () => {
		expect(
			() =>
				new IotaStardustWalletConnector({ config: {} } as unknown as {
					config: IIotaStardustWalletConnectorConfig;
				})
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options.config.clientOptions", value: "undefined" }
			})
		);
	});

	test("can construct a wallet with details", () => {
		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});
		expect(wallet).toBeDefined();
	});

	test("can create a new wallet", async () => {
		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});

		await wallet.create(TEST_IDENTITY_ID);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VaultSecret>>(
				"vault-secret"
			).getStore();
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_MNEMONIC_NAME}`);
		expect((store?.[0].data as string).split(" ").length).toEqual(24);
	});

	test("can generate addresses for the wallet", async () => {
		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});

		await wallet.create(TEST_IDENTITY_ID);

		const testAddresses = await wallet.getAddresses(TEST_IDENTITY_ID, 0, 0, 10);
		expect(testAddresses.length).toEqual(10);
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const faucet = FaucetConnectorFactory.get("faucet");
		FaucetConnectorFactory.unregister("faucet");
		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});

		const ensured = await wallet.ensureBalance(TEST_IDENTITY_ID, TEST_ADDRESS_BECH32, 1000000000n);
		expect(ensured).toBeFalsy();
		FaucetConnectorFactory.register("faucet", () => faucet);
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

		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});

		const ensured = await wallet.ensureBalance(
			TEST_IDENTITY_ID,
			addressKeyPair.address,
			1000000000n
		);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const wallet = new IotaStardustWalletConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				bech32Hrp: TEST_BECH32_HRP
			}
		});

		const balance = await wallet.getBalance(TEST_IDENTITY_ID, TEST_ADDRESS_BECH32);

		expect(balance).toBeGreaterThan(0n);
	});
});
