import { ethers } from 'hardhat'
import { expect } from 'chai'
import { version } from '../package.json'
import getFakeERC721, { serializeMetadata } from './utils'

describe('BWLMetadataBridge contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.chainId = 123

    this.factory = await ethers.getContractFactory('BWLMetadataBridge')
    const LayerZeroEndpointMock = await ethers.getContractFactory(
      'LZEndpointMock'
    )
    this.lzEndpointMock = await LayerZeroEndpointMock.deploy(this.chainId)
    // Mock ERC721 token
    this.fakeERC721 = await getFakeERC721(this.owner)
    await this.fakeERC721.mock.name.returns('MyERC721')
    await this.fakeERC721.mock.symbol.returns('ME7')
  })
  beforeEach(async function () {
    // Deploy contracts
    this.contractA = await this.factory.deploy(
      this.lzEndpointMock.address,
      this.chainId,
      version
    )
    this.contractB = await this.factory.deploy(
      this.lzEndpointMock.address,
      this.chainId,
      version
    )

    await this.lzEndpointMock.setDestLzEndpoint(
      this.contractA.address,
      this.lzEndpointMock.address
    )
    await this.lzEndpointMock.setDestLzEndpoint(
      this.contractB.address,
      this.lzEndpointMock.address
    )

    // Set each contracts source address so it can send to each other
    await this.contractA.trustAddress(this.contractB.address)
    await this.contractB.trustAddress(this.contractA.address)
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      expect(await this.contractA.version()).to.equal(version)
      expect(await this.contractB.version()).to.equal(version)
    })
  })
  describe('Owner-only calls from non-owner', function () {
    beforeEach(async function () {
      this.contractA = await this.factory.deploy(
        this.lzEndpointMock.address,
        this.chainId,
        version
      )
      await this.contractA.deployed()
      await this.contractA.transferOwnership(this.user.address)
    })
    it('should have the correct owner', async function () {
      expect(await this.contractA.owner()).to.equal(this.user.address)
    })
    it('should not be able to call setVerifierContract', async function () {
      await expect(
        this.contractA.trustAddress(this.lzEndpointMock.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
  describe('Metadata storage', function () {
    it('should store token metadata on destination chain', async function () {
      const expectedMetadata = {
        name: 'MyERC721',
        symbol: 'ME7',
      }
      await this.contractA.send(this.fakeERC721.address, {
        value: ethers.utils.parseEther('0.5'),
      })
      const metadata = await this.contractB.contractsMetadata(
        this.fakeERC721.address
      )
      const serializedMetadata = serializeMetadata(metadata)

      expect(serializedMetadata).to.deep.equal(expectedMetadata)
    })
  })
})
