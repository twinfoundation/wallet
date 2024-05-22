// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Bip44, KeyType } from "@gtsc/crypto";
import {
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_CONTEXT,
	TEST_BECH32_HRP,
	TEST_SEED,
	setupTestEnv
} from "./setupTestEnv";
import { IotaFaucetConnector } from "../src/iotaFaucetConnector";
import type { IIotaFaucetConnectorConfig } from "../src/models/IIotaFaucetConnectorConfig";

describe("IotaFaucetConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("can fail to construct a faucet with no config", () => {
		expect(
			() => new IotaFaucetConnector(undefined as unknown as IIotaFaucetConnectorConfig)
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

	test("can fail to construct a faucet with no config client options", () => {
		expect(() => new IotaFaucetConnector({} as unknown as IIotaFaucetConnectorConfig)).toThrow(
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
			() => new IotaFaucetConnector({ clientOptions: {} } as unknown as IIotaFaucetConnectorConfig)
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
		const faucet = new IotaFaucetConnector({
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
			TEST_BECH32_HRP,
			TEST_COIN_TYPE,
			0,
			false,
			Math.floor(Math.random() * 100000000) + 1000
		);

		const faucet = new IotaFaucetConnector({
			clientOptions: TEST_CLIENT_OPTIONS,
			endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
		});

		const amountAdded = await faucet.fundAddress(TEST_CONTEXT, addressKeyPair.address);

		expect(amountAdded).toBeGreaterThan(0);
	});
});
