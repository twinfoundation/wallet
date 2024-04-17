# Class: IotaWalletProvider

Class for performing wallet operations on IOTA.

## Implements

- `IWalletProvider`

## Constructors

### constructor

• **new IotaWalletProvider**(`dependencies`, `config`): [`IotaWalletProvider`](IotaWalletProvider.md)

Create a new instance of IotaWalletProvider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dependencies` | `Object` | The dependencies for the wallet provider. |
| `dependencies.faucetProvider?` | `IFaucetProvider` | Optional faucet for requesting funds. |
| `dependencies.vaultProvider` | `IVaultProvider` | Vault provider to use for wallet secrets. |
| `config` | [`IIotaWalletProviderConfig`](../interfaces/IIotaWalletProviderConfig.md) | The configuration to use. |

#### Returns

[`IotaWalletProvider`](IotaWalletProvider.md)

## Properties

### NAMESPACE

▪ `Static` **NAMESPACE**: `string` = `"iota"`

The namespace supported by the wallet provider.

## Methods

### ensureBalance

▸ **ensureBalance**(`requestContext`, `address`, `balance`, `timeoutInSeconds?`): `Promise`\<`boolean`\>

Ensure the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address. |
| `balance` | `bigint` | The balance to ensure on the address. |
| `timeoutInSeconds?` | `number` | The timeout in seconds to wait for the funding to complete. |

#### Returns

`Promise`\<`boolean`\>

True if the balance has been ensured.

#### Implementation of

IWalletProvider.ensureBalance

___

### getBalance

▸ **getBalance**(`requestContext`, `address`): `Promise`\<`bigint`\>

Get the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address. |

#### Returns

`Promise`\<`bigint`\>

The balance of the wallet address.

#### Implementation of

IWalletProvider.getBalance

___

### getStorageCosts

▸ **getStorageCosts**(`requestContext`, `address`): `Promise`\<`bigint`\>

Get the storage costs for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address. |

#### Returns

`Promise`\<`bigint`\>

The storage costs for the address.

#### Implementation of

IWalletProvider.getStorageCosts

___

### transfer

▸ **transfer**(`requestContext`, `address`, `amount`): `Promise`\<`string`\>

Transfer funds to an address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address to send the funds to. |
| `amount` | `bigint` | The amount to transfer. |

#### Returns

`Promise`\<`string`\>

The block created.

#### Implementation of

IWalletProvider.transfer
