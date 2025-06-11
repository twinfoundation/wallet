# Gas Station Integration Testing Guide

This guide explains how to set up and test the IOTA Gas Station integration with the wallet connector.

## Overview

The Gas Station allows users to submit transactions without paying gas fees themselves. Instead, a sponsor (the gas station) pays the gas fees on behalf of the user.

## Prerequisites

1. Docker installed on your system
2. IOTA CLI tools installed
3. Access to IOTA testnet

## Setup Instructions

### 1. Clone and Start the Gas Station

```bash
# Clone the gas station repository (if not already done)
git clone [gas-station-repo-url](https://github.com/iotaledger/gas-station.git)
cd gas-station

# Navigate to the docker directory
cd docker

# Generate the configuration file (REQUIRED before starting)
../utils/./gas-station-tool.sh generate-sample-config --config-path config.yaml --docker-compose -n testnet

# This will output something like:
# Generated a new IOTA address. If you plan to use it, please make sure it has enough funds: '0x...'
# Save this address - you'll need to fund it later!

# Start the gas station Docker container with authentication
GAS_STATION_AUTH=qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI= docker-compose up --build -d

# The gas station will be available at http://localhost:9527
```

**Important**: The configuration generation creates a `config.yaml` file with a new private key and sponsor address. Make note of the generated address as you'll need to fund it in the next step.

### 2. Fund the Gas Station Sponsor Address

When the gas station starts, it generates a sponsor address that needs to be funded to pay for gas fees.

**Important**: The sponsor address is derived from the private key configured in the gas station. If you use the same configuration, the address will be consistent across restarts.

#### Get the Sponsor Address

You can find the sponsor address by checking the gas station logs or making a test reservation request:

```bash
# Test gas reservation to see the sponsor address
curl -X POST http://localhost:9527/v1/reserve_gas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI=" \
  -d '{"gas_budget": 10000000, "reserve_duration_secs": 10}'
```

The response will include the `sponsor_address` field.

#### Fund the Sponsor Address

**Example sponsor address from our tests**: `0xef6b5132e74ea74e8508a7353fe0ef448507ced9c2077623706a1faabb2a0764`

```bash
# Fund the sponsor address using IOTA faucet
iota client faucet --address 0xef6b5132e74ea74e8508a7353fe0ef448507ced9c2077623706a1faabb2a0764

# Check the gas balance (should have IOTA tokens after funding)
iota client gas 0xef6b5132e74ea74e8508a7353fe0ef448507ced9c2077623706a1faabb2a0764
```

### 3. Configure Environment Variables (Optional)

You can override the default gas station configuration by setting these environment variables:

```bash
export TEST_GAS_STATION_URL="http://localhost:9527"
export TEST_GAS_STATION_AUTH_TOKEN="qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI="
export TEST_NODE_ENDPOINT="https://api.testnet.iota.cafe"
export TEST_NETWORK="testnet"
```

## Running the Tests

### Full Test Suite

```bash
npm test tests/iotaGasStationFaucetConnector.spec.ts
```

### Individual Tests

```bash
# Test gas station availability only
npm test tests/iotaGasStationFaucetConnector.spec.ts -t "fundAddress should test real gas station availability"

# Test complete sponsored transaction workflow
npm test tests/iotaGasStationFaucetConnector.spec.ts -t "createSponsoredTransaction should execute real gas station workflow"
```

## Gas Station Workflow

The tests demonstrate the complete gas station workflow:

1. **Gas Reservation**: Reserve gas budget from the gas station
2. **Transaction Building**: Create an unsigned transaction with sponsor gas data
3. **User Signing**: Sign the transaction with the user's private key
4. **Gas Station Execution**: Submit the signed transaction to the gas station for co-signing and execution

## Troubleshooting

### Common Issues

#### 401 Unauthorized

```
❌ Gas reservation failed: 401 Unauthorized
```

**Solution**: Check that the `TEST_GAS_STATION_AUTH_TOKEN` matches the token configured in your gas station.

#### Connection Refused

```
❌ Gas reservation failed: Failed to fetch
```

**Solution**: Ensure the gas station Docker container is running on `http://localhost:9527`.

#### Insufficient Gas

```
❌ Transaction submission failed: 400 Bad Request
```

**Solution**: Ensure the sponsor address is funded with enough IOTA tokens.

### Checking Gas Station Logs

```bash
# View gas station container logs
docker-compose logs -f gas-station

# Or if using docker directly
docker logs -f <gas-station-container-id>
```

You should see incoming HTTP requests in the logs when running tests.

## Configuration Details

### Default Configuration

- **Gas Station URL**: `http://localhost:9527`
- **Auth Token**: `qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI=`
- **Gas Budget**: `50,000,000` (50M units)
- **Reserve Duration**: `30` seconds
- **Network**: `testnet`

### Gas Station API Endpoints

- **Reserve Gas**: `POST /v1/reserve_gas`
- **Execute Transaction**: `POST /v1/execute_tx`

## About the Sponsor Address

The sponsor address (`0xef6b5132e74ea74e8508a7353fe0ef448507ced9c2077623706a1faabb2a0764` in our example):

- ✅ **Generated from the gas station's private key configuration**
- ✅ **Consistent across restarts** (if using the same private key)
- ✅ **Must be funded** to pay for sponsored transactions
- ✅ **Visible in gas station logs and API responses**

The address will be the same every time you start the gas station with the same configuration, making it predictable for testing and funding.

## Next Steps

After successful testing, you can integrate this gas station connector into your application by:

1. Instantiating the `IotaGasStationFaucetConnector`
2. Using `fundAddress()` to check gas station availability
3. Using `createSponsoredTransaction()` for sponsored transactions
4. Implementing identity creation with `createSponsoredIdentity()` (when needed)

The tests serve as examples of how to use the connector in real applications.
