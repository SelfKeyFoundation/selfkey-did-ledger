const DIDLedger = artifacts.require("DIDLedger");

module.exports = function(deployer) {
  const result = deployer.deploy(DIDLedger);
  console.log(result)
};
