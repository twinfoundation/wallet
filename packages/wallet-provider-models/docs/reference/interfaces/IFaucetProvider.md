# Interface: IFaucetProvider

Interface describing a faucet.

## Hierarchy

- `IService`

  ↳ **`IFaucetProvider`**

## Methods

### bootstrap

▸ **bootstrap**(`requestContext`): `Promise`\<`ILogEntry`[]\>

Bootstrap the service by creating and initializing any resources it needs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The request context for bootstrapping. |

#### Returns

`Promise`\<`ILogEntry`[]\>

The response of the bootstrapping as log entries.

#### Inherited from

IService.bootstrap

___

### fundAddress

▸ **fundAddress**(`address`, `timeoutInSeconds?`): `Promise`\<`bigint`\>

Fund the wallet from the faucet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | The bech32 encoded address of the address to fund. |
| `timeoutInSeconds?` | `number` | The timeout in seconds to wait for the funding to complete. |

#### Returns

`Promise`\<`bigint`\>

The amount available on the wallet address.

___

### start

▸ **start**(): `Promise`\<`void`\>

The service needs to be started when the application is initialized.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

IService.start

___

### stop

▸ **stop**(): `Promise`\<`void`\>

The service needs to be stopped when the application is closed.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

IService.stop
