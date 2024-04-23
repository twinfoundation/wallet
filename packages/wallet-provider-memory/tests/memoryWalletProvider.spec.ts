// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IVaultProvider } from "@gtsc/vault-provider-models";
import {
	TEST_ADDRESS_BECH32,
	TEST_CONTEXT,
	TEST_MNEMONIC_ID,
	TEST_VAULT,
	initTestWallet
} from "./testWallet";
import { MemoryFaucetProvider } from "../src/memoryFaucetProvider";
import { MemoryWalletProvider } from "../src/memoryWalletProvider";
import type { IMemoryWalletProviderConfig } from "../src/models/IMemoryWalletProviderConfig";

describe("MemoryWalletProvider", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can fail to construct a wallet with no dependencies", () => {
		expect(
			() =>
				new MemoryWalletProvider(
					undefined as unknown as { vaultProvider: IVaultProvider },
					undefined as unknown as IMemoryWalletProviderConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no vault", () => {
		expect(
			() =>
				new MemoryWalletProvider(
					{ vaultProvider: undefined as unknown as IVaultProvider },
					undefined as unknown as IMemoryWalletProviderConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies.vaultProvider",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no config", () => {
		expect(
			() =>
				new MemoryWalletProvider(
					{ vaultProvider: {} as unknown as IVaultProvider },
					undefined as unknown as IMemoryWalletProviderConfig
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

	test("can fail to construct a wallet with no coin type", () => {
		expect(
			() =>
				new MemoryWalletProvider(
					{ vaultProvider: {} as unknown as IVaultProvider },
					{} as unknown as IMemoryWalletProviderConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.number",
				properties: {
					property: "config.coinType",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no bech32 hrp", () => {
		expect(
			() =>
				new MemoryWalletProvider({ vaultProvider: {} as unknown as IVaultProvider }, {
					coinType: 999999
				} as unknown as IMemoryWalletProviderConfig)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "config.bech32Hrp",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct a wallet with no wallet mnemonic id", () => {
		expect(
			() =>
				new MemoryWalletProvider({ vaultProvider: {} as unknown as IVaultProvider }, {
					coinType: 999999,
					bech32Hrp: "mem"
				} as unknown as IMemoryWalletProviderConfig)
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

	test("can construct a wallet with details", () => {
		const faucet = new MemoryWalletProvider(
			{
				vaultProvider: TEST_VAULT
			},
			{
				coinType: 999999,
				bech32Hrp: "mem",
				walletMnemonicId: TEST_MNEMONIC_ID
			}
		);
		expect(faucet).toBeDefined();
	});

	test("can fail to ensure a balance on an address with no faucet available", async () => {
		const wallet = new MemoryWalletProvider(
			{
				vaultProvider: TEST_VAULT
			},
			{
				coinType: 999999,
				bech32Hrp: "mem",
				walletMnemonicId: TEST_MNEMONIC_ID
			}
		);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32, 1000000000n);
		expect(ensured).toBeFalsy();
	});

	test("can ensure a balance on an address", async () => {
		const wallet = new MemoryWalletProvider(
			{
				vaultProvider: TEST_VAULT,
				faucetProvider: new MemoryFaucetProvider()
			},
			{
				coinType: 999999,
				bech32Hrp: "mem",
				walletMnemonicId: TEST_MNEMONIC_ID
			}
		);

		await wallet.bootstrap(TEST_CONTEXT);

		const ensured = await wallet.ensureBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32, 1000000000n);

		expect(ensured).toBeTruthy();
	});

	test("can get a balance for an address", async () => {
		const wallet = new MemoryWalletProvider(
			{
				vaultProvider: TEST_VAULT
			},
			{
				coinType: 999999,
				bech32Hrp: "mem",
				walletMnemonicId: TEST_MNEMONIC_ID,
				balance: "1000000000"
			}
		);
		await wallet.bootstrap(TEST_CONTEXT);

		const balance = await wallet.getBalance(TEST_CONTEXT, TEST_ADDRESS_BECH32);

		expect(balance).toEqual(1000000000n);
	});

	test("can get storage costs for an address", async () => {
		const wallet = new MemoryWalletProvider(
			{
				vaultProvider: TEST_VAULT
			},
			{
				coinType: 999999,
				bech32Hrp: "mem",
				walletMnemonicId: TEST_MNEMONIC_ID
			}
		);

		const storageCosts = await wallet.getStorageCosts(TEST_CONTEXT, TEST_ADDRESS_BECH32);

		expect(storageCosts).toEqual(0n);
	});
});
