# Class: IotaWalletConnector

Class for performing wallet operations on IOTA.

## Implements

- `IWalletConnector`

## Constructors

### constructor

• **new IotaWalletConnector**(`dependencies`, `config`): [`IotaWalletConnector`](IotaWalletConnector.md)

Create a new instance of IotaWalletConnector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dependencies` | `Object` | The dependencies for the wallet connector. |
| `dependencies.faucetConnector?` | `IFaucetConnector` | Optional faucet for requesting funds. |
| `dependencies.vaultConnector` | `IVaultConnector` | Vault connector to use for wallet secrets. |
| `config` | [`IIotaWalletConnectorConfig`](../interfaces/IIotaWalletConnectorConfig.md) | The configuration to use. |

#### Returns

[`IotaWalletConnector`](IotaWalletConnector.md)

## Properties

### MNEMONIC\_SECRET\_NAME

▪ `Static` **MNEMONIC\_SECRET\_NAME**: `string` = `"wallet-mnemonic"`

Default name for the mnemonic secret.

___

### NAMESPACE

▪ `Static` **NAMESPACE**: `string` = `"iota"`

The namespace supported by the wallet connector.

## Methods

### create

▸ **create**(`requestContext`): `Promise`\<`void`\>

Create a new wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IWalletConnector.create

___

### ensureBalance

▸ **ensureBalance**(`requestContext`, `address`, `ensureBalance`, `timeoutInSeconds?`): `Promise`\<`boolean`\>

Ensure the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address. |
| `ensureBalance` | `bigint` | The balance to ensure on the address. |
| `timeoutInSeconds?` | `number` | The timeout in seconds to wait for the funding to complete. |

#### Returns

`Promise`\<`boolean`\>

True if the balance has been ensured.

#### Implementation of

IWalletConnector.ensureBalance

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

IWalletConnector.getBalance

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

IWalletConnector.getStorageCosts

___

### transfer

▸ **transfer**(`requestContext`, `address`, `amount`): `Promise`\<`void`\>

Transfer funds to an address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `address` | `string` | The bech32 encoded address to send the funds to. |
| `amount` | `bigint` | The amount to transfer. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IWalletConnector.transfer