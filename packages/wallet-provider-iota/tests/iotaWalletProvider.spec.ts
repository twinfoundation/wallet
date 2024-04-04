// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	TEST_ADDRESS_BECH32,
	TEST_CLIENT_OPTIONS,
	TEST_SECRET_MANAGER,
	initTestWallet
} from "./testWallet";
import { IotaFaucetProvider } from "../src/iotaFaucetProvider";
import { IotaWalletProvider } from "../src/iotaWalletProvider";
import type { IIotaWalletProviderConfig } from "../src/models/IIotaWalletProviderConfig";
import "dotenv/config";

describe("IotaWalletProvider", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can fail to construct a faucet with no config", () => {
		expect(() => new IotaWalletProvider(undefined as unknown as IIotaWalletProviderConfig)).toThrow(
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

	test("can fail to construct a faucet with no config client options", () => {
		expect(() => new IotaWalletProvider({} as unknown as IIotaWalletProviderConfig)).toThrow(
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

	test("can fail to construct a faucet with no config secret manager options", () => {
		expect(
			() => new IotaWalletProvider({ clientOptions: {} } as unknown as IIotaWalletProviderConfig)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "config.secretManager",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a faucet with details", () => {
		const faucet = new IotaWalletProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			secretManager: TEST_SECRET_MANAGER
		});
		expect(faucet).toBeDefined();
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new IotaWalletProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			secretManager: TEST_SECRET_MANAGER
		});

		const ensured = await wallet.ensureBalance(TEST_ADDRESS_BECH32, 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				secretManager: TEST_SECRET_MANAGER
			},
			new IotaFaucetProvider({
				clientOptions: TEST_CLIENT_OPTIONS,
				endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
			})
		);

		const ensured = await wallet.ensureBalance(TEST_ADDRESS_BECH32, 1000000000n);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const wallet = new IotaWalletProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			secretManager: TEST_SECRET_MANAGER
		});

		const balance = await wallet.getBalance(TEST_ADDRESS_BECH32);
		console.log("balance", balance);

		expect(balance).toBeGreaterThan(0n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new IotaWalletProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			secretManager: TEST_SECRET_MANAGER
		});

		const storageCosts = await wallet.getStorageCosts(TEST_ADDRESS_BECH32);
		console.log("storageCosts", storageCosts);

		expect(storageCosts).toBeGreaterThan(0);
	});
});
