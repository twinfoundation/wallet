// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@twin.org/cli-core";
import { Converter, I18n, Is, StringHelper } from "@twin.org/core";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { Command } from "commander";
import { setupVault, setupWalletConnector } from "./setupCommands";

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
			I18n.formatMessage("commands.common.options.connector.param"),
			I18n.formatMessage("commands.common.options.connector.description"),
			["iota", "iota-rebased"]
		)
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.option(
			I18n.formatMessage("commands.common.options.network.param"),
			I18n.formatMessage("commands.common.options.network.description"),
			"!NETWORK"
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
 * Action the transfer command.
 * @param opts The options for the command.
 * @param opts.seed The seed to use for the wallet.
 * @param opts.address The address to source the funds from.
 * @param opts.destAddress The address to send the funds to.
 * @param opts.amount The amount of funds to transfer.
 * @param opts.connector The connector to perform the operations with.
 * @param opts.node The node URL.
 * @param opts.network The network to use for rebased connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandTransfer(opts: {
	seed: string;
	address: string;
	destAddress: string;
	amount: string;
	connector?: string;
	node: string;
	network?: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const address: string =
		opts.connector === "iota-rebased"
			? Converter.bytesToHex(CLIParam.hex("address", opts.address), true)
			: CLIParam.bech32("address", opts.address);
	const destAddress: string =
		opts.connector === "iota-rebased"
			? Converter.bytesToHex(CLIParam.hex("destAddress", opts.destAddress), true)
			: CLIParam.bech32("destAddress", opts.destAddress);
	const amount: bigint = CLIParam.bigint("amount", opts.amount, false, 0n);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string | undefined =
		opts.connector === "iota-rebased" ? CLIParam.stringValue("network", opts.network) : undefined;
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.connector"),
		opts.connector ?? "iota"
	);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	if (Is.stringValue(network)) {
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.network"), network);
	}
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.address"), address);
	CLIDisplay.value(I18n.formatMessage("commands.transfer.labels.destAddress"), destAddress);
	CLIDisplay.value(I18n.formatMessage("commands.transfer.labels.amount"), amount.toString());
	CLIDisplay.break();

	CLIDisplay.task(I18n.formatMessage("commands.transfer.progress.transferringFunds"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	setupVault();

	const vaultSeedId = "local-seed";
	const localIdentity = "local-identity";

	const walletConnector = setupWalletConnector(
		{ nodeEndpoint, network, vaultSeedId },
		opts.connector
	);

	const vaultConnector = VaultConnectorFactory.get("vault");
	await vaultConnector.setSecret(`${localIdentity}/${vaultSeedId}`, Converter.bytesToBase64(seed));

	const blockId = await walletConnector.transfer(localIdentity, address, destAddress, amount);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		opts.connector === "iota-rebased"
			? `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/txblock/${blockId}?network=${network}`
			: `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/block/${blockId}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
