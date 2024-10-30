import * as dotenv from 'dotenv'
dotenv.config()
import * as ethers from "ethers"
import { BuildervaultWeb3Provider } from ".."
import Web3 from "web3";

export function getBuildervaultProviderForTesting(extraConfiguration?: any) {
  if (!process.env.BLOCKDAEMON_RPC_URL ||
    !process.env.BUILDERVAULT_PLAYER0_URL ||
    !process.env.BUILDERVAULT_PLAYER0_APIKEY ||
    !process.env.BUILDERVAULT_PLAYER1_URL ||
    !process.env.BUILDERVAULT_PLAYER1_APIKEY ||
    !process.env.BUILDERVAULT_MASTERKEY_ID) {
    throw new Error("Environment variables BLOCKDAEMON_RPC_URL, BUILDERVAULT_PLAYER0_URL, BUILDERVAULT_PLAYER0_APIKEY must be set")
  }

  const providerConfig = {
    rpcUrl: process.env.BLOCKDAEMON_RPC_URL,
    player0Url: process.env.BUILDERVAULT_PLAYER0_URL,
    player0ApiKey: process.env.BUILDERVAULT_PLAYER0_APIKEY,
    player1Url: process.env.BUILDERVAULT_PLAYER1_URL,
    player1ApiKey: process.env.BUILDERVAULT_PLAYER1_APIKEY,
    masterKeyId: process.env.BUILDERVAULT_MASTERKEY_ID,
    accountId: process.env.BUILDERVAULT_ACCOUNT_ID,
    addressIndex: process.env.BUILDERVAULT_ADDRESS_INDEX,
    logRequestsAndResponses: true,  // Verbose logging
    ...extraConfiguration
  };


  const provider = new BuildervaultWeb3Provider(providerConfig)

  return provider
}

export function getEthersBuildervaultProviderForTesting(extraConfiguration?: any) {
  return new ethers.providers.Web3Provider(getBuildervaultProviderForTesting(extraConfiguration))
}

export function getWeb3BuildervaultProviderForTesting(extraConfiguration?: any) {
  return new Web3(getBuildervaultProviderForTesting(extraConfiguration))
}