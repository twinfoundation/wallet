# Class: IotaRebasedWalletConnector

Class for performing wallet operations on IOTA Rebased.

## Implements

- `IWalletConnector`

## Constructors

### new IotaRebasedWalletConnector()

> **new IotaRebasedWalletConnector**(`options`): [`IotaRebasedWalletConnector`](IotaRebasedWalletConnector.md)

Create a new instance of IOTA Rebased Wallet Connector.

#### Parameters

• **options**

The options for the wallet connector.

• **options.vaultConnectorType?**: `string`

Vault connector to use for wallet secrets, defaults to "vault".

• **options.faucetConnectorType?**: `string`

Optional faucet for requesting funds, defaults to "faucet".

• **options.config**: [`IIotaRebasedWalletConnectorConfig`](../interfaces/IIotaRebasedWalletConnectorConfig.md)

The configuration to use.

#### Returns

[`IotaRebasedWalletConnector`](IotaRebasedWalletConnector.md)

## Properties

### NAMESPACE

> `readonly` `static` **NAMESPACE**: `string` = `"iota-rebased"`

The namespace supported by the wallet connector.

***

### CLASS\_NAME

> `readonly` **CLASS\_NAME**: `string`

Runtime name for the class.

#### Implementation of

`IWalletConnector.CLASS_NAME`

## Methods

### create()

> **create**(`identity`): `Promise`\<`void`\>

Create a new wallet.

#### Parameters

• **identity**: `string`

The identity of the user to access the vault keys.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IWalletConnector.create`

***

### getAddresses()

> **getAddresses**(`identity`, `accountIndex`, `startAddressIndex`, `count`, `isInternal`?): `Promise`\<`string`[]\>

Get the addresses for the identity.

#### Parameters

• **identity**: `string`

The identity to get the addresses for.

• **accountIndex**: `number`

The account index to get the addresses for.

• **startAddressIndex**: `number`

The start index for the addresses.

• **count**: `number`

The number of addresses to generate.

• **isInternal?**: `boolean`

Whether the addresses are internal.

#### Returns

`Promise`\<`string`[]\>

The addresses.

#### Implementation of

`IWalletConnector.getAddresses`

***

### getBalance()

> **getBalance**(`identity`, `address`): `Promise`\<`bigint`\>

Get the balance for the given address.

#### Parameters

• **identity**: `string`

The identity of the user to access the vault keys.

• **address**: `string`

The address to get the balance for.

#### Returns

`Promise`\<`bigint`\>

The balance.

#### Implementation of

`IWalletConnector.getBalance`

***

### ensureBalance()

> **ensureBalance**(`identity`, `address`, `ensureBalance`, `timeoutInSeconds`?): `Promise`\<`boolean`\>

Ensure the balance for the given address is at least the given amount.

#### Parameters

• **identity**: `string`

The identity of the user to access the vault keys.

• **address**: `string`

The address to ensure the balance for.

• **ensureBalance**: `bigint`

The minimum balance to ensure.

• **timeoutInSeconds?**: `number`

Optional timeout in seconds, defaults to 10 seconds.

#### Returns

`Promise`\<`boolean`\>

True if the balance is at least the given amount, false otherwise.

#### Implementation of

`IWalletConnector.ensureBalance`

***

### transfer()

> **transfer**(`identity`, `addressSource`, `addressDest`, `amount`): `Promise`\<`undefined` \| `string`\>

Transfer an amount from one address to another.

#### Parameters

• **identity**: `string`

The identity of the user to access the vault keys.

• **addressSource**: `string`

The source address to transfer from.

• **addressDest**: `string`

The destination address to transfer to.

• **amount**: `bigint`

The amount to transfer.

#### Returns

`Promise`\<`undefined` \| `string`\>

The transaction digest.

#### Implementation of

`IWalletConnector.transfer`
