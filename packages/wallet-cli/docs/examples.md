# @gtsc/wallet-cli - Examples

## Command Line Tool

First install the tool with the following script.

```shell
npm install @gtsc/wallet-cli
```

## Running

If you run the tool with no command line options:

```shell
gtsc-wallet
```

You should see output similar to the following

```shell
🌍 GTSC Wallet v1.0.0

Usage: gtsc-wallet [command]

Options:
  -V, --version        output the version number
  --lang <lang>        The language to display the output in. (default: "en")
  --load-env [env...]  Load the env files to initialise any environment variables.
  -h, --help           display help for command

Commands:
  mnemonic [options]   Create a mnemonic.
  address [options]    Create bech32 addresses and keys from the seed.
  faucet [options]     Request funds from the faucet.
  transfer [options]   Transfer funds from one address to another.
```

## Command

### mnemonic

The mnemonic command can be used to generate a new mnemonic for use in the other wallet functions.

```shell
gtsc-wallet mnemonic
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Mnemonic: public certain harsh bundle nature combine put museum witness useful soccer march weather run moon family joke mixture episode fossil flip witness finger myth
Seed: 0x1e5a64b487b85d3aedfdfda9a2c9a1416214f667f1fc2ef6096e20bb41b9b472f462d325596ad0cde00a8d8211d467bd14ce60f6ecc9b4a2b6193d54dddb1287

🎉 Done.
```

There are additional options you can specify for this command, to get the detail on these options issue the following command to get help.

```shell
gtsc-wallet mnemonic --help
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Usage: gtsc-wallet mnemonic [options]

Create a mnemonic, will also generate the equivalent seed in hex and base64 format.

Options:
  --strength <number>     The number of words in the mnemonic, defaults to 256 which produces 24 words. (default: "256")
  --seed-format <format>  The format to output the seed. (choices: "hex", "base64", default: "hex")
  --no-console            Hides the mnemonic and seed in the console.
  --json <filename>       Creates a JSON file containing the mnemonic and seed.
  --env <filename>        Creates an env file containing the mnemonic and seed.
  -h, --help              display help for command
```

#### Mnemonic Examples

To output generate mnemonic and base64 formatted seed, store them in a JSON and env file but not display them to the console you would enter the following.

```shell
gtsc-wallet mnemonic --seed-format base64 --no-console --json my.json --env my.env
```

The env file would look like:

```shell
MNEMONIC="word maze network cabbage romance empty axis scale vintage ride flash soup jelly cook give luxury rigid cigar noodle avocado current write clog little"
SEED="c/MkRa4rgvvf08nJy2v4Yadip5BpE56FW2jDXmjt4TMfoXrCoYo9Hunq9SQdabh+Mox0vR9J3INoVLCZPQ/UtA=="
```

and the JSON file would be:

```json
{
  "mnemonic": "word maze network cabbage romance empty axis scale vintage ride flash soup jelly cook give luxury rigid cigar noodle avocado current write clog little",
  "seed": "c/MkRa4rgvvf08nJy2v4Yadip5BpE56FW2jDXmjt4TMfoXrCoYo9Hunq9SQdabh+Mox0vR9J3INoVLCZPQ/UtA=="
}
```

### address

The address command can be used to generate addresses and key pairs based on the specified seed. The seed can be provided from the command line of read from an environment variable or .env file. By default 10 addresses will be generated starting at address index 0, for account 0.

```shell
gtsc-wallet address --seed 0x01fb73209537a33a2f03e419caed0eba48005b093b9a8ce35a93f5e3a1ad66ceaccb1afd4cd23ccaef3f0210e377a5118c90c7a5f1800be49a42d1c3dc0bb3fc --hrp tst --count 5
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Seed: 0x01fb73209537a33a2f03e419caed0eba48005b093b9a8ce35a93f5e3a1ad66ceaccb1afd4cd23ccaef3f0210e377a5118c90c7a5f1800be49a42d1c3dc0bb3fc
Start: 0
Count: 5
Account: 0
HRP: tst
Coin: 4218
Key Type: Ed25519
Key Format: hex

➡️  Generating addresses

Index: 0
Address: tst1qzl6pvdadahge7yyqdyknrutuwnjafntdjlnfv94vndue9qupkr9242gp8q
Private Key: 0xa72161f8b9714c8382bcb7f72a5ea178880495fa85b1376a138249aaf1b2e837
Public Key: 0xe6994b391c937a604315a9936393f0ef1ad2d49bf5f21573316dc024c1dcb3ae

Index: 1
Address: tst1qq0hu7h6aguva0z0zlayukdjpq3x5dkvyt4gz5gxd7tvuye70sgqvtt0mtn
Private Key: 0xcc57b040833465b530cd87e0c427162a7313f41e15484ef74f641cbb4739d376
Public Key: 0xcfee67931921b9cf86dbb7f91807b27a275f57364e71d849b86bfc8f671d0f32

Index: 2
Address: tst1qpqeq9xrnz7w7wenfa2ku02p73a90cpz6h7lprz458ydxjtsy009sr5kvj6
Private Key: 0x254c4ac4ec71e69bfb244052f8e96435aeefe9da0b0cb432f490fadd51576c49
Public Key: 0x9fc74352fd77f3c49d714eb67339195a291f6e56bdfca9224962815fac3edc62

Index: 3
Address: tst1qzj5chjj2r6es9m50ssy22adlkankz2cf4gch7gs76mnq4l2c4dcktw954r
Private Key: 0x9a58e95dc70b77afa5ac93c5b4af890159c0ca8a69a1971181ba1f4a021edd57
Public Key: 0x42f8ab19112418266e7b84edaa63e12e4ef08106d8ccceb930f0956203532363

Index: 4
Address: tst1qzyyqzdcpufrpg2h8n4ljmzgzcsf0vcym6c7rv8l08s7rufjj2pkzxk9v3h
Private Key: 0xff4ed1b01af12a6b87e9b95a7cdecab4be3ba920e8090457189e0f7b9cff2704
Public Key: 0x19ebdb080b0b8b485249c18ebc841d574429c994830cda139d84b14bf5f92025

🎉 Done.
```

