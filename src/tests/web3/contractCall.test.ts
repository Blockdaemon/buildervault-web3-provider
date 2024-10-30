import { describe, expect, it } from "vitest"
import { getWeb3BuildervaultProviderForTesting } from "../utils"

const GREETER_ADDRESS = "0x432d810484AdD7454ddb3b5311f0Ac2E95CeceA8"  // Holesky
const GREETER_ABI = [
  {
    "type": "function",
    "name": "greet",
    "inputs": [],
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ]
  },
  {
    "type": "function",
    "name": "setGreeting",
    "inputs": [
      {
        "internalType": "string",
        "name": "_greeting",
        "type": "string"
      }
    ],
    "outputs": []
  }
] as const
const provider = getWeb3BuildervaultProviderForTesting()
const greeting = (new Date()).toISOString()
const greeterContract = new provider.eth.Contract(GREETER_ABI, GREETER_ADDRESS)

async function getFirstAddressWithBalance() {
  const addresses = await provider.eth.getAccounts()
  for (const address of addresses) {
    const balance = await provider.eth.getBalance(address)
    if (BigInt(balance) > BigInt(provider.utils.toWei('0.01', 'ether'))) {
      return address
    }
  }

  throw new Error(`No vault has balance`)
}

describe("Web3: Should be able to call a contract method",  () => {

  it("greet() before", async () => {
    const currentGreeting = await greeterContract.methods.greet().call()

    expect(currentGreeting).to.not.be.equal(greeting)
  })

  it("setGreeting(greeting)", async  () => {
    const receipt = await greeterContract.methods.setGreeting(greeting).send({ from: await getFirstAddressWithBalance() })

    expect(receipt.transactionHash).to.be.not.undefined
  })

  it("greet() after", async  () =>  {
    const currentGreeting = await greeterContract.methods.greet().call()

    expect(currentGreeting).to.be.equal(greeting)
  })
})
