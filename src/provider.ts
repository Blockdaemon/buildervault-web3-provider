// @ts-ignore
import asn1 from "asn1.js";
import { bytesToHex, keccak256, getAddress } from "viem/utils";
import { BUILDERVAULT_ERROR_CODE } from "./constants";
import { TSMClient, SessionConfig } from "@sepior/tsmsdkv2";
import { AccountAddresses } from "./types";

export async function signMessage(
  TSMClients: TSMClient[],
  masterKeyId: string,
  sessionConfig: SessionConfig,
  accountId: number,
  addressIndex: number,
  messageToSign: Uint8Array,
): Promise<{ r: `0x${string}`; s: `0x${string}`; v: bigint }> {

  let chainPath = new Uint32Array([44, 60, accountId, 0, addressIndex]);

  const partialSignatures: Uint8Array[] = [];

  const partialSignaturePromises: Promise<void>[] = [];

  for (const [_, client] of TSMClients.entries()) {
    const func = async (): Promise<void> => {
      const ecdsaApi = client.ECDSA();
      const partialSignResult = await ecdsaApi.sign(
        sessionConfig,
        masterKeyId,
        chainPath,
        messageToSign
      );

      partialSignatures.push(partialSignResult);
    };

    partialSignaturePromises.push(func());
  }

  await Promise.all(partialSignaturePromises);

  const ecdsaApi = TSMClients[0].ECDSA();

  const signature = await ecdsaApi.finalizeSignature(
    messageToSign,
    partialSignatures
  );

  // Define ASN.1 structure for decoding
  const ASN1Signature = asn1.define("Signature", function (this: asn1.ASN1) {
    this.seq().obj(
      this.key("r").int(),
      this.key("s").int()
    );
  });

  const decodedSignature = ASN1Signature.decode(Buffer.from(signature.signature));

  return {
    r: `0x${decodedSignature.r.toString(16)}`,
    s: `0x${decodedSignature.s.toString(16)}`,
    v: BigInt(signature.recoveryID) + 27n
  };
}

export async function getWalletAccounts(
  TSMClients: TSMClient[],
  masterKeyId: string,
  accountId: number,
  //createError: (error: { message: string }) => Error
) {

  let walletAccounts: AccountAddresses = {};
  walletAccounts[accountId] = [];
  
  // ToDo: include addressIndex in loop when outside 0-5
  for (let i = 0; i < 5; i++) {

    let chainPath = new Uint32Array([44, 60, accountId, 0, i]);
    const pkixPublicKeys: Uint8Array[] = [];
  
    for (const [_, client] of await TSMClients.entries()) {
      const ecdsaApi = client.ECDSA();
      pkixPublicKeys.push(
        await ecdsaApi.publicKey(masterKeyId, chainPath)
      );
    }
  
    // Validate public keys
    for (let i = 1; i < pkixPublicKeys.length; i++) {
        if (Buffer.compare(pkixPublicKeys[0], pkixPublicKeys[i]) !== 0) {
          throw Error("public keys do not match");
        }
      }
      
    const pkixPublicKey = pkixPublicKeys[0];
  
    // Convert the public key into an Ethereum address
    const utils = TSMClients[0].Utils();
    const publicKeyBytes = await utils.pkixPublicKeyToUncompressedPoint(
      pkixPublicKey
    );
  
    // Convert web3 publickey to address
    var publicKeyHex = bytesToHex(publicKeyBytes) as string;
  
    // Remove '0x' prefox 
    if (publicKeyHex.startsWith('0x')) {
      publicKeyHex = publicKeyHex.slice(2);
    }
  
    // Remove the leading '04' byte (which signifies an uncompressed public key)
    if (publicKeyHex.startsWith('04')) {
      publicKeyHex = publicKeyHex.slice(2);
    }
  
    // Compute the keccak256 hash of the public key
    const addressBuffer = keccak256(Buffer.from(publicKeyHex, 'hex'));
  
    // Take the last 20 bytes of the hash, prefix it with '0x', and convert to string
    const depositAddress = getAddress('0x' + addressBuffer.slice(-40));
    // if (!isAddress(depositAddress)) {
    //   throw new Error('Invalid address generated');
    // }
    walletAccounts[accountId][i] = depositAddress;
  }
  return walletAccounts;
}


/**
 * Checks if the error code corresponds to a disconnected state.
 *
 * Determines if provided error code is one of the known
 * error codes that signify a disconnected state, specifically if the wallet
 * or organization was not found.
 *
 * @param {Object} error - The error object containing the error code.
 * @param {number} error.code - The error code to check against known disconnected state codes.
 * @returns {boolean} - Returns true if the error code is for a disconnected state, otherwise false.
 */

// ToDo: masterKeyId not found
export const buildervaultIsDisconnected = (error: { code: number }) => {
  const { WALLET_NOT_FOUND, ORG_NOT_FOUND } = BUILDERVAULT_ERROR_CODE;

  return [WALLET_NOT_FOUND, ORG_NOT_FOUND].includes(error.code);
};
