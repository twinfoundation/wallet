// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { WalletAddress } from "./entities/walletAddress";

/**
 * Initialize the schema for the wallet entity storage connector.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof(WalletAddress), () =>
		EntitySchemaHelper.getSchema(WalletAddress)
	);
}
