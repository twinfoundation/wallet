// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { WalletProviderFactory } from "../src/factories/walletProviderFactory";
import type { IWalletProvider } from "../src/models/IWalletProvider";

describe("WalletProviderFactory", () => {
	test("can add an item to the factory", async () => {
		WalletProviderFactory.register("my-wallet", () => ({}) as unknown as IWalletProvider);
	});
});
