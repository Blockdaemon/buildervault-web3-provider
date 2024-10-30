import { describe, expect, it, vi } from "vitest"
import * as ethers from "ethers"
import { getWeb3BuildervaultProviderForTesting } from "../utils"

const transferAmount = ethers.utils.parseEther("0.00000000001").toString()
const minAmount = ethers.utils.parseEther("0.001").toString()
const web3 = getWeb3BuildervaultProviderForTesting()

async function getFirstAddressWithBalance() {
  const addresses = await web3.eth.getAccounts()
  for (const address of addresses) {
    const balance = await web3.eth.getBalance(address)
    if (BigInt(balance) > BigInt(minAmount)) {
      return address.toLowerCase()
    }
  }

  throw new Error(`No vault has balance greater than ${transferAmount.toString()}`)
}

describe("Web3: Should be able to transfer ETH", async function () {

  it("Transfer", async function () {

    const addresses = await web3.eth.getAccounts()
    //const fromAddress = await getFirstAddressWithBalance()
    const fromAddress = (await web3.eth.getAccounts())[0]
    const toAddress = addresses.find(x => x != fromAddress)

    if (!toAddress) {
      throw new Error('No toAddress found')
    }

    const toAddressStartingBalance = await web3.eth.getBalance(toAddress)
    const feeData = await web3.eth.calculateFeeData();

    await web3.eth.sendTransaction({
      chainId: await web3.eth.getChainId(),
      from: fromAddress,
      to: toAddress,
      value: transferAmount,
      //gasLimit: 21000,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    })

    const toAddressEndingBalance = await web3.eth.getBalance(toAddress)

    expect(BigInt(toAddressEndingBalance) == (BigInt(toAddressStartingBalance) - BigInt(transferAmount)))
  })
})
