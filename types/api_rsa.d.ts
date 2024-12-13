export class API_RSA {
    /**
     * Create a new RSA instance, used internally
     * @param {TSMClient} tsmClient
     */
    constructor(tsmClient: TSMClient, _sdkv2: any);
    HashFunctionNone: string;
    HashFunctionSHA1: string;
    HashFunctionSHA256: string;
    clientHandle: any;
    sdkv2: any;
    /**
     * Export RSA key shares from the TSM
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} wrappingKey
     * @return {Promise<{"wrappedKeyShare": Uint8Array, "pkixPublicKey": Uint8Array}>}
     */
    exportKeyShare(sessionConfig: SessionConfig, keyID: string, wrappingKey: Uint8Array): Promise<{
        "wrappedKeyShare": Uint8Array;
        "pkixPublicKey": Uint8Array;
    }>;
    /**
     * Import RSA key shares into the TSM
     * @param {SessionConfig} sessionConfig
     * @param {Uint8Array} wrappedKeyShare
     * @param {String} desiredKeyID
     * @return {Promise<String>} KeyID
     */
    importKeyShare(sessionConfig: SessionConfig, wrappedKeyShare: Uint8Array, desiredKeyID: string): Promise<string>;
    /**
     * Fetch the pkix public key belonging to keyID
     * @param {string} keyID
     * @return {Promise<Uint8Array>} pkixPublicKey
     */
    publicKey(keyID: string): Promise<Uint8Array>;
    /**
     * Sign a message using PKCS1v15
     * @param {string} keyID
     * @param {string} hashFunction
     * @param {Uint8Array} hashed
     * @return {Promise<Uint8Array>} partialSignature
     */
    signPKCS1v15(keyID: string, hashFunction: string, hashed: Uint8Array): Promise<Uint8Array>;
    /**
     * Sign a message using PSS
     * @param {SessionConfig} sessionConfig
     * @param {string} keyID
     * @param {string} hashFunction
     * @param {Uint8Array} digest
     * @return {Promise<Uint8Array>} partialSignature
     */
    signPSS(sessionConfig: SessionConfig, keyID: string, hashFunction: string, digest: Uint8Array): Promise<Uint8Array>;
    /**
     * RSA decrypt
     * @param {String} keyID
     * @param {Uint8Array} ciphertext
     * @return {Promise<Uint8Array>} partialDecryptionResult
     */
    decrypt(keyID: string, ciphertext: Uint8Array): Promise<Uint8Array>;
    /**
     * RSA finalize PKCS1v15 signature
     * @param {String} hashFunction
     * @param {Uint8Array} hashed
     * @param {Uint8Array[]} partialSignatures
     * @return {Promise<Uint8Array>} signature
     */
    finalizeSignPKCS1v15(hashFunction: string, hashed: Uint8Array, partialSignatures: Uint8Array[]): Promise<Uint8Array>;
    /**
     * RSA finalize PKCS1v15 signature
     * @param {String} hashFunction
     * @param {Uint8Array} digest
     * @param {Uint8Array[]} partialSignatures
     * @return {Promise<Uint8Array>} signature
     */
    finalizeSignPSS(hashFunction: string, digest: Uint8Array, partialSignatures: Uint8Array[]): Promise<Uint8Array>;
    /**
     * RSA finalize PKCS1v15 decryption
     * @param {Uint8Array[]} partialDecryptions
     * @return {Promise<Uint8Array>} plaintext
     */
    finalizeDecryptPKCS1v15(partialDecryptions: Uint8Array[]): Promise<Uint8Array>;
    /**
     * RSA finalize OAEP decryption
     * @param {String} hashFunction
     * @param {Uint8Array} label
     * @param {Uint8Array[]} partialDecryptions
     * @return {Promise<Uint8Array>} plaintext
     */
    finalizeDecryptOAEP(hashFunction: string, label: Uint8Array, partialDecryptions: Uint8Array[]): Promise<Uint8Array>;
    /**
     * RSA finalize raw decryption
     * @param {Uint8Array[]} partialDecryptions
     * @return {Promise<Uint8Array>} plaintext
     */
    finalizeDecryptRaw(partialDecryptions: Uint8Array[]): Promise<Uint8Array>;
    /**
     * Verify signature
     * @param {Uint8Array} pkixPublicKey
     * @param {string} hashFunction
     * @param {Uint8Array} hashed
     * @param {Uint8Array} signature
     * @return {Promise<string>}
     */
    verifySignaturePKCS1v15(pkixPublicKey: Uint8Array, hashFunction: string, hashed: Uint8Array, signature: Uint8Array): Promise<string>;
    /**
     * Verify signature
     * @param {Uint8Array} pkixPublicKey
     * @param {string} hashFunction
     * @param {Uint8Array} digest
     * @param {Uint8Array} signature
     * @return {Promise<string>}
     */
    verifySignaturePSS(pkixPublicKey: Uint8Array, hashFunction: string, digest: Uint8Array, signature: Uint8Array): Promise<string>;
}
