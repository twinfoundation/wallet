// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { FaucetConnectorFactory } from "../src/factories/faucetConnectorFactory";
import type { IFaucetConnector } from "../src/models/IFaucetConnector";

describe("FaucetConnectorFactory", () => {
	test("can add an item to the factory", async () => {
		FaucetConnectorFactory.register("my-faucet", () => ({}) as unknown as IFaucetConnector);
	});
});
