// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IWalletConnector } from "../models/IWalletConnector";

/**
 * Factory for creating wallet connectors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const WalletConnectorFactory = new Factory<IWalletConnector>("walletConnector");
