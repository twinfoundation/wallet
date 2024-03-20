// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CoinType, SecretManager } from "@iota/sdk-wasm/node";
import { IotaFaucet } from "../src/iotaFaucet";
import { IotaWalletProvider } from "../src/iotaWalletProvider";
import type { IIotaWalletProviderConfig } from "../src/models/IIotaWalletProviderConfig";

const NODE_ENDPOINT = "https://api.testnet.shimmer.network";
const FAUCET_ENDPOINT = "https://faucet.testnet.shimmer.network/api/enqueue";
const COIN_TYPE = CoinType.Shimmer;
const MNEMONIC =
	"agree ill brick grant cement security expire appear unknown law toe keep believe project whale welcome easy twenty deposit hour doctor witness edit mimic"; // Utils.generateMnemonic();

console.log(MNEMONIC);

describe("IotaWalletProvider", () => {
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

	test("can construct a faucet with details", () => {
		const faucet = new IotaWalletProvider({
			clientOptions: {
				nodes: [NODE_ENDPOINT]
			}
		});
		expect(faucet).toBeDefined();
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const secretManager = new SecretManager({ mnemonic: MNEMONIC });
		const defaultAddresses = await secretManager.generateEd25519Addresses({
			coinType: COIN_TYPE
		});

		const wallet = new IotaWalletProvider({
			clientOptions: {
				nodes: [NODE_ENDPOINT],
				localPow: true
			}
		});

		const ensured = await wallet.ensureBalance(defaultAddresses[0], 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address", { timeout: 120000 }, async () => {
		const secretManager = new SecretManager({ mnemonic: MNEMONIC });
		const defaultAddresses = await secretManager.generateEd25519Addresses({
			coinType: COIN_TYPE
		});

		console.log(
			"Wallet Address",
			`https://explorer.shimmer.network/testnet/addr/${defaultAddresses[0]}`
		);

		const wallet = new IotaWalletProvider(
			{
				clientOptions: {
					nodes: [NODE_ENDPOINT],
					localPow: true
				}
			},
			new IotaFaucet({
				clientOptions: {
					nodes: [NODE_ENDPOINT],
					localPow: true
				},
				endpoint: FAUCET_ENDPOINT
			})
		);

		const ensured = await wallet.ensureBalance(defaultAddresses[0], 1000000000n);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const secretManager = new SecretManager({ mnemonic: MNEMONIC });
		const defaultAddresses = await secretManager.generateEd25519Addresses({
			coinType: COIN_TYPE
		});

		const wallet = new IotaWalletProvider({
			clientOptions: {
				nodes: [NODE_ENDPOINT],
				localPow: true
			}
		});

		const balance = await wallet.getBalance(defaultAddresses[0]);
		console.log("balance", balance);

		expect(balance).toBeGreaterThan(0n);
	});

	test("can get storage costs for an address", async () => {
		const secretManager = new SecretManager({ mnemonic: MNEMONIC });
		const defaultAddresses = await secretManager.generateEd25519Addresses({
			coinType: COIN_TYPE
		});

		const wallet = new IotaWalletProvider({
			clientOptions: {
				nodes: [NODE_ENDPOINT],
				localPow: true
			}
		});

		const storageCosts = await wallet.getStorageCosts(defaultAddresses[0]);
		console.log("storageCosts", storageCosts);

		expect(storageCosts).toBeGreaterThan(0);
	});
});
