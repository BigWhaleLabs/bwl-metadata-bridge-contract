import { ethers } from 'hardhat'
import { expect } from 'chai'
import { getFakeERC721, zeroAddress } from './utils'
import { version } from '../package.json'

describe('BWLMetadataBridge contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.chainIdSrc = 1
    this.chainIdDst = 2

    this.factory = await ethers.getContractFactory('BWLMetadataBridge')
    // Create a LayerZero Endpoint mock
    const LZEndpointMock = await ethers.getContractFactory('LZEndpointMock')
    this.layerZeroEndpointMockSrc = await LZEndpointMock.deploy(this.chainIdSrc)
    this.layerZeroEndpointMockDst = await LZEndpointMock.deploy(this.chainIdDst)

    // Mock ERC721 token
    this.fakeERC721 = await getFakeERC721(this.owner)
    await this.fakeERC721.mock.name.returns('MyERC721')
    await this.fakeERC721.mock.symbol.returns('ME7')
  })
  beforeEach(async function () {
    // Deploy contracts
    this.contractA = await this.factory.deploy(
      this.layerZeroEndpointMockSrc.address,
      this.chainIdDst,
      zeroAddress,
      version
    )
    this.contractB = await this.factory.deploy(
      this.layerZeroEndpointMockDst.address,
      this.chainIdSrc,
      zeroAddress,
      version
    )

    await this.layerZeroEndpointMockSrc.setDestLzEndpoint(
      this.contractB.address,
      this.layerZeroEndpointMockDst.address
    )
    await this.layerZeroEndpointMockDst.setDestLzEndpoint(
      this.contractA.address,
      this.layerZeroEndpointMockSrc.address
    )

    // // Set each contracts source address so it can send to each other
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
        this.layerZeroEndpointMockSrc.address,
        this.chainIdSrc,
        zeroAddress,
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
        this.contractA.trustAddress(this.layerZeroEndpointMockSrc.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
  describe('Metadata storage', function () {
    it('should store token metadata on destination chain', async function () {
      await this.contractA.requestMetadata(this.fakeERC721.address, {
        value: ethers.utils.parseEther('0.5'),
      })
    })
  })
})
