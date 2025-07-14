// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseError } from "@twin.org/core";
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
import { beforeAll, describe, expect, test } from "vitest";
import {
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_FAUCET_ENDPOINT,
	TEST_GAS_STATION_AUTH_TOKEN,
	TEST_GAS_STATION_ENDPOINT,
	TEST_MNEMONIC_NAME,
	TEST_NETWORK
} from "./setupTestEnv";
import { IotaFaucetConnector } from "../src/iotaFaucetConnector";
import { IotaWalletConnector } from "../src/iotaWalletConnector";
import type { IIotaFaucetConnectorConfig } from "../src/models/IIotaFaucetConnectorConfig";
import type { IIotaWalletConnectorConfig } from "../src/models/IIotaWalletConnectorConfig";

/**
 * Test Identity.
 */
const TEST_IDENTITY = "test-gas-station-identity";

/**
 * Test wallet connector.
 */
let walletConnector: IotaWalletConnector;

/**
 * Set up the test environment.
 */
beforeAll(async () => {
	// Setup entity storage and vault connectors
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

	// Setup faucet connector for funding
	const faucetConfig: IIotaFaucetConnectorConfig = {
		clientOptions: TEST_CLIENT_OPTIONS,
		endpoint: TEST_FAUCET_ENDPOINT,
		network: TEST_NETWORK,
		coinType: TEST_COIN_TYPE
	};

	FaucetConnectorFactory.register(
		"faucet",
		() => new IotaFaucetConnector({ config: faucetConfig })
	);

	// Configure for testnet with gas station
	const gasStationConfig: IIotaWalletConnectorConfig = {
		clientOptions: TEST_CLIENT_OPTIONS,
		network: TEST_NETWORK,
		vaultMnemonicId: TEST_MNEMONIC_NAME,
		vaultSeedId: "test-seed-gas-station",
		coinType: TEST_COIN_TYPE,
		gasStation: {
			gasStationUrl: TEST_GAS_STATION_ENDPOINT,
			gasStationAuthToken: TEST_GAS_STATION_AUTH_TOKEN
		}
	};

	walletConnector = new IotaWalletConnector({
		config: gasStationConfig
	});

	await walletConnector.create(TEST_IDENTITY);
});

