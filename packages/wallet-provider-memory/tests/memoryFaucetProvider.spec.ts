// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { TEST_ADDRESS_BECH32, TEST_CONTEXT, initTestWallet } from "./testWallet";
import { MemoryFaucetProvider } from "../src/memoryFaucetProvider";

describe("MemoryFaucetProvider", () => {
	beforeAll(async () => {
		await initTestWallet();
	});

	test("can construct a faucet with details", () => {
		const faucet = new MemoryFaucetProvider({
			initialBalance: "100000000"
		});
		expect(faucet).toBeDefined();
	});

	test("can fund an address from the faucet", async () => {
		const faucet = new MemoryFaucetProvider();

		const amountAdded = await faucet.fundAddress(TEST_CONTEXT, TEST_ADDRESS_BECH32);

		expect(amountAdded).toBeGreaterThan(0);
	});
});
