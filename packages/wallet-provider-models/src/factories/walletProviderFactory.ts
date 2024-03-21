// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { FactoryInstance } from "@gtsc/core";
import type { IWalletProvider } from "../models/IWalletProvider";

/**
 * Factory for creating wallet providers.
 */
export class WalletProviderFactory {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public static readonly Instance: FactoryInstance<IWalletProvider> =
		new FactoryInstance<IWalletProvider>("walletProvider");
}
