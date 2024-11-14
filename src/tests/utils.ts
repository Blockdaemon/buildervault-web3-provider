import * as dotenv from 'dotenv'
dotenv.config()
import * as ethers from "ethers"
import { BuildervaultWeb3Provider } from ".."
import Web3 from "web3";

export function getBuildervaultProviderForTesting(extraConfiguration?: any) {

  let providerConfig: { [key: string]: string } = {
    rpcUrl: process.env.BLOCKDAEMON_RPC_URL,
    playerCount: process.env.BUILDERVAULT_PLAYER_COUNT,
    masterKeyId: process.env.BUILDERVAULT_MASTERKEY_ID,
    accountId: process.env.BUILDERVAULT_ACCOUNT_ID,
    addressIndex: process.env.BUILDERVAULT_ADDRESS_INDEX,
    logRequestsAndResponses: true,  // Verbose logging
    ...extraConfiguration
  }; 

  // Todo: dynamically determine number of players and loop through
  if (process.env.BUILDERVAULT_PLAYER_COUNT){

    for (let i = 0; i < Number(process.env.BUILDERVAULT_PLAYER_COUNT); i++) {

      if (!process.env[`BUILDERVAULT_PLAYER${i}_URL`]){
        throw new Error(`BUILDERVAULT_PLAYER${i}_URL is required`)
      } else {
        providerConfig[`player${i}Url`] = process.env[`BUILDERVAULT_PLAYER${i}_URL`] as string

        if (process.env[`BUILDERVAULT_PLAYER${i}_MPCPUBLICKEY`]){
          providerConfig[`player${i}MPCpublicKey`] = process.env[`BUILDERVAULT_PLAYER${i}_MPCPUBLICKEY`] as string
        };  

        if (process.env[`BUILDERVAULT_PLAYER${i}_APIKEY`]){
          providerConfig[`player${i}ApiKey`] = process.env[`BUILDERVAULT_PLAYER${i}_APIKEY`] as string
        };  
        
        if (process.env[`BUILDERVAULT_PLAYER${i}_MTLSPUBLICKEY`]){
          providerConfig[`player${i}mTLSpublicKey`] = process.env[`BUILDERVAULT_PLAYER${i}_MTLSPUBLICKEY`] as string
        }
        if (process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_CERT`]){
          providerConfig[`player${i}ClientCert`] = process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_CERT`] as string
          providerConfig[`player${i}ClientKey`] = process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_KEY`] as string
        }
      }
    }

    return new BuildervaultWeb3Provider(providerConfig)
    
  } else {
    throw new Error(`BUILDERVAULT_PLAYER_COUNT is required`)
  }

}

export function getEthersBuildervaultProviderForTesting(extraConfiguration?: any) {
  return new ethers.providers.Web3Provider(getBuildervaultProviderForTesting(extraConfiguration))
}

export function getWeb3BuildervaultProviderForTesting(extraConfiguration?: any) {
  return new Web3(getBuildervaultProviderForTesting(extraConfiguration))
}