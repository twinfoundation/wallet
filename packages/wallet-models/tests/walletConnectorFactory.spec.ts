// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { WalletConnectorFactory } from "../src/factories/walletConnectorFactory";
import type { IWalletConnector } from "../src/models/IWalletConnector";

describe("WalletConnectorFactory", () => {
	test("can add an item to the factory", async () => {
		WalletConnectorFactory.register("my-wallet", () => ({}) as unknown as IWalletConnector);
	});
});
