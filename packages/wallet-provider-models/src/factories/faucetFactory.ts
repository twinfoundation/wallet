// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { FactoryInstance } from "@gtsc/core";
import type { IFaucet } from "../models/IFaucet";

/**
 * Factory for creating faucets.
 */
export class FaucetFactory {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public static readonly Instance: FactoryInstance<IFaucet> = new FactoryInstance<IFaucet>(
		"faucet"
	);
}