There are additional options you can specify for this command, to get the detail on these options issue the following command to get help.

```shell
gtsc-wallet address --help
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Usage: gtsc-wallet address [options]

Create a number of bech32 addresses and their associated key pairs from the seed.

Options:
  --seed <seed>          The seed to use for generating the addresses, this can be either hex, base64 or an environment variable name. For an environment variable start the value with a !
  --start <number>       The index of the first address to create. (default: "0")
  --count <number>       The number of addresses to create, max 100. (default: "10")
  --account <number>     The account used to generate the bech32 addresses. (default: "0")
  --hrp <hrp>            The human readable part of the bech32 addresses. (default: "iota")
  --coin <coin>          The coin type used to generate the bech32 addresses. (default: "4218")
  --key-type <type>      The type of key to generate. (choices: "Ed25519", "Secp256k1", default: "Ed25519")
  --key-format <format>  The format to output the keys. (choices: "hex", "base64", default: "hex")
  --no-console           Hides the addresses and keys in the console.
  --json <filename>      Creates a JSON file containing the addresses and keys.
  --append-json          If the JSON file already exists append the data instead of overwriting.
  --env <filename>       Creates an env file containing the addresses and keys.
  --append-env           If the env file already exists append the data instead of overwriting.
  -h, --help             display help for command
```

#### Address Examples

To read from an env file and load the variable named SEED from the file, and output only 2 addresses, outputting the keys in base64 format.

```shell
gtsc-wallet address --load-env my.env --seed !SEED --count 2 --key-format base64
```

You can use the options to store the results in JSON or env files, and the `append` options allow you to modify existing files should you wish.

```shell
gtsc-wallet address --load-env my.env --seed !SEED --env my.env --append-env --json my.json --append-json
```

### faucet

The faucet command can be used to provide funds to an address. At a minimum you must provide the address to supply with token, the node for performing transaction and the faucet url.

```shell
gtsc-wallet faucet --address tst1qzl6pvdadahge7yyqdyknrutuwnjafntdjlnfv94vndue9qupkr9242gp8q --faucet https://faucet.testnet.iotaledger.net/api/enqueue --explorer https://explorer.iota.org/iota-testnet/ --node https://api.testnet.iotaledger.net
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Node: https://api.testnet.iotaledger.net
Faucet: https://faucet.testnet.iotaledger.net/api/enqueue
Address: tst1qzl6pvdadahge7yyqdyknrutuwnjafntdjlnfv94vndue9qupkr9242gp8q

➡️  Requesting Funds

Funds Added: 100000000

➡️  Requesting Balance

Balance: 1200000000

Explorer: https://explorer.iota.org/iota-testnet/addr/tst1qzl6pvdadahge7yyqdyknrutuwnjafntdjlnfv94vndue9qupkr9242gp8q

🎉 Done.
```

There are additional options you can specify for this command, to get the detail on these options issue the following command to get help.

```shell
gtsc-wallet faucet --help
```

Output

```shell
🌍 GTSC Wallet v1.0.0

Usage: gtsc-wallet faucet [options]

Request funds from the faucet for the supplied address.

Options:
  --address <address>  The address to fill from the faucet either in bech32 format, or start with ! to read environment variable.
  --node <url>         The url for the node endpoint, or an environment variable name containing the url. (default: "!NODE_URL")
  --faucet <url>       The url for the faucet endpoint, or an environment variable name containing the url. (default: "!FAUCET_URL")
  --explorer <url>     The url for the explorer endpoint, or an environment variable name containing the url. (default: "!EXPLORER_URL")
  -h, --help           display help for command
```

#### Faucet Examples

Instead of supplying the values on the command line you can also load them from a .env file, assuming an config.env file with the following configuration.

```shell
NODE_URL="https://api.testnet.iotaledger.net"
FAUCET_URL="https://faucet.testnet.iotaledger.net/api/enqueue"
EXPLORER_URL="https://explorer.iota.org/iota-testnet/"
```

And a secondary file containing addresses, address.env:

```shell
ADDRESS_0_BECH32="tst1qrjvnhryyfejshv3mj4syu4ul900dqu29f35t8fyevs3fqy6670t5v72w70"
ADDRESS_0_PRIVATE_KEY="0xb50cabaa8965e6c92107a13870631fe1a1daf837fef24f32b339c606c236b4d4"
ADDRESS_0_PUBLIC_KEY="0x64803bf7b52567f91b098ea4372c52064ffa576ee63d4faa04cd79b02d4b4db7"
ADDRESS_1_BECH32="tst1qpjh2cagrdg9t2rvj9vmukhtqp45wex3zjtprwngmh24atze6xuuq2uwzv8"
ADDRESS_1_PRIVATE_KEY="0xf751ec1e0705f1cf37319e734e77e4aecb899f82f4d80554b0333d24414cb7a1"
ADDRESS_1_PUBLIC_KEY="0x90e6dc42cc459f67daa3446b2ec5d4275d30f4513ee47dec9dc0d518d2c9ccf2"
```

You could use the following command script

```shell
gtsc-wallet faucet --load-env config.env address.env --address !ADDRESS_0_BECH32
```
