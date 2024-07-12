// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@gtsc/cli-core";
import { I18n, StringHelper } from "@gtsc/core";
import { IotaFaucetConnector, IotaWalletConnector } from "@gtsc/wallet-connector-iota";
import { FaucetConnectorFactory } from "@gtsc/wallet-models";
import { Command } from "commander";
import { setupVault } from "./setupCommands";

/**
 * Build the faucet command to be consumed by the CLI.
 * @returns The command.
 */
export function buildCommandFaucet(): Command {
	const command = new Command();
	command
		.name("faucet")
		.summary(I18n.formatMessage("commands.faucet.summary"))
		.description(I18n.formatMessage("commands.faucet.description"))
		.requiredOption(
			I18n.formatMessage("commands.faucet.options.address.param"),
			I18n.formatMessage("commands.faucet.options.address.description")
		)
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.option(
			I18n.formatMessage("commands.faucet.options.faucet.param"),
			I18n.formatMessage("commands.faucet.options.faucet.description"),
			"!FAUCET_URL"
		)
		.option(
			I18n.formatMessage("commands.common.options.explorer.param"),
			I18n.formatMessage("commands.common.options.explorer.description"),
			"!EXPLORER_URL"
		)
		.action(actionCommandFaucet);

	return command;
}

/**
 * Action the faucet command.
 * @param opts The options for the command.
 * @param opts.address The address to fill from the faucet.
 * @param opts.faucet The faucet URL.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandFaucet(opts: {
	address: string;
	faucet: string;
	node: string;
	explorer: string;
}): Promise<void> {
	const address: string = CLIParam.bech32("address", opts.address);
	const faucetEndpoint: string = CLIParam.url("faucet", opts.faucet);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	CLIDisplay.value(I18n.formatMessage("commands.faucet.labels.faucet"), faucetEndpoint);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.address"), address);
	CLIDisplay.break();

	CLIDisplay.task(I18n.formatMessage("commands.faucet.progress.requestingFunds"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	const iotaFaucet = new IotaFaucetConnector({
		config: {
			clientOptions: {
				primaryNode: nodeEndpoint
			},
			endpoint: faucetEndpoint
		}
	});

	const fundsAdded = await iotaFaucet.fundAddress(address, undefined, {
		identity: "dummy",
		partitionId: "dummy"
	});
	FaucetConnectorFactory.register("faucet", () => iotaFaucet);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.faucet.labels.fundsAdded"),
		fundsAdded === 0n
			? I18n.formatMessage("commands.faucet.messages.noFundsAdded")
			: fundsAdded.toString()
	);
	CLIDisplay.break();

	CLIDisplay.task(I18n.formatMessage("commands.faucet.progress.requestingBalance"));
	CLIDisplay.break();

	setupVault();

	const iotaWallet = new IotaWalletConnector({
		config: {
			clientOptions: {
				primaryNode: nodeEndpoint
			}
		}
	});

	const balance = await iotaWallet.getBalance(address, { identity: "dummy", partitionId: "dummy" });

	CLIDisplay.value(I18n.formatMessage("commands.common.labels.balance"), balance.toString());
	CLIDisplay.break();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${address}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
