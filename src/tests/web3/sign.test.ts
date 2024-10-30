import { describe, expect, it } from "vitest"
import * as ethers from "ethers"
import { recover } from 'web3-eth-accounts';
import { getWeb3BuildervaultProviderForTesting } from "../utils"

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const web3 = getWeb3BuildervaultProviderForTesting()

describe("Web3: Should be able to sign using BuilderVault", () => {

  it("signMessage", async () => {
    const message = "hello world"
    const signerAddress = (await web3.eth.getAccounts())[0]

    const signature = await web3.eth.personal.sign(message, signerAddress, "")

    const recoveredAddress = recover(message, signature)

    expect(recoveredAddress).to.be.equals(signerAddress)
  })

  it("eth_signTypedData_v4", async () => {
    const signerAddress = (await web3.eth.getAccounts())[0]

    const domain = {
      name: "FAKE Coin",
      version: "0",
      chainId: 0,
      verifyingContract: NULL_ADDRESS
    }

    const types = {
      Permit: [
        {
          name: "owner",
          type: "address"
        },
        {
          name: "spender",
          type: "address"
        },
        {
          name: "value",
          type: "uint256"
        },
        {
          name: "nonce",
          type: "uint256"
        },
        {
          name: "deadline",
          type: "uint256"
        }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    }
    const message = {
      owner: NULL_ADDRESS,
      spender: NULL_ADDRESS,
      value: 1,
      nonce: 1,
      deadline: 1
    }
    const primaryType = "Permit"

    const data = {
      types,
      domain,
      message,
      primaryType,
    };

    const signature = await web3.currentProvider?.request({
      method: "eth_signTypedData_v4",
      params: [signerAddress, data],
    })

    // @ts-ignore
    delete types.EIP712Domain
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature as any);

    expect(recoveredAddress).to.be.equals(signerAddress)
  })
})