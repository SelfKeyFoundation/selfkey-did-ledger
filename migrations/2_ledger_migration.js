const DIDLedger = artifacts.require("DIDLedger");

module.exports = function(deployer) {
  deployer.deploy(DIDLedger);
};
