pragma solidity ^0.5.4;

import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";

/**
 * @title DIDLedger
 * @dev DID Ledger for the SelfKey DID method.
 * Only whitelisted addresses can add DIDs. Only DID controllers (owners) can update or delete.
 * A DID is controlled by their creator address by default, but control can be assigned to a
 * different adddress by their current controller.
 */
contract DIDLedger is WhitelistedRole {

    struct DID {
        address controller;
        uint256 created;
        uint256 updated;
        bytes32 data;
    }

    mapping(bytes32 => DID) public dids;
    uint256 public nonce = 0;

    event CreatedDID(bytes32 id, address issuedBy, uint256 datetime);
    event UpdatedDID(bytes32 id, uint256 datetime);
    event DeletedDID(bytes32 id, uint256 datetime);
    event ChangedDIDController(bytes32 id, address newController, uint256 datetime);

    modifier onlyController(bytes32 id) {
        require(dids[id].controller == msg.sender, "caller has no control of this DID");
        _;
    }

    /**
     * @dev Register new DID. Only callable by whitelisted admins
     * @param _address — The address to be the controller of the DID
     * @param _data — Arbitrary 32-byte data field. Can be later changed by their owner.
     */
    function createDID(address _address, bytes32 _data)
        public
        onlyWhitelisted
        returns (bytes32)
    {
        bytes32 _hash = keccak256(abi.encodePacked(_address));
        require(dids[_hash].created == 0, "DID already exists");

        dids[_hash].controller = _address;
        dids[_hash].created = now;
        dids[_hash].updated = now;
        dids[_hash].data = _data;

        emit CreatedDID(_hash, msg.sender, dids[_hash].created);
        return _hash;
    }

    /**
     * @dev Update DID. Only callable by DID controller.
     * @param id — The identifier (DID) to be updated
     * @param _data — Arbitrary 32-byte value to be assigned as data.
     */
    function updateDID(bytes32 id, bytes32 _data)
        public
        onlyController(id)
        returns (bool)
    {
        dids[id].data = _data;
        dids[id].updated = now;
        emit UpdatedDID(id, dids[id].updated);
        return true;
    }

    /**
     * @dev Remove DID. Only callable by DID controller.
     * @param id — The identifier (DID) to be deleted
     */
    function deleteDID(bytes32 id)
        public
        onlyController(id)
        returns (bool)
    {
        delete dids[id];
        emit DeletedDID(id, now);
        return true;
    }

    /**
     * @dev Change controller address. Only callable by current DID controller.
     * @param id — The identifier (DID) to be updated
     * @param newController — New controller addresss
     */
    function changeController(bytes32 id, address newController)
        public
        onlyController(id)
        returns (bool)
    {
        dids[id].controller = newController;
        dids[id].updated = now;
        emit ChangedDIDController(id, newController, dids[id].updated);
        return true;
    }

    function resolveDID(bytes32 id)
        public
        view
        returns (address)
    {
        return dids[id].controller;
    }
}
