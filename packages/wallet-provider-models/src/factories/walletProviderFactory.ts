// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IWalletProvider } from "../models/IWalletProvider";

/**
 * Factory for creating wallet providers.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const WalletProviderFactory = new Factory<IWalletProvider>("walletProvider");
