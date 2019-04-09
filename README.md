# selfkey-identity

Implementation of the `DIDLedger` contract that supports the [SelfKey DID method](./DIDMethodSpecs.md).

<!--
* `develop` — [![CircleCI](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/develop.svg?style=svg)](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/develop)
* `master` — [![CircleCI](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/master.svg?style=svg)](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/master)-->

## Overview

The `DIDLedger` contract works as a _public_ DID ledger for _decentralized identifiers_ as
specified in the [SelfKey DID method](./DIDMethodSpecs.md) specs document. Any Ethereum account can generate a DID and manage it through the provided public method interface.

### Method interface

* **createDID(bytes32 _metadata)**: generates a new DID associated with the caller address as the
controller. An "optional" `_metadata` parameter is allowed to be used as information for any
resolvers dealing with this method. By default, it's assumed that a 32-byte array with value of *zero* means that the controller address is a regular Ethereum account.

* **setMetadata(bytes32 id, bytes32 _metadata)**: a DID controller can change the `metadata` according to the specific needs of a particular protocol or for personal reasons. The purpose of this field is not strictly defined by the ledger. However, under the [SelfKey DID method](./DIDMethodSpecs.md), a DID resolver must interpret the metadata value as the type of identity in order to resolve it accordingly. For example: if the controller address is an instance of a smart contract (e.g. ERC725), the value to be used as metadata would be `keccak256('ERC725')`. Other protocols or applications might choose to use this attribute in a different manner.

* **deleteDID(bytes32 id)**: callable by the controller address. Deletes the DID from the ledger.

* **setController(bytes32 id, address newController)**: DID controller address can transfer control
of the DID specified as `id` to a different address `newController`.

* **getController(bytes32 id) returns (address)**: resolves a DID to its controller address.

### Example web3 code

Using web3 v1.0, the following illustrates how to interact with the `DIDLedger` contract, either
from the truffle console or any client-facing app:

#### Loading the contract

```javascript
const fs = require('fs')
const ledgerAddress = '0x24512422CF6AD1c0C465cBF0Bbd5155EaA3DA634'
const ledgerABI = JSON.parse(fs.readFileSync('./build/contracts/DIDLedger.json')).abi
const ledger = new web3.eth.Contract(ledgerABI, ledgerAddress)
```

#### Creating a DID

```javascript
const zero = web3.utils.hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000000')
let tx = ledger.methods.createDID(zero).send({ 'from': '0xaf04420C45fc6a063c531C13D9850e4Aa5d951b4' })
```

If making these tests using the truffle console, the `from` address should be set to that being
loaded from the `wallet.json` mnemonic key.

#### Retrieving the DID from the transaction data

```javascript
let did
tx.then((result) => { did = result.events.CreatedDID.returnValues.id })
```

#### Resolving a DID to its controller address

```javascript
ledger.methods.getController(did).call()
```

If desired to get more info about a DID (e.g. metadata, creation and update datetimes), the `dids`
mapping should be accessed directly as follows:

```javascript
ledger.methods.dids(did).call()
```

## Development

The smart contracts are being implemented in Solidity `0.5.4`.

### Pre-requisites

* [NodeJS](htps://nodejs.org), version 9.5+
* [truffle](http://truffleframework.com/)
* [Ganache](https://truffleframework.com/ganache)

### Initialization

    npm install

### Setting up a wallet

Truffle configuration file (`truffle-config.js`) assumes there should be a file `local/wallet.json`
with a list of BIP32 mnemonic words encoding a wallet's private key.

(local directory already added to `.gitignore` to prevent accidental pushing of private keys to
github).

An **example** `wallet.json` file should look like this:

```javascript
{
  "mnemonic":
    "swear tourist road ready scout venture elephant quick pull dress stock trick"
}
```

### Testing

For local testing, open a new terminal window and run `ganache-cli`, then on the project directory:

    npm test

or run tests with code coverage:

    npm run test:cov

Note: any running instance of `ganache-cli` will need to be closed for running the tests with
coverage since `solidity-coverage` runs its own local environment.

To interact with contracts deployed on Ethereum (e.g. Ropsten testnet), open truffle console:

    truffle console --network ropsten

#### Linting

We provide the following linting command for inspecting solidity contracts:

    npm run lint:sol

### Deploying

Run the following truffle command in order to deploy (e.g. Ropsten testnet)

    truffle migrate --network ropsten -f 2

This will run the second migration file, which deploys the DID ledger to the specified network.

Parameters for connecting to each network are specified in the `truffle-config.js` file.

For info on other Truffle commands, see [truffleframework.com](http://truffleframework.com).

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
