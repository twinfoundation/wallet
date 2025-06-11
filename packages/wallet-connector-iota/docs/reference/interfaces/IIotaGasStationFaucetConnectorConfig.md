# Interface: IIotaGasStationFaucetConnectorConfig

Configuration for the IOTA Gas Station Faucet Connector.

## Extends

- `IIotaConfig`

## Properties

### clientOptions

> **clientOptions**: `NetworkOrTransport`

The configuration for the client.

#### Inherited from

`IIotaConfig.clientOptions`

***

### network

> **network**: `string`

The network the operations are being performed on.

#### Inherited from

`IIotaConfig.network`

***

### vaultMnemonicId?

> `optional` **vaultMnemonicId**: `string`

The id of the entry in the vault containing the mnemonic.

#### Default

```ts
mnemonic
```

#### Inherited from

`IIotaConfig.vaultMnemonicId`

***

### vaultSeedId?

> `optional` **vaultSeedId**: `string`

The id of the entry in the vault containing the seed.

#### Default

```ts
seed
```

#### Inherited from

`IIotaConfig.vaultSeedId`

***

### coinType?

> `optional` **coinType**: `number`

The coin type.

#### Default

```ts
IOTA 4218
```

#### Inherited from

`IIotaConfig.coinType`

***

### maxAddressScanRange?

> `optional` **maxAddressScanRange**: `number`

The maximum range to scan for addresses.

#### Default

```ts
1000
```

#### Inherited from

`IIotaConfig.maxAddressScanRange`

***

### inclusionTimeoutSeconds?

> `optional` **inclusionTimeoutSeconds**: `number`

The length of time to wait for the inclusion of a transaction in seconds.

#### Default

```ts
60
```

#### Inherited from

`IIotaConfig.inclusionTimeoutSeconds`

***

### gasStationUrl

> **gasStationUrl**: `string`

The gas station service URL.

***

### gasStationAuthToken

> **gasStationAuthToken**: `string`

The authentication token for the gas station API.

***

### identityPkgId?

> `optional` **identityPkgId**: `string`

The package ID for the identity contract on the network.
If not provided, a default value will be used based on the detected network type.

***

### gasBudget?

> `optional` **gasBudget**: `number`

The gas budget for transactions.

#### Default

```ts
50000000
```

***

### walletAddressIndex?

> `optional` **walletAddressIndex**: `number`

The wallet address index to use for identity operations.

#### Default

```ts
0
```
