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

### getBalance

▸ **getBalance**(`address`): `Promise`\<`bigint`\>

Get the balance for an address in a wallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | The bech32 encoded address. |

#### Returns

`Promise`\<`bigint`\>

The created document.

#### Implementation of

IWalletProvider.getBalance
