// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Bip44, KeyType } from "@twin.org/crypto";
import {
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_SEED,
	setupTestEnv
} from "./setupTestEnv";
import { IotaStardustFaucetConnector } from "../src/iotaStardustFaucetConnector";
import type { IIotaStardustFaucetConnectorConfig } from "../src/models/IIotaStardustFaucetConnectorConfig";

describe("IotaFaucetConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("can fail to construct a faucet with no options", () => {
		expect(
			() =>
				new IotaStardustFaucetConnector(
					undefined as unknown as { config: IIotaStardustFaucetConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options", value: "undefined" }
			})
		);
	});

	test("can fail to construct a faucet with no config", () => {
		expect(
			() =>
				new IotaStardustFaucetConnector(
					{} as unknown as { config: IIotaStardustFaucetConnectorConfig }
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options.config", value: "undefined" }
			})
		);
	});

	test("can fail to construct a faucet with no config client options", () => {
		expect(
			() =>
				new IotaStardustFaucetConnector({ config: {} } as unknown as {
					config: IIotaStardustFaucetConnectorConfig;
				})
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: { property: "options.config.clientOptions", value: "undefined" }
			})
		);
	});

	test("can fail to construct a faucet with no endpoint", () => {
		expect(
			() =>
				new IotaStardustFaucetConnector({ config: { clientOptions: {} } } as unknown as {
					config: IIotaStardustFaucetConnectorConfig;
				})
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: { property: "options.config.endpoint", value: "undefined" }
			})
		);
	});

	test("can construct a faucet with details", () => {
		const faucet = new IotaStardustFaucetConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
			}
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

		const faucet = new IotaStardustFaucetConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
			}
		});

		const amountAdded = await faucet.fundAddress(TEST_IDENTITY_ID, addressKeyPair.address);

		expect(amountAdded).toBeGreaterThan(0);
	});
});
