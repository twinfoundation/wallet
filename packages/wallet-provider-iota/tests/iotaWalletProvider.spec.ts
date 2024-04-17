// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IVaultProvider } from "@gtsc/vault-provider-models";
import {
	TEST_ADDRESS_BECH32,
	TEST_CLIENT_OPTIONS,
	TEST_CONTEXT,
	TEST_MNEMONIC_ID,
	TEST_VAULT,
	initTestWallet
} from "./testWallet";
import { IotaFaucetProvider } from "../src/iotaFaucetProvider";
import { IotaWalletProvider } from "../src/iotaWalletProvider";
import type { IIotaWalletProviderConfig } from "../src/models/IIotaWalletProviderConfig";

describe("IotaWalletProvider", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can fail to construct a wallet with no config", () => {
		expect(
			() =>
				new IotaWalletProvider(
					undefined as unknown as IIotaWalletProviderConfig,
					undefined as unknown as IVaultProvider
				)
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

	test("can fail to construct a wallet with no config client options", () => {
		expect(
			() =>
				new IotaWalletProvider(
					{} as unknown as IIotaWalletProviderConfig,
					undefined as unknown as IVaultProvider
				)
		).toThrow(
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

	test("can fail to construct a wallet with no wallet mnemonic id", () => {
		expect(
			() =>
				new IotaWalletProvider(
					{ clientOptions: {} } as unknown as IIotaWalletProviderConfig,
					undefined as unknown as IVaultProvider
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "config.walletMnemonicId",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no vault", () => {
		expect(
			() =>
				new IotaWalletProvider(
					{
						clientOptions: TEST_CLIENT_OPTIONS,
						walletMnemonicId: TEST_MNEMONIC_ID
					},
					undefined as unknown as IVaultProvider
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "vaultProvider",
					value: "undefined"
				}
			})
		);
	});

	test("can construct a wallet with details", () => {
		const faucet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_ID
			},
			TEST_VAULT
		);
		expect(faucet).toBeDefined();
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_ID
			},
			TEST_VAULT
		);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32, 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_ID
			},
			TEST_VAULT,
			new IotaFaucetProvider({
				clientOptions: TEST_CLIENT_OPTIONS,
				endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
			})
		);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32, 1000000000n);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const wallet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_ID
			},
			TEST_VAULT
		);

		const balance = await wallet.getBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32);
		console.log("balance", balance);

		expect(balance).toBeGreaterThan(0n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new IotaWalletProvider(
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				walletMnemonicId: TEST_MNEMONIC_ID
			},
			TEST_VAULT
		);

		const storageCosts = await wallet.getStorageCosts(TEST_CONTEXT, TEST_ADDRESS_BECH32);
		console.log("storageCosts", storageCosts);

		expect(storageCosts).toBeGreaterThan(0);
	});
});
