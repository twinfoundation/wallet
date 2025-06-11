# Class: IotaGasStationFaucetConnector

Class for performing gas station sponsored faucet operations on IOTA.

## Implements

- `IFaucetConnector`

## Constructors

### Constructor

> **new IotaGasStationFaucetConnector**(`options`): `IotaGasStationFaucetConnector`

Create a new instance of IotaGasStationFaucetConnector.

#### Parameters

##### options

[`IIotaGasStationFaucetConnectorConstructorOptions`](../interfaces/IIotaGasStationFaucetConnectorConstructorOptions.md)

The options for the connector.

#### Returns

`IotaGasStationFaucetConnector`

## Properties

### NAMESPACE

> `readonly` `static` **NAMESPACE**: `string` = `"iota"`

The namespace supported by the faucet connector.

***

### CLASS\_NAME

> `readonly` **CLASS\_NAME**: `string`

Runtime name for the class.

#### Implementation of

`IFaucetConnector.CLASS_NAME`

## Methods

### fundAddress()

> **fundAddress**(`identity`, `address`, `timeoutInSeconds`): `Promise`\<`bigint`\>

Fund an address with IOTA using gas station sponsoring.

#### Parameters

##### identity

`string`

The identity of the user to access the vault keys.

##### address

`string`

The address to fund.

##### timeoutInSeconds

`number` = `60`

The timeout in seconds to wait for the funding to complete.

#### Returns

`Promise`\<`bigint`\>

The amount funded.

#### Implementation of

`IFaucetConnector.fundAddress`

***

### createSponsoredTransaction()

> **createSponsoredTransaction**(`identity`): `Promise`\<[`ISponsoredTransactionResult`](../interfaces/ISponsoredTransactionResult.md)\>

Create a sponsored transaction using the gas station.

#### Parameters

##### identity

`string`

The identity of the user to access the vault keys.

#### Returns

`Promise`\<[`ISponsoredTransactionResult`](../interfaces/ISponsoredTransactionResult.md)\>

The sponsored transaction result.
