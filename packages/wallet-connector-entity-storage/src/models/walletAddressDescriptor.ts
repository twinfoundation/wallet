// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IEntityDescriptor } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import type { IWalletAddress } from "./IWalletAddress";

/**
 * Entity description for a IWalletAddress.
 * @returns The descriptor for the IWalletAddress.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const WalletAddressDescriptor: IEntityDescriptor<IWalletAddress> = {
	name: nameof<IWalletAddress>(),
	properties: [
		{
			property: "address",
			type: "string",
			isPrimary: true
		},
		{
			property: "identity",
			type: "string",
			isSecondary: true
		},
		{
			property: "balance",
			type: "string"
		}
	]
};
