const assertThrows = require("./utils/assertThrows")
const { getLog } = require("./utils/txHelpers")
const timeTravel = require("./utils/timeTravel")
const util = require("ethereumjs-util")

const DIDLedger = artifacts.require("./DIDLedger.sol")

// HOW TO ASSIGN 32 BYTE VALUES
//const valueBytes = web3.utils.hexToBytes(util.bufferToHex(util.setLengthLeft(21, 32)))
//const keyBytes = web3.utils.hexToBytes(util.bufferToHex(util.setLengthLeft("age", 32)))
const zeroBytes = util.bufferToHex(util.setLengthLeft(0, 32))

contract("DIDLedger", accounts => {
  const [admin1, admin2, user1, user2, user3] = accounts.slice(0)
  const now = new Date().getTime() / 1000
  let user1DID

  before(async () => {
    ledger = await DIDLedger.new()
    assert.notEqual(ledger, null)
    assert.notEqual(ledger, undefined)
    assert.isTrue(await ledger.isWhitelistAdmin.call(admin1))
  })


  context("Admin management", () => {
    it("non admins cannot add new admins", async () => {
      await assertThrows(ledger.addWhitelistAdmin(user2, { from: user1 }))
    })

    it("admins can add new admins", async () => {
      await ledger.addWhitelistAdmin(admin2, { from: admin1 })
      assert.isTrue(await ledger.isWhitelistAdmin.call(admin2))
    })

    it("admins can renounce to their status", async () => {
      await ledger.renounceWhitelistAdmin({ from: admin2 })
      assert.isFalse(await ledger.isWhitelistAdmin.call(admin2))
    })
  })

  context("DID operations", () => {
    it("admins (and only admins) can add create new DIDs", async () => {
      await assertThrows(ledger.createDID(user2, zeroBytes, { from: user1 }))
      const tx = await ledger.createDID(user1, zeroBytes, { from: admin1 })
      const log = getLog(tx, "CreatedDID")
      user1DID = log.args.id
      const hash = util.bufferToHex(util.keccak256(user1))
      // check the DID created corresponds to the keccak hash of the owner address
      assert.equal(hash, user1DID)

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.controller, user1)
    })

    it("DIDs cannot be re-created", async () => {
      await assertThrows(ledger.createDID(user1, zeroBytes, { from: admin1 }))
    })

    it("Identity owners (and only they) can update DID data", async () => {
      const data = util.bufferToHex(util.setLengthLeft("myData", 32))
      await assertThrows(ledger.updateDID(user1DID, data, { from: user2 }))
      await ledger.updateDID(user1DID, data, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.data, data)
    })

    it("Identity owners (and only they) can remove DIDs", async () => {
      await assertThrows(ledger.deleteDID(user1DID, { from: user2 }))
      await ledger.deleteDID(user1DID, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.created, 0)
    })

    it("Identity owners (and only they) can update transfer DID control", async () => {
      let tx = await ledger.createDID(user2, zeroBytes, { from: admin1 })
      let log = getLog(tx, "CreatedDID")
      const user2DID = log.args.id

      let didObj = await ledger.dids.call(user2DID)
      assert.equal(didObj.controller, user2)

      await assertThrows(ledger.changeController(user2DID, user3, { from: admin1 }))
      tx = await ledger.changeController(user2DID, user3, { from: user2 })
      log = getLog(tx, "ChangedDIDController")
      const newController = log.args.newController
      assert.equal(newController, user3)

      didObj = await ledger.dids.call(user2DID)
      assert.equal(didObj.controller, user3)



    })
  })
})
