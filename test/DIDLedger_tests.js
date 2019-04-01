const assertThrows = require("./utils/assertThrows")
const { getLog } = require("./utils/txHelpers")
const timeTravel = require("./utils/timeTravel")
const util = require("ethereumjs-util")

const DIDLedger = artifacts.require("./DIDLedger.sol")

const zeroBytes = util.bufferToHex(util.setLengthLeft(0, 32))

contract("DIDLedger", accounts => {
  const [
    admin1,
    admin2,
    whitelisted1,
    whitelisted2,
    whitelisted3,
    user1,
    user2,
    user3] = accounts.slice(0)
  const now = new Date().getTime() / 1000
  let user1DID

  before(async () => {
    ledger = await DIDLedger.new()
    assert.notEqual(ledger, null)
    assert.notEqual(ledger, undefined)
    assert.isTrue(await ledger.isWhitelistAdmin.call(admin1))
  })

  context("Admin management", () => {
    /*it("non admins cannot add new admins", async () => {
      await assertThrows(ledger.addWhitelistAdmin(user2, { from: user1 }))
    })

    it("admins can add new admins", async () => {
      await ledger.addWhitelistAdmin(admin2, { from: admin1 })
      assert.isTrue(await ledger.isWhitelistAdmin.call(admin2))
    })

    it("admins can renounce to their status", async () => {
      await ledger.renounceWhitelistAdmin({ from: admin2 })
      assert.isFalse(await ledger.isWhitelistAdmin.call(admin2))
    })*/

    it("(only) admins can add whitelisted addresses", async () => {
      assert.isFalse(await ledger.isWhitelisted(admin2))
      await assertThrows(ledger.addWhitelisted(whitelisted1, { from: admin2 }))

      await ledger.addWhitelisted(whitelisted1, { from: admin1 })
      await ledger.addWhitelisted(whitelisted2, { from: admin1 })
      await ledger.addWhitelisted(whitelisted3, { from: admin1 })
      assert.isTrue(await ledger.isWhitelisted(whitelisted1))
      assert.isTrue(await ledger.isWhitelisted(whitelisted2))
      assert.isTrue(await ledger.isWhitelisted(whitelisted3))
    })

    /*it("(only) admins can remove whitelisted addresses", async () => {
      await assertThrows(ledger.removeWhitelisted(whitelisted2, { from: user2 }))
      await ledger.removeWhitelisted(whitelisted2, { from: admin1 })
    })

    it("whitelisted can renounce to their status", async () => {
      await ledger.renounceWhitelisted({ from: whitelisted3 })
      assert.isFalse(await ledger.isWhitelisted.call(whitelisted3))
    })*/
  })

  context("DID operations", () => {
    it("(only) whitelisted can add create new DIDs", async () => {
      await assertThrows(ledger.createDID(user1, zeroBytes, { from: user1 }))
      const tx = await ledger.createDID(user1, zeroBytes, { from: whitelisted1 })
      const log = getLog(tx, "CreatedDID")
      user1DID = log.args.id
      const hash = util.bufferToHex(util.keccak256(user1))
      // check the DID created corresponds to the keccak hash of the owner address
      assert.equal(hash, user1DID)

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.controller, user1)
    })

    it("A DID can be resolved into their controller address", async () => {
      const resultAddress = await ledger.resolveDID.call(user1DID)
      assert.equal(resultAddress, user1)
    })

    it("DIDs cannot be re-created", async () => {
      await assertThrows(ledger.createDID(user1, zeroBytes, { from: admin1 }))
    })

    it("(only) identity owners can update DID data", async () => {
      const data = util.bufferToHex(util.setLengthLeft("myData", 32))
      await assertThrows(ledger.updateDID(user1DID, data, { from: user2 }))
      await ledger.updateDID(user1DID, data, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.data, data)
    })

    it("(only) identity owners can remove DIDs", async () => {
      await assertThrows(ledger.deleteDID(user1DID, { from: user2 }))
      await ledger.deleteDID(user1DID, { from: user1 })

      const result = await ledger.dids.call(user1DID)
      assert.equal(result.created, 0)
    })

    it("(only) identity owners can update transfer DID control", async () => {
      let tx = await ledger.createDID(user2, zeroBytes, { from: whitelisted1 })
      let log = getLog(tx, "CreatedDID")
      const user2DID = log.args.id

      let didObj = await ledger.dids.call(user2DID)
      assert.equal(didObj.controller, user2)

      await assertThrows(ledger.changeController(user2DID, user3, { from: admin1 }))
      tx = await ledger.changeController(user2DID, user3, { from: user2 })
      const newAddress = await ledger.resolveDID.call(user2DID)
      assert.equal(newAddress, user3)
    })
  })
})
