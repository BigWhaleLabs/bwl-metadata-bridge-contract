import type {
  BWLMetadataLedger,
  BWLMetadataLedger__factory,
} from '../typechain'
import type { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

declare module 'mocha' {
  export interface Context {
    // Facoriries for contracts
    factory: BWLMetadataLedger__factory
    // Contract instances
    contract: BWLMetadataLedger
    // Mock contracts
    fakeERC721: MockContract
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
