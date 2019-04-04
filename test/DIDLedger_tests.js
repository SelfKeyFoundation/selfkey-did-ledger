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
      let log = getLog(tx, "CreatedDID")
      user1DID = log.args.id

      // multiple DIDs can be created
      tx = await ledger.createDID(zeroBytes, { from: user1 })
      log = getLog(tx, "CreatedDID")
      user1DID2 = log.args.id
    })

    it("A DID can be resolved into their controller address", async () => {
      const resultAddress = await ledger.resolveDID.call(user1DID)
      const resultAddress2 = await ledger.resolveDID.call(user1DID2)
      assert.equal(resultAddress, user1)
      assert.equal(resultAddress, resultAddress2)
    })

    it("(only) identity owners can update DID metadata", async () => {
      const meta = web3.utils.keccak256("ERC725")
      await assertThrows(ledger.updateTag(user1DID, meta, { from: user2 }))
      await ledger.updateTag(user1DID, meta, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.tag, meta)
    })

    it("(only) identity owners can delete DIDs", async () => {
      await assertThrows(ledger.deleteDID(user1DID, { from: user2 }))
      await ledger.deleteDID(user1DID, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.created, 0)
    })

    it("(only) identity owners can transfer DID control", async () => {
      await assertThrows(ledger.changeController(user1DID2, user3, { from: user2 }))
      let tx = await ledger.changeController(user1DID2, user3, { from: user1 })
      let newAddress = await ledger.resolveDID.call(user1DID2)
      assert.equal(newAddress, user3)
    })
  })
})
