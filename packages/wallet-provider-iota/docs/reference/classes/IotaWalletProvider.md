# Class: IotaWalletProvider

Class for performing wallet operations on IOTA.

## Implements

- `IWalletProvider`

## Constructors

### constructor

• **new IotaWalletProvider**(`config`): [`IotaWalletProvider`](IotaWalletProvider.md)

Create a new instance of IotaWalletProvider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`IIotaWalletProviderConfig`](../interfaces/IIotaWalletProviderConfig.md) | The configuration to use. |

#### Returns

[`IotaWalletProvider`](IotaWalletProvider.md)

## Properties

### NAMESPACE

▪ `Static` **NAMESPACE**: `string` = `"iota"`

The namespace supported by the wallet provider.

## Methods

### ensureBalance

▸ **ensureBalance**(`address`, `balance`): `Promise`\<`boolean`\>

Ensure the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | The bech32 encoded address. |
| `balance` | `bigint` | The balance to ensure on the address. |

#### Returns

`Promise`\<`boolean`\>

True if the balance has been ensured.

#### Implementation of

IWalletProvider.ensureBalance

___

### getBalance

▸ **getBalance**(`address`): `Promise`\<`bigint`\>

Get the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | The bech32 encoded address. |

#### Returns

`Promise`\<`bigint`\>

The balance of the wallet address.

#### Implementation of

IWalletProvider.getBalance

___

### getStorageCosts

▸ **getStorageCosts**(`address`): `Promise`\<`bigint`\>

Get the storage costs for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | The bech32 encoded address. |

#### Returns

`Promise`\<`bigint`\>

The storage costs for the address.

#### Implementation of

IWalletProvider.getStorageCosts
