// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { FactoryInstance } from "@gtsc/core";
import type { IFaucetProvider } from "../models/IFaucetProvider";

/**
 * Factory for creating faucets.
 */
export class FaucetProviderFactory {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public static readonly Instance: FactoryInstance<IFaucetProvider> =
		new FactoryInstance<IFaucetProvider>("faucet");
}
