// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IWalletProvider } from "../models/provider/IWalletProvider";

/**
 * Factory for creating wallet providers.
 */
export class WalletProviderFactory {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<WalletProviderFactory>();

	/**
	 * Store the generators.
	 * @internal
	 */
	private static readonly _generators: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[type: string]: new (...args: any[]) => IWalletProvider;
	} = {};

	/**
	 * Store the created instances.
	 * @internal
	 */
	private static _instances: { [type: string]: IWalletProvider } = {};

	/**
	 * Register a new wallet provider.
	 * @param type The type of the wallet provider.
	 * @param generator The function to create an instance.
	 */
	public static register(
		type: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		generator: new (...args: any[]) => IWalletProvider
	): void {
		Guards.stringValue(WalletProviderFactory._CLASS_NAME, nameof(type), type);
		Guards.function(WalletProviderFactory._CLASS_NAME, nameof(generator), generator);
		this._generators[type] = generator;
		// Delete any existing instances if we have changed the registered item
		delete this._instances[type];
	}

	/**
	 * Unregister an wallet provider.
	 * @param type The name of the wallet provider to unregister.
	 * @throws GuardError if the parameters are invalid.
	 * @throws GeneralError if no provider exists.
	 */
	public static unregister(type: string): void {
		Guards.stringValue(WalletProviderFactory._CLASS_NAME, nameof(type), type);
		if (!this._generators[type]) {
			throw new GeneralError(WalletProviderFactory._CLASS_NAME, "noProviderUnregister", { type });
		}
		delete this._generators[type];
		delete this._instances[type];
	}

	/**
	 * Get an wallet provider instance.
	 * @param type The type of the wallet provider to generate.
	 * @param args To create the instance with.
	 * @returns An instance of the wallet provider.
	 * @throws GuardError if the parameters are invalid.
	 * @throws GeneralError if no provider exists to get.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static get<T extends IWalletProvider>(type: string, ...args: any[]): IWalletProvider {
		const instance = WalletProviderFactory.getIfExists<T>(type, args);

		if (!instance) {
			throw new GeneralError(WalletProviderFactory._CLASS_NAME, "noProviderGet", { name: type });
		}

		return instance;
	}

	/**
	 * Get an wallet provider with no exceptions.
	 * @param type The type of the wallet provider to generate.
	 * @param args To create the instance with.
	 * @returns An instance of the wallet provider or undefined if it does not exist.
	 */
	public static getIfExists<T extends IWalletProvider>(
		type: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		...args: any[]
	): IWalletProvider | undefined {
		Guards.stringValue(WalletProviderFactory._CLASS_NAME, nameof(type), type);
		if (!this._instances[type] && this._generators[type]) {
			this._instances[type] = new this._generators[type](...args);
		}
		if (this._instances[type]) {
			return this._instances[type] as T;
		}
	}

	/**
	 * Reset all the provider instances.
	 */
	public static reset(): void {
		WalletProviderFactory._instances = {};
	}
}
