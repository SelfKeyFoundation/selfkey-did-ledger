# SelfKey DID Method

The following document defines a DID method for the SelfKey Identity platform. Although this method provides support to the SelfKey ecosystem and its related applications, the underlying DID platform is fully decentralized, and it's designed to serve as a DID layer for other systems that might find it valuable.

The following specifications are subject to change in the future, yet they **MUST** comply with the latest version of the [generic DID specs](https://w3c-ccg.github.io/did-spec/) as specified by the _W3C Credentials Community Group_.

The functionality for this method is provided by the `DIDLedger` smart contract found in this [repository](https://github.com/SelfKeyFoundation/selfkey-identity).


## DID Scheme

This method shall be identified with the name `selfkey`. A SelfKey DID has the following format:

```
did:selfkey:<32 byte hexadecimal string>
```

For example:

```
did:selfkey:0x58a9d3f14916f6ba75fa57032c4627497b62fa0105f60142b03c3ebab74b7e15
```

The `<32 byte hexadecimal string>` corresponds to a `keccak256` hash of an Ethereum address concatenated with a nonce as generated in the [DIDLedger contract](https://github.com/SelfKeyFoundation/selfkey-identity/blob/develop/contracts/DIDLedger.sol). Specifications for interacting with the ledger can be found at the [README](https://github.com/SelfKeyFoundation/selfkey-identity/blob/develop/README.md) file in the project repository.

DIDs are registered in the ledger contract as controlled by a _single_ Ethereum address which is set by default to the address that originally invokes the `createDID` method. This address can later transfer control to a different address, or update/delete the corresponding DID on the ledger.

### ID-String Generation

Identifier strings are generated in the following line of the `DIDLedger` contract:

```
bytes32 _hash = keccak256(abi.encodePacked(msg.sender, nonce));
```

Where `nonce` is increased on each call, so that the result is considered random and an address is able to create and control multiple DIDs.

## DID Structure On-chain

Every DID record on the ledger presents the following structure:

```
struct DID {
    address controller;
    uint256 created;	// timestamp
    uint256 updated;	// timestamp
    bytes32 metadata;
}
```

The `metadata` attribute is used as information for DID resolvers so that certain meaning can be attributed to the address that is set as the controller. For example, if the controller is an instance of a smart contract (e.g. ERC725), the value to be used as metadata would be `keccak256('ERC725')`. By default, a 32-byte array of value **zero** means the controller address is a simple Ethereum account.

The other fields are self-explanatory.

## DID Operations

The following section defines the operations supported to manage DIDs.

### Create

DID creation is done by submitting a transaction to the `DIDLedger` contract invoking the following method:

* **createDID(bytes32 metadata)**

This will generate the corresponding id-string and assign control to the caller address. A “metadata” can be specified. A 32-byte array of value **zero** as the metadata means that the controller address is a simple Ethereum account. A keccak256 hash of the string `ERC725` denotes an identity contract of the given type as the DID controller. Other types can be defined in the future.

### Read

A DID resolver **MUST** be able to take a `did:selfkey:<id>` string as an input and generate a JSON object providing all information necessary to authenticate and validate the given DID. The DID document is dynamically constructed from the data stored on the DID Ledger and other related contracts (e.g. ERC725). A DID resolved via this method should look like the following:


```js
{
  '@context': 'https://w3id.org/did/v1',
  id: 'did:selfkey:0x58a9d3f14916f6ba75fa57032c4627497b62fa0105f60142b03c3...',
  contract: {
      type: 'ERC725',
      version: '2.7.0',
      ethereumAddress: '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
      createTxId: '0x1d1d899b81ca7731243ceec0421f87dd9910e034890c6b5305'
  },
  publicKey: [{
   	id: 'did:selfkey:0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b#key-1',
   	type: 'Secp256k1VerificationKey2018',
   	owner: 'did:selfkey:0x58a9d3f14916f6ba75fa57032c4627497b62fa0105f603...',
   	ethereumAddress: '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b'}],
}
```

(32 bytes long strings have been truncated for formatting reasons)

In this example, the DID resolves to an address that corresponds to an identity contract instance of type "ERC725". Other types and standards can be included in the future by this method or other protocols interacting with the SelfKey DID Ledger.

#### Simple Resolution

In some cases, a "simple resolution" will suffice (e.g. a payment contract is redirecting funds to a particular DID). To this end, the ledger provides a function to resolve a DID to its controller address:

* **getController(bytes32 id) returns (address)**

### Update

Changes to an identity contract are made through executing transactions directly on the `DIDLedger` contract, which is only be doable by the controller address. The following update methods are provided:

* **setMetadata(bytes32 id, bytes32 _metadata)**: a DID controller can change the `metadata` according to the specific needs of a particular protocol or for personal reasons. The purpose of this field is not strictly defined by the ledger. However, under this DID method, a DID resolver must interpret the metadata value as the type of identity in order to resolve it accordingly.

* **setController(bytes32 id, address newController)**: A DID controller address can transfer control of the DID to a different address.

### Delete

The following method is provided by the ledger contract:

* **deleteDID(bytes32 id)**

Only the controller address is able to delete an existing DID. If the controller address corresponds to an identity smart contract, it's up to the particular implementations to destroy the identity contract as part of this operation or not.

## Extensions to this method

The DID ledger is implemented as a _simple_ layer for on-chain persistent identity registration on the Ethereum network, while allowing the possibility to extend it to include other data and functionality. Extensibility is achieved by using _identity contracts_ as the controller for DIDs on the ledger. In particular, `ERC725` in combination with key management contracts such as `ERC734` is expected to be the common case in which this additional functionality is added (e.g. defining service endpoints, key rotation, delegation and permissioning, etc.), while allowing other standards to be used and even allow the DID owners to change from one contract implementation to the other without losing their identifier.

## Security considerations

The following points should be considered and are open to discussion by the community with regard to general security:

* Since DID documents are not explicitly stored but generated dynamically, they cannot be signed and therefore the relying parties need to _trust_ the resolver code to perform correctly. It's expected that relying parties use verified (e.g. checksummed) versions of the resolver library code provided by SelfKey or other trusted sources with the community.

* Once a controller address transfers control of a DID to a new address, it loses all capability to perform operations on that DID. Thus, this operation has to be performed with due caution in order to avoid mistakes (transferring DID control to the wrong address or an address not under the user control).

* No delegation or recovery mechanisms are defined by this method at the ledger level. Proper recoverability must be implemented via key-management and proxy identity smart contracts (e.g. ERC725 / ERC734). It's expected that this becomes the common practice for DIDs managed under this method.

## Additional notes

Other methods have been proposed to provide _decentralized identity_ on the Ethereum platform, however, the SelfKey DID Method is designed based on the following principles:

* DIDs should _ideally_ be "timestamped" and revocable. Regular ethereum addresses don't satisfy this requirement.

* Public data associated with a DID and the presentation structure for this data should be upgradable according to changes either in the generic specs or this particular method. This is achieved by providing a simple _identifier <-> address_ mapping along with a flexible _metadata_ attribute that a resolver can interpret to resolve in different manners. DIDs under this method are expected to be tied to proxy identity smart contracts that aggregate the necessary data, while allowing simple accounts to also control DIDs to cover certain simple cases.

* A public claim should be able to be made about any arbitrary entities (existing or not on the Ethereum network). In this regard, using `bytes32` as the claim subject type could refer to a SelfKey DID or a hash representing any other arbitrary thing on-chain or off-chain. Although the nature of claims is outside the scope of this method, a public claims registry contract is also being developed to work with DIDs as defined in this document.
