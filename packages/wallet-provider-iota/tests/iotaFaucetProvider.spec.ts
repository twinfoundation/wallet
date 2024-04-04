// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { TEST_ADDRESS_BECH32, TEST_CLIENT_OPTIONS, initTestWallet } from "./testWallet";
import { IotaFaucetProvider } from "../src/iotaFaucetProvider";
import type { IIotaFaucetProviderConfig } from "../src/models/IIotaFaucetProviderConfig";
import "dotenv/config";

describe("IotaFaucet", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can fail to construct a faucet with no config", () => {
		expect(() => new IotaFaucetProvider(undefined as unknown as IIotaFaucetProviderConfig)).toThrow(
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
		expect(() => new IotaFaucetProvider({} as unknown as IIotaFaucetProviderConfig)).toThrow(
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

	test("can fail to construct a faucet with no endpoint", () => {
		expect(
			() => new IotaFaucetProvider({ clientOptions: {} } as unknown as IIotaFaucetProviderConfig)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "config.endpoint",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a faucet with details", () => {
		const faucet = new IotaFaucetProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
		});
		expect(faucet).toBeDefined();
	});

	test("can fund an address from the faucet", async () => {
		const faucet = new IotaFaucetProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
		});

		const amount = await faucet.fundAddress(TEST_ADDRESS_BECH32);

		expect(amount).toBeGreaterThan(0);
	});
});
