// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { describe, expect, test, beforeEach, beforeAll } from "vitest";
import { setupTestEnv, TEST_IDENTITY_ID } from "./setupTestEnv";
import { IotaGasStationFaucetConnector } from "../src/iotaGasStationFaucetConnector";
import type { IIotaGasStationFaucetConnectorConfig } from "../src/models/IIotaGasStationFaucetConnectorConfig";

describe("IotaGasStationFaucetConnector", () => {
	let config: IIotaGasStationFaucetConnectorConfig;

	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(() => {
		config = {
			gasStationUrl: process.env.TEST_GAS_STATION_URL ?? "http://localhost:9527",
			gasStationAuthToken:
				process.env.TEST_GAS_STATION_AUTH_TOKEN ?? "qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI=",
			clientOptions: {
				url: process.env.TEST_NODE_ENDPOINT ?? "https://api.testnet.iota.cafe"
			},
			network: process.env.TEST_NETWORK ?? "testnet",
			gasBudget: 50000000,
			walletAddressIndex: 0
		};
	});

	test("constructor should validate required parameters", () => {
		expect(() => {
			const connector = new IotaGasStationFaucetConnector({
				config,
				vaultConnectorType: "vault"
			});
			return connector;
		}).not.toThrow();
	});

	test("constructor should throw if gasStationUrl is missing", () => {
		const invalidConfig: Partial<IIotaGasStationFaucetConnectorConfig> = { ...config };
		delete invalidConfig.gasStationUrl;

		expect(() => {
			const connector = new IotaGasStationFaucetConnector({
				config: invalidConfig as IIotaGasStationFaucetConnectorConfig,
				vaultConnectorType: "vault"
			});
			return connector;
		}).toThrow();
	});

	test("constructor should throw if gasStationAuthToken is missing", () => {
		const invalidConfig: Partial<IIotaGasStationFaucetConnectorConfig> = { ...config };
		delete invalidConfig.gasStationAuthToken;

		expect(() => {
			const connector = new IotaGasStationFaucetConnector({
				config: invalidConfig as IIotaGasStationFaucetConnectorConfig,
				vaultConnectorType: "vault"
			});
			return connector;
		}).toThrow();
	});

	test("should have correct namespace", () => {
		expect(IotaGasStationFaucetConnector.NAMESPACE).toBe("iota");
	});

	test("fundAddress should test real gas station availability", async () => {
		const connector = new IotaGasStationFaucetConnector({
			config,
			vaultConnectorType: "vault"
		});

		console.log("Testing real gas station availability at:", config.gasStationUrl);

		const result = await connector.fundAddress(TEST_IDENTITY_ID, "test-address", 10);
		expect(result).toBe(BigInt(0));

		console.log("Gas station availability test passed!");
	});

	test("createSponsoredTransaction should execute real gas station workflow", async () => {
		const connector = new IotaGasStationFaucetConnector({
			config,
			vaultConnectorType: "vault"
		});

		console.log("Testing real sponsored transaction workflow...");

		try {
			const result = await connector.createSponsoredTransaction(TEST_IDENTITY_ID);

			console.log("Sponsored transaction result:", {
				transactionDigest: result.transactionDigest,
				reservationId: result.gasStationWorkflow.reservationId,
				sponsorAddress: result.gasStationWorkflow.sponsorAddress,
				gasBudget: result.gasStationWorkflow.gasBudget
			});

			expect(result.transactionDigest).toBeDefined();
			expect(result.gasStationWorkflow.reservationId).toBeGreaterThan(0);
			expect(result.gasStationWorkflow.sponsorAddress).toBeDefined();
			expect(result.gasStationWorkflow.gasBudget).toBeGreaterThan(0);

			console.log("Real sponsored transaction test passed!");
		} catch (error) {
			console.error("Sponsored transaction failed:", error);
			throw error;
		}
	});
});
