# Class: WalletProviderFactory

Factory for creating wallet providers.

## Constructors

### constructor

• **new WalletProviderFactory**(): [`WalletProviderFactory`](WalletProviderFactory.md)

#### Returns

[`WalletProviderFactory`](WalletProviderFactory.md)

## Methods

### get

▸ **get**\<`T`\>(`type`, `...args`): [`IWalletProvider`](../interfaces/IWalletProvider.md)

Get an wallet provider instance.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IWalletProvider`](../interfaces/IWalletProvider.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | `string` | The type of the wallet provider to generate. |
| `...args` | `any`[] | To create the instance with. |

#### Returns

[`IWalletProvider`](../interfaces/IWalletProvider.md)

An instance of the wallet provider.

**`Throws`**

GuardError if the parameters are invalid.

**`Throws`**

GeneralError if no provider exists to get.

___

### getIfExists

▸ **getIfExists**\<`T`\>(`type`, `...args`): `undefined` \| [`IWalletProvider`](../interfaces/IWalletProvider.md)

Get an wallet provider with no exceptions.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IWalletProvider`](../interfaces/IWalletProvider.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | `string` | The type of the wallet provider to generate. |
| `...args` | `any`[] | To create the instance with. |

#### Returns

`undefined` \| [`IWalletProvider`](../interfaces/IWalletProvider.md)

An instance of the wallet provider or undefined if it does not exist.

___

### register

▸ **register**(`type`, `generator`): `void`

Register a new wallet provider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | `string` | The type of the wallet provider. |
| `generator` | (...`args`: `any`[]) => [`IWalletProvider`](../interfaces/IWalletProvider.md) | The function to create an instance. |

#### Returns

`void`

___

### reset

▸ **reset**(): `void`

Reset all the provider instances.

#### Returns

`void`

___

### unregister

▸ **unregister**(`type`): `void`

Unregister an wallet provider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | `string` | The name of the wallet provider to unregister. |

#### Returns

`void`

**`Throws`**

GuardError if the parameters are invalid.

**`Throws`**

GeneralError if no provider exists.
