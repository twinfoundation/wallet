// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CoinType, SecretManager } from "@iota/sdk-wasm/node";
import { IotaFaucet } from "../src/iotaFaucet";
import type { IIotaFaucetConfig } from "../src/models/IIotaFaucetConfig";

const NODE_ENDPOINT = "https://api.testnet.shimmer.network";
const FAUCET_ENDPOINT = "https://faucet.testnet.shimmer.network/api/enqueue";
const COIN_TYPE = CoinType.Shimmer;
const MNEMONIC =
	"agree ill brick grant cement security expire appear unknown law toe keep believe project whale welcome easy twenty deposit hour doctor witness edit mimic"; // Utils.generateMnemonic();

describe("IotaFaucet", () => {
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
			clientOptions: {
				nodes: [NODE_ENDPOINT]
			},
			endpoint: FAUCET_ENDPOINT
		});
		expect(faucet).toBeDefined();
	});

	test("can fund an address from the faucet", { timeout: 60000 }, async () => {
		const secretManager = new SecretManager({ mnemonic: MNEMONIC });
		const defaultAddresses = await secretManager.generateEd25519Addresses({
			coinType: COIN_TYPE
		});

		console.log(
			"Wallet Address",
			`https://explorer.shimmer.network/testnet/addr/${defaultAddresses[0]}`
		);

		const faucet = new IotaFaucet({
			clientOptions: {
				nodes: [NODE_ENDPOINT],
				localPow: true
			},
			endpoint: FAUCET_ENDPOINT
		});

		const amount = await faucet.fundAddress(defaultAddresses[0]);

		expect(amount).toBeGreaterThan(0);
	});
});
