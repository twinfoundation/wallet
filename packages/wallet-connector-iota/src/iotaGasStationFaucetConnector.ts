// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { toB64 } from "@iota/bcs";
import type { IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction, type ObjectRef } from "@iota/iota-sdk/transactions";
import { GeneralError, Guards } from "@twin.org/core";
import { Iota } from "@twin.org/dlt-iota";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import type { IFaucetConnector } from "@twin.org/wallet-models";
import type { IIotaGasStationFaucetConnectorConfig } from "./models/IIotaGasStationFaucetConnectorConfig";
import type { IIotaGasStationFaucetConnectorConstructorOptions } from "./models/IIotaGasStationFaucetConnectorConstructorOptions";

/**
 * Interface for gas reservation result from the gas station.
 */
interface IGasReservationResult {
	/**
	 * The sponsor's on-chain address.
	 */
	sponsor_address: string;

	/**
	 * An ID used to reference this particular gas reservation.
	 */
	reservation_id: number;

	/**
	 * References to the sponsor's coins that will pay gas.
	 */
	gas_coins: ObjectRef[];
}

/**
 * Result of sponsored transaction creation.
 */
export interface ISponsoredTransactionResult {
	/**
	 * The transaction digest.
	 */
	transactionDigest: string;

	/**
	 * The transaction effects.
	 */
	effects: unknown;

	/**
	 * Details about the gas station workflow.
	 */
	gasStationWorkflow: {
		reservationId: number;
		sponsorAddress: string;
		gasBudget: number;
	};
}

/**
 * Class for performing gas station sponsored faucet operations on IOTA.
 */
export class IotaGasStationFaucetConnector implements IFaucetConnector {
	/**
	 * The namespace supported by the faucet connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaGasStationFaucetConnector>();

	/**
	 * The configuration to use for IOTA operations.
	 * @internal
	 */
	private readonly _config: IIotaGasStationFaucetConnectorConfig;

	/**
	 * The IOTA client.
	 * @internal
	 */
	private readonly _client: IotaClient;

