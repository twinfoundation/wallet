// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Bip44, KeyType } from "@gtsc/crypto";
import {
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_CONTEXT,
	TEST_HRP,
	TEST_SEED,
	initTestWallet
} from "./testWallet";
import { IotaFaucetProvider } from "../src/iotaFaucetProvider";
import type { IIotaFaucetProviderConfig } from "../src/models/IIotaFaucetProviderConfig";

describe("IotaFaucetProvider", () => {
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
		// Use a random address which has not yet been used
		const addressKeyPair = Bip44.addressBech32(
			TEST_SEED,
			KeyType.Ed25519,
			TEST_HRP,
			TEST_COIN_TYPE,
			0,
			false,
			Math.floor(Math.random() * 100000000) + 1000
		);

		const faucet = new IotaFaucetProvider({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
		});

		const amountAdded = await faucet.fundAddress(TEST_CONTEXT, addressKeyPair.address);

		expect(amountAdded).toBeGreaterThan(0);
	});
});
