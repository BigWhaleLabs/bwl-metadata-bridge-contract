import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { waffle } from 'hardhat'

export function serializeMetadata(
  metadata: [string, string] & {
    name: string
    symbol: string
  }
) {
  return {
    name: metadata.name,
    symbol: metadata.symbol,
  }
}

export default async function getFakeERC721(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}
