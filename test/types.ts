import type {
  BWLMetadataBridge,
  BWLMetadataBridge__factory,
  LZEndpointMock,
} from '../typechain'
import type { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

declare module 'mocha' {
  export interface Context {
    // Facoriries for contracts
    factory: BWLMetadataBridge__factory
    // Contract instances
    contractA: BWLMetadataBridge
    contractB: BWLMetadataBridge
    // Mock contracts
    fakeERC721: MockContract
    lzEndpointMock: LZEndpointMock
    // Contracts metadata
    chainId: number
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
