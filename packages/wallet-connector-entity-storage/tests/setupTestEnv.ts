// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema
} from "@gtsc/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@gtsc/vault-models";
import * as dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

export const TEST_PARTITION_ID = "test-partition";
export const TEST_IDENTITY_ID = "test-identity";
export const TEST_IDENTITY_ID_2 = "test-identity-2";

export const TEST_CONTEXT: IServiceRequestContext = {
	partitionId: TEST_PARTITION_ID,
	userIdentity: TEST_IDENTITY_ID
};

initSchema();

EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		})
);
EntityStorageConnectorFactory.register(
	"vault-secret",
	() =>
		new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof<VaultSecret>()
		})
);

VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());
