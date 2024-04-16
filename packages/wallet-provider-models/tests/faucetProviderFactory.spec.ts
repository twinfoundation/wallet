// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { FaucetProviderFactory } from "../src/factories/faucetProviderFactory";
import type { IFaucetProvider } from "../src/models/IFaucetProvider";

describe("FaucetProviderFactory", () => {
	test("can add an item to the factory", async () => {
		FaucetProviderFactory.register("my-faucet", () => ({}) as unknown as IFaucetProvider);
	});
});
