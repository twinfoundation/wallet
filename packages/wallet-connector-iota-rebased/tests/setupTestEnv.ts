// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Guards, Is } from "@twin.org/core";
import { Bip39, Bip44, KeyType } from "@twin.org/crypto";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { FaucetConnectorFactory } from "@twin.org/wallet-models";
import dotenv from "dotenv";
import { IotaRebasedFaucetConnector } from "../src/iotaRebasedFaucetConnector";
import { IotaRebasedWalletConnector } from "../src/iotaRebasedWalletConnector";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

// Validate required environment variables
Guards.stringValue("TestEnv", "TEST_NODE_ENDPOINT", process.env.TEST_NODE_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_FAUCET_ENDPOINT", process.env.TEST_FAUCET_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_COIN_TYPE", process.env.TEST_COIN_TYPE);
Guards.stringValue("TestEnv", "TEST_EXPLORER_URL", process.env.TEST_EXPLORER_URL);

if (!Is.stringValue(process.env.TEST_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
         e.g. TEST_MNEMONIC="word0 word1 ... word23"
         You can generate one using the following command
         npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_`
	);
}

export const TEST_IDENTITY_ID = "test-identity";
export const TEST_MNEMONIC_NAME = "test-mnemonic";
export const TEST_NETWORK = "testnet";

export const TEST_CLIENT_OPTIONS = {
	url: process.env.TEST_NODE_ENDPOINT
};

export const TEST_SEED = Bip39.mnemonicToSeed(process.env.TEST_MNEMONIC);
export const TEST_COIN_TYPE = Number.parseInt(process.env.TEST_COIN_TYPE ?? "4218", 10);

// Register faucet connector
FaucetConnectorFactory.register(
	"faucet",
	() =>
		new IotaRebasedFaucetConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				endpoint: process.env.TEST_FAUCET_ENDPOINT ?? ""
			}
		})
);

// Generate test address
const keyPair = Bip44.keyPair(TEST_SEED, KeyType.Ed25519, TEST_COIN_TYPE, 0, false, 0);

const keypair = Ed25519Keypair.fromSecretKey(keyPair.privateKey);
export const TEST_ADDRESS = keypair.getPublicKey().toIotaAddress();

// Initialize schema for entity storage
initSchema();

// Setup entity storage connectors
EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		})
);

const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>()
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

// Register vault connector
VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());

// Register test wallet
const TEST_WALLET_CONNECTOR = new IotaRebasedWalletConnector({
	config: {
		clientOptions: TEST_CLIENT_OPTIONS,
		vaultMnemonicId: TEST_MNEMONIC_NAME,
		coinType: TEST_COIN_TYPE
	}
});

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	console.debug("Wallet Address", `${process.env.TEST_EXPLORER_URL}address/${TEST_ADDRESS}`);
	await TEST_WALLET_CONNECTOR.create(TEST_IDENTITY_ID);
	await TEST_WALLET_CONNECTOR.ensureBalance(TEST_IDENTITY_ID, TEST_ADDRESS, 1000000000n);
}