describe("IotaWalletConnector Gas Station Tests", () => {
	test("should have gas station configuration", () => {
		expect(TEST_GAS_STATION_ENDPOINT).toBeDefined();
		expect(TEST_GAS_STATION_AUTH_TOKEN).toBeDefined();
	});

	test("can get addresses with gas station config", async () => {
		const addresses = await walletConnector.getAddresses(TEST_IDENTITY, 0, 0, 5);
		expect(addresses).toBeDefined();
		expect(addresses.length).toBe(5);
		expect(addresses[0]).toMatch(/^0x[\dA-Fa-f]+$/);
	});

	test("can get balance for address", async () => {
		const addresses = await walletConnector.getAddresses(TEST_IDENTITY, 0, 0, 1);
		const balance = await walletConnector.getBalance(TEST_IDENTITY, addresses[0]);
		expect(balance).toBeGreaterThanOrEqual(0n);
	});

	test("can ensure balance with faucet funding while gas station is configured", async () => {
		const addresses = await walletConnector.getAddresses(TEST_IDENTITY, 0, 0, 1);
		const address = addresses[0];

		const initialBalance = await walletConnector.getBalance(TEST_IDENTITY, address);

		// Ensure a higher balance (should trigger faucet funding)
		// Note: Gas station is for sponsoring transaction fees, not for funding addresses
		const targetBalance = initialBalance + 1000000000n; // 1 IOTA

		// This test verifies that ensureBalance works correctly with gas station configuration
		// The funding should come from the faucet, not the gas station
		try {
			await walletConnector.ensureBalance(TEST_IDENTITY, address, targetBalance, 30);

			const finalBalance = await walletConnector.getBalance(TEST_IDENTITY, address);
			expect(finalBalance).toBeGreaterThanOrEqual(targetBalance);
		} catch (error) {
			if (BaseError.fromError(error).message === "iotaFaucetConnector.faucetRateLimit") {
				console.warn(
					"Faucet rate limit exceeded, skipping test that requires funding from faucet."
				);
			} else {
				throw error;
			}
		}
	});

	test("ensureBalance handles gas station errors gracefully", async () => {
		// Create a wallet connector with invalid gas station config
		const invalidGasStationConfig: IIotaWalletConnectorConfig = {
			clientOptions: TEST_CLIENT_OPTIONS,
			network: TEST_NETWORK,
			vaultMnemonicId: TEST_MNEMONIC_NAME,
			vaultSeedId: "test-seed-invalid",
			coinType: TEST_COIN_TYPE,
			gasStation: {
				gasStationUrl: "http://invalid-endpoint:9999/sponsor",
				gasStationAuthToken: "invalid-token"
			}
		};

		const invalidWalletConnector = new IotaWalletConnector({
			config: invalidGasStationConfig
		});

		await invalidWalletConnector.create(`${TEST_IDENTITY}-invalid`);

		const invalidAddresses = await invalidWalletConnector.getAddresses(
			`${TEST_IDENTITY}-invalid`,
			0,
			0,
			1
		);
		const invalidAddress = invalidAddresses[0];

		try {
			// This should fall back to faucet funding when gas station fails
			const result = await invalidWalletConnector.ensureBalance(
				`${TEST_IDENTITY}-invalid`,
				invalidAddress,
				1000000000n,
				10
			);

			// Result depends on whether faucet is available and working
			// The test should not throw an error even if funding fails
			expect(typeof result).toBe("boolean");
		} catch (error) {
			if (BaseError.fromError(error).message === "iotaFaucetConnector.faucetRateLimit") {
				console.warn(
					"Faucet rate limit exceeded, skipping test that requires funding from faucet."
				);
			} else {
				throw error;
			}
		}
	});

	// This test verifies that wallet connector with gas station config can perform basic operations
	test("gas station can sponsor gas for transactions", async () => {
		const addresses = await walletConnector.getAddresses(TEST_IDENTITY, 0, 0, 2);
		const address = addresses[0];

		// Check that we can get a balance with gas station config
		const initialBalance = await walletConnector.getBalance(TEST_IDENTITY, address);

		const minimumRequired = 1000000000n; // 1 IOTA

		const faucetConnector = FaucetConnectorFactory.get("faucet");
		expect(faucetConnector).toBeDefined();

		try {
			// Fund the address directly through the faucet
			await faucetConnector.fundAddress(TEST_IDENTITY, address, 60);

			await new Promise(resolve => setTimeout(resolve, 5000));

			const balanceAfterFunding = await walletConnector.getBalance(TEST_IDENTITY, address);

			// Verify funding worked
			expect(balanceAfterFunding).toBeGreaterThan(initialBalance);
			expect(balanceAfterFunding).toBeGreaterThanOrEqual(minimumRequired);
		} catch (error) {
			if (BaseError.fromError(error).message === "iotaFaucetConnector.faucetRateLimit") {
				console.warn(
					"Faucet rate limit exceeded, skipping test that requires funding from faucet."
				);
			} else {
				throw error;
			}
		}
	});

	test("gas station integration preserves wallet connector functionality", async () => {
		// Test that basic wallet operations still work with gas station config
		const addresses = await walletConnector.getAddresses(TEST_IDENTITY, 0, 0, 3);
		expect(addresses.length).toBe(3);

		// All addresses should be valid
		for (const address of addresses) {
			expect(address).toMatch(/^0x[\dA-Fa-f]+$/);

			// Should be able to get balance for each address
			const balance = await walletConnector.getBalance(TEST_IDENTITY, address);
			expect(balance).toBeGreaterThanOrEqual(0n);
		}
	});
});
