// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@gtsc/cli-core";
import { Converter, I18n, StringHelper } from "@gtsc/core";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import {
	EntityStorageVaultConnector,
	VaultKey,
	VaultSecret
} from "@gtsc/vault-connector-entity-storage";
import { IotaWalletConnector } from "@gtsc/wallet-connector-iota";
import { Command } from "commander";

/**
 * Build the transfer command to be consumed by the CLI.
 * @returns The command.
 */
export function buildCommandTransfer(): Command {
	const command = new Command();
	command
		.name("transfer")
		.summary(I18n.formatMessage("commands.transfer.summary"))
		.description(I18n.formatMessage("commands.transfer.description"))
		.requiredOption(
			I18n.formatMessage("commands.transfer.options.seed.param"),
			I18n.formatMessage("commands.transfer.options.seed.description"),
			"!SEED"
		)
		.requiredOption(
			I18n.formatMessage("commands.transfer.options.address.param"),
			I18n.formatMessage("commands.transfer.options.address.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.transfer.options.dest-address.param"),
			I18n.formatMessage("commands.transfer.options.dest-address.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.transfer.options.amount.param"),
			I18n.formatMessage("commands.transfer.options.amount.description")
		)
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.option(
			I18n.formatMessage("commands.common.options.explorer.param"),
			I18n.formatMessage("commands.common.options.explorer.description"),
			"!EXPLORER_URL"
		)
		.action(actionCommandTransfer);

	return command;
}

/**
 * Action the mnemonic command.
 * @param opts The options for the command.
 * @param opts.seed The seed to use for the wallet.
 * @param opts.address The address to source the funds from.
 * @param opts.destAddress The address to send the funds to.
 * @param opts.amount The amount of funds to transfer.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandTransfer(opts: {
	seed: string;
	address: string;
	destAddress: string;
	amount: string;
	node: string;
	explorer: string;
}): Promise<void> {
	try {
		const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
		const address: string = CLIParam.bech32("address", opts.address);
		const destAddress: string = CLIParam.bech32("destAddress", opts.destAddress);
		const amount: bigint = CLIParam.bigint("amount", opts.amount, false, 0n);
		const nodeEndpoint: string = CLIParam.url("node", opts.node);
		const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

		CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.address"), address);
		CLIDisplay.value(I18n.formatMessage("commands.transfer.labels.dest-address"), destAddress);
		CLIDisplay.break();

		CLIDisplay.task(I18n.formatMessage("commands.transfer.progress.transferringFunds"));
		CLIDisplay.break();

		CLIDisplay.spinnerStart();

		const requestContext = { identity: "dummy", tenantId: "dummy" };

		const vault = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<VaultKey>(
				EntitySchemaHelper.getSchema(VaultKey)
			),
			vaultSecretEntityStorageConnector: new MemoryEntityStorageConnector<VaultSecret>(
				EntitySchemaHelper.getSchema(VaultSecret)
			)
		});

		await vault.setSecret(requestContext, "wallet-seed", Converter.bytesToBase64(seed));

		const iotaWallet = new IotaWalletConnector(
			{
				vaultConnector: vault
			},
			{
				clientOptions: {
					nodes: [nodeEndpoint],
					localPow: true
				}
			}
		);

		const blockId = await iotaWallet.transfer(requestContext, address, destAddress, amount);

		CLIDisplay.spinnerStop();

		CLIDisplay.value(
			I18n.formatMessage("commands.common.labels.explorer"),
			`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/block/${blockId}`
		);
		CLIDisplay.break();

		CLIDisplay.done();
	} catch (error) {
		CLIDisplay.spinnerStop();
		CLIDisplay.error(error);
	}
}
