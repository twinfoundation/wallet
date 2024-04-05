// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IFaucetProvider } from "../models/IFaucetProvider";

/**
 * Factory for creating faucets.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const FaucetProviderFactory = new Factory<IFaucetProvider>("faucet");