	/**
	 * The vault connector for managing keys.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * Create a new instance of IotaGasStationFaucetConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaGasStationFaucetConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaGasStationFaucetConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		Guards.string(
			this.CLASS_NAME,
			nameof(options.config.gasStationUrl),
			options.config.gasStationUrl
		);
		Guards.string(
			this.CLASS_NAME,
			nameof(options.config.gasStationAuthToken),
			options.config.gasStationAuthToken
		);

		this._config = options.config;
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");

		Iota.populateConfig(this._config);
		this._client = Iota.createClient(this._config);
	}

	/**
	 * Fund an address with IOTA using gas station sponsoring.
	 * @param identity The identity of the user to access the vault keys.
	 * @param address The address to fund.
	 * @param timeoutInSeconds The timeout in seconds to wait for the funding to complete.
	 * @returns The amount funded.
	 */
	public async fundAddress(
		identity: string,
		address: string,
		timeoutInSeconds: number = 60
	): Promise<bigint> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);
		Guards.stringValue(this.CLASS_NAME, nameof(address), address);

		try {
			// Test gas station availability
			const gasBudget = this._config.gasBudget ?? 50000000;
			await this.reserveGas(gasBudget);

			// Return 0 to indicate that sponsoring is available but no direct funding occurs
			return BigInt(0);
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"gasStationUnavailable",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Create a sponsored transaction using the gas station.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The sponsored transaction result.
	 */
	public async createSponsoredTransaction(identity: string): Promise<ISponsoredTransactionResult> {
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			// Reserve gas from the gas station
			const gasBudget = this._config.gasBudget ?? 50000000;
			const gasReservation = await this.reserveGas(gasBudget);

			// Build transaction with sponsor gas data
			const tx = new Transaction();
			const addresses = Iota.getAddresses(
				await Iota.getSeed(this._config, this._vaultConnector, identity),
				this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
				0,
				this._config.walletAddressIndex ?? 0,
				1,
				false
			);
			const userAddress = addresses[0];

			// Set transaction parameters for sponsoring
			tx.setSender(userAddress);
			tx.setGasOwner(gasReservation.sponsor_address);
			tx.setGasPayment(gasReservation.gas_coins);
			tx.setGasBudget(gasBudget);

			// Create a simple test transaction
			tx.moveCall({
				target: "0x2::clock::timestamp_ms",
				arguments: [tx.object("0x6")]
			});

			// Build and sign transaction
			const unsignedTxBytes = await tx.build({ client: this._client });

			// Sign the transaction with the user's private key
			const seed = await Iota.getSeed(this._config, this._vaultConnector, identity);
			const keyPair = Iota.getKeyPair(
				seed,
				this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
				0,
				this._config.walletAddressIndex ?? 0
			);
			const keypair = Ed25519Keypair.fromSecretKey(keyPair.privateKey);
			const signature = await keypair.signTransaction(unsignedTxBytes);

			// Submit to gas station for co-signing and execution
			const transactionEffects = await this.submitSponsoredTransaction(
				gasReservation.reservation_id,
				unsignedTxBytes,
				signature.signature
			);

			return {
				transactionDigest:
					(transactionEffects as { transactionDigest?: string })?.transactionDigest ??
					"unknown_digest",
				effects: transactionEffects,
				gasStationWorkflow: {
					reservationId: gasReservation.reservation_id,
					sponsorAddress: gasReservation.sponsor_address,
					gasBudget
				}
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"createSponsoredTransactionFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Reserve gas from the gas station.
	 * @param gasBudget The gas budget to reserve.
	 * @returns The gas reservation result.
	 * @internal
	 */
	private async reserveGas(gasBudget: number): Promise<IGasReservationResult> {
		const requestData = {
			// eslint-disable-next-line camelcase
			gas_budget: gasBudget,
			// eslint-disable-next-line camelcase
			reserve_duration_secs: 30
		};

		// eslint-disable-next-line no-console
		console.log(`🚀 Reserving gas from gas station: ${this._config.gasStationUrl}/v1/reserve_gas`);
		// eslint-disable-next-line no-console
		console.log("📋 Request data:", requestData);

		const response = await fetch(`${this._config.gasStationUrl}/v1/reserve_gas`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this._config.gasStationAuthToken}`
			},
			body: JSON.stringify(requestData)
		});

		if (!response.ok) {
			// eslint-disable-next-line no-console
			console.error(`❌ Gas reservation failed: ${response.status} ${response.statusText}`);
			throw new GeneralError(this.CLASS_NAME, "gasReservationFailed", {
				status: response.status,
				statusText: response.statusText
			});
		}

		const result = await response.json();
		// eslint-disable-next-line no-console
		console.log("✅ Gas reserved successfully:", result.result);
		return result.result;
	}

	/**
	 * Submit a sponsored transaction to the gas station.
	 * @param reservationId The reservation ID from gas reservation.
	 * @param transactionBytes The unsigned transaction bytes.
	 * @param userSignature The user's signature.
	 * @returns The transaction effects.
	 * @internal
	 */
	private async submitSponsoredTransaction(
		reservationId: number,
		transactionBytes: Uint8Array,
		userSignature: string
	): Promise<unknown> {
		const requestData = {
			// eslint-disable-next-line camelcase
			reservation_id: reservationId,
			// eslint-disable-next-line camelcase
			tx_bytes: toB64(transactionBytes),
			// eslint-disable-next-line camelcase
			user_sig: userSignature
		};

		// eslint-disable-next-line no-console
		console.log(
			`🚀 Submitting sponsored transaction to gas station: ${this._config.gasStationUrl}/v1/execute_tx`
		);
		// eslint-disable-next-line no-console
		console.log("📋 Request data:", {
			// eslint-disable-next-line camelcase
			reservation_id: requestData.reservation_id,
			// eslint-disable-next-line camelcase
			tx_bytes: `${requestData.tx_bytes.slice(0, 50)}...`,
			// eslint-disable-next-line camelcase
			user_sig: `${requestData.user_sig.slice(0, 50)}...`
		});

		const response = await fetch(`${this._config.gasStationUrl}/v1/execute_tx`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this._config.gasStationAuthToken}`
			},
			body: JSON.stringify(requestData)
		});

		if (!response.ok) {
			// eslint-disable-next-line no-console
			console.error(`❌ Transaction submission failed: ${response.status} ${response.statusText}`);
			throw new GeneralError(this.CLASS_NAME, "transactionSubmissionFailed", {
				status: response.status,
				statusText: response.statusText
			});
		}

		const result = await response.json();
		// eslint-disable-next-line no-console
		console.log("✅ Transaction submitted successfully:", result.effects);
		return result.effects;
	}
}
