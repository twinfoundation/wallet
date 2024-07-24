// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLIBase } from "@gtsc/cli-core";
import { buildCommandAddress, buildCommandMnemonic } from "@gtsc/crypto-cli";
import type { Command } from "commander";
import { buildCommandFaucet } from "./commands/faucet";
import { buildCommandTransfer } from "./commands/transfer";

/**
 * The main entry point for the CLI.
 */
export class CLI extends CLIBase {
	/**
	 * Run the app.
	 * @param argv The process arguments.
	 * @param localesDirectory The directory for the locales, default to relative to the script.
	 * @returns The exit code.
	 */
	public async run(argv: string[], localesDirectory?: string): Promise<number> {
		return this.execute(
			{
				title: "GTSC Wallet",
				appName: "gtsc-wallet",
				version: "0.0.3-next.31",
				icon: "🌍",
				supportsEnvFiles: true
			},
			localesDirectory ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../locales"),
			argv
		);
	}

	/**
	 * Get the commands for the CLI.
	 * @param program The main program to add the commands to.
	 * @internal
	 */
	protected getCommands(program: Command): Command[] {
		return [
			buildCommandMnemonic(),
			buildCommandAddress(),
			buildCommandFaucet(),
			buildCommandTransfer()
		];
	}
}
