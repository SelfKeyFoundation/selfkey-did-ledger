pragma solidity ^0.5.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DIDLedger.sol";

contract TestDIDLedger {
    DIDLedger ledger = DIDLedger(DeployedAddresses.DIDLedger());

    function testDIDCreationAndResolution() public {
        bytes32 did = ledger.createDID(bytes32(0));
        (address controller, uint256 created, uint256 updated, bytes32 meta) =  ledger.dids(did);
        Assert.equal(controller, address(this), "DID controller is not initialized correctly");
        Assert.equal(created, updated, "DID timestamps are not correct");
        Assert.equal(created, now, "DID creation datetime is not correct");
        Assert.equal(meta, bytes32(0), "DID metadata is not initialized correctly");
    }

    function testGetController() public {
        bytes32 did = ledger.createDID(bytes32(0));
        address result = ledger.getController(did);
        Assert.equal(result, address(this), "Controller address is not resolved correctly");
    }

    function testSetController() public {
        address dummy = 0xe83E4e869dD693349B0c8F2755EbD46169CA5b75;
        bytes32 did = ledger.createDID(bytes32(0));
        ledger.setController(did, dummy);
        address result = ledger.getController(did);
        Assert.equal(result, dummy, "Controller address is not updated correctly");
    }
}
