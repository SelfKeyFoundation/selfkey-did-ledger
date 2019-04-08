const assertThrows = require("./utils/assertThrows")
const { getLog } = require("./utils/txHelpers")
const timeTravel = require("./utils/timeTravel")
const util = require("ethereumjs-util")

const DIDLedger = artifacts.require("./DIDLedger.sol")

const zeroBytes = util.bufferToHex(util.setLengthLeft(0, 32))

contract("DIDLedger", accounts => {
  const now = new Date().getTime() / 1000
  const [
    user1,
    user2,
    user3] = accounts.slice(0)

  let user1DID

  before(async () => {
    ledger = await DIDLedger.new()
    assert.notEqual(ledger, null)
    assert.notEqual(ledger, undefined)
  })

  context("DID operations", () => {
    it("creates new DIDs", async () => {
      let tx = await ledger.createDID(zeroBytes, { from: user1 })
      //console.log("tx = " + JSON.stringify(tx))
      let log = getLog(tx, "CreatedDID")
      user1DID = log.args.id

      // multiple DIDs can be created
      tx = await ledger.createDID(zeroBytes, { from: user1 })
      log = getLog(tx, "CreatedDID")
      user1DID2 = log.args.id
    })

    it("A DID can be resolved into their controller address", async () => {
      const result = await ledger.dids.call(user1DID)
      const result2 = await ledger.dids.call(user1DID2)
      assert.equal(result.controller, user1)
      assert.equal(result.controller, result2.controller)
    })

    it("(only) identity owners can update DID metadata", async () => {
      const meta = web3.utils.keccak256("ERC725")
      await assertThrows(ledger.setMetadata(user1DID, meta, { from: user2 }))
      await ledger.setMetadata(user1DID, meta, { from: user1 })
      const result = await ledger.dids.call(user1DID)
      assert.equal(result.metadata, meta)
    })

    it("(only) identity owners can delete DIDs", async () => {
      await assertThrows(ledger.deleteDID(user1DID, { from: user2 }))
      await ledger.deleteDID(user1DID, { from: user1 })
      const result = await ledger.dids.call(user1DID)
      assert.equal(result.created, 0)
    })

    it("(only) identity owners can transfer DID control", async () => {
      await assertThrows(ledger.setController(user1DID2, user3, { from: user2 }))
      let tx = await ledger.setController(user1DID2, user3, { from: user1 })
      let result = await ledger.dids.call(user1DID2)
      assert.equal(result.controller, user3)
    })
  })
})
