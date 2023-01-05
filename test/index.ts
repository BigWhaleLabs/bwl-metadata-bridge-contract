import { ethers } from 'hardhat'
import { expect } from 'chai'
import { getFakeERC721, serializeMetadata, zeroAddress } from './utils'
import { version } from '../package.json'

describe('BWLMetadataLedger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]

    this.factory = await ethers.getContractFactory('BWLMetadataLedger')

    // Mock ERC721 token
    this.fakeERC721 = await getFakeERC721(this.owner)
    await this.fakeERC721.mock.name.returns('MyERC721')
    await this.fakeERC721.mock.symbol.returns('ME7')
  })
  beforeEach(async function () {
    // Deploy contracts
    this.contract = await this.factory.deploy(zeroAddress, version)
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      expect(await this.contract.version()).to.equal(version)
    })
  })
  describe('Owner-only calls from non-owner', function () {
    beforeEach(async function () {
      this.contract = await this.factory.deploy(zeroAddress, version)
      await this.contract.deployed()
      await this.contract.transferOwnership(this.user.address)
    })
    it('should have the correct owner', async function () {
      expect(await this.contract.owner()).to.equal(this.user.address)
    })
  })
  describe('Metadata storage', function () {
    it('should store metadata', async function () {
      const expectedMetadata = {
        tokenAddress: this.fakeERC721.address,
        name: 'MyERC721',
        symbol: 'ME7',
      }
      await this.contract.storeMetadata(1, this.fakeERC721.address, {
        tokenAddress: expectedMetadata.tokenAddress,
        name: expectedMetadata.name,
        symbol: expectedMetadata.symbol,
      })
      const metadata = serializeMetadata(
        await this.contract.contractsMetadata(1, this.fakeERC721.address)
      )
      expect(metadata).to.deep.equal(metadata)
    })
    it('should fire request metadata event if metadata does not exist', async function () {
      await expect(this.contract.requestMetadata(1, this.fakeERC721.address))
        .to.emit(this.contract, 'RequestMetadata')
        .withArgs(1, this.fakeERC721.address)
        .to.revertedWith('TokenDoesNotExist')
    })
  })
})
