# Class: MemoryFaucetProvider

Class for performing faucet operations using in-memory storage.

## Implements

- `IFaucetProvider`

## Constructors

### constructor

• **new MemoryFaucetProvider**(`config?`): [`MemoryFaucetProvider`](MemoryFaucetProvider.md)

Create a new instance of IotaWalletProvider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config?` | [`IMemoryFaucetProviderConfig`](../interfaces/IMemoryFaucetProviderConfig.md) | The configuration to use. |

#### Returns

[`MemoryFaucetProvider`](MemoryFaucetProvider.md)

## Properties

### NAMESPACE

▪ `Static` **NAMESPACE**: `string` = `"mem"`

The namespace supported by the wallet provider.

## Methods

### fundAddress

▸ **fundAddress**(`requestContext`, `address`, `timeoutInSeconds?`): `Promise`\<`bigint`\>

Fund the wallet from the faucet.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | `undefined` | The context for the request. |
| `address` | `string` | `undefined` | The bech32 encoded address of the address to fund. |
| `timeoutInSeconds` | `number` | `60` | The timeout in seconds to wait for the funding to complete. |

#### Returns

`Promise`\<`bigint`\>

The amount added to the address by the faucet.

#### Implementation of

IFaucetProvider.fundAddress
