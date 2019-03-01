# selfkey-identity

Smart contracts that support Selfkey decentralized identity platform.

* `develop` — [![CircleCI](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/develop.svg?style=svg)](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/develop)
* `master` — [![CircleCI](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/master.svg?style=svg)](https://circleci.com/gh/SelfKeyFoundation/selfkey-identity/tree/master)

## Overview

Selfkey implementation of [ERC725 identity standard](https://github.com/ethereum/eips/issues/725)
based identity platform.

`IdentityFactory` is an upgradable contract that deploys ERC725 instances on behalf of their owners,
setting up everything necessary to function as SelfKey identities. ERC725 instances, however, remain
in complete control of their owners once deployed.

## Development

The smart contracts are being implemented in Solidity `0.4.23`.

### Prerequisites

* [NodeJS](htps://nodejs.org), version 9.5+ (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
* [truffle](http://truffleframework.com/), which is a comprehensive framework for Ethereum development. `npm install -g truffle` — this should install Truffle v4+.  Check that with `truffle version`.
* [Access to the KYC_Chain Jira](https://kyc-chain.atlassian.net)

### Initialisation

    npm install

### Testing

#### Standalone

    npm test

or with code coverage

    npm run test:cov

#### From within Truffle

Run the `truffle` development environment

    truffle develop

then from the prompt you can run

    compile
    migrate
    test

as well as other Truffle commands. See [truffleframework.com](http://truffleframework.com) for more.

### Linting

We provide the following linting command for inspecting solidity contracts.

* `npm run lint:sol` — to lint the Solidity files, and

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
