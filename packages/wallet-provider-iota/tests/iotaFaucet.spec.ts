// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	TEST_ADDRESS_BECH32,
	TEST_CLIENT_OPTIONS,
	TEST_FAUCET_ENDPOINT,
	initTestWallet
} from "./testWallet";
import { IotaFaucet } from "../src/iotaFaucet";
import type { IIotaFaucetConfig } from "../src/models/IIotaFaucetConfig";

describe("IotaFaucet", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can fail to construct a faucet with no config", () => {
		expect(() => new IotaFaucet(undefined as unknown as IIotaFaucetConfig)).toThrow(
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
		expect(() => new IotaFaucet({} as unknown as IIotaFaucetConfig)).toThrow(
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
		expect(() => new IotaFaucet({ clientOptions: {} } as unknown as IIotaFaucetConfig)).toThrow(
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
		const faucet = new IotaFaucet({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: TEST_FAUCET_ENDPOINT
		});
		expect(faucet).toBeDefined();
	});

	test("can fund an address from the faucet", { timeout: 60000 }, async () => {
		const faucet = new IotaFaucet({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: TEST_FAUCET_ENDPOINT
		});

		const amount = await faucet.fundAddress(TEST_ADDRESS_BECH32);

		expect(amount).toBeGreaterThan(0);
	});
});
