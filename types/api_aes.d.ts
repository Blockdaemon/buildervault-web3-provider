export class API_AES {
    /**
     * Create a new AES instance, used internally
     * @param {TSMClient} tsmClient
     */
    constructor(tsmClient: TSMClient, _sdkv2: any);
    clientHandle: any;
    sdkv2: any;
    /**
     * Generate a new key in the TSM
     * @param {SessionConfig} sessionConfig
     * @param {Number} threshold
     * @param {Number} keyLength
     * @param {string} desiredKeyID
     * @return {Promise<string>} KeyID
     */
    generateKey(sessionConfig: SessionConfig, threshold: number, keyLength: number, desiredKeyID?: string): Promise<string>;
    /**
     * Export AES key shares from the TSM
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} wrappingKey
     * @return {Promise<{"wrappedKeyShare": Uint8Array, "checksum": Uint8Array}>}
     */
    exportKeyShare(sessionConfig: SessionConfig, keyID: string, wrappingKey: Uint8Array): Promise<{
        "wrappedKeyShare": Uint8Array;
        "checksum": Uint8Array;
    }>;
    /**
     * Import AES key shares into the TSM
     * @param {SessionConfig} sessionConfig
     * @param {Number} threshold
     * @param {Uint8Array} wrappedKeyShare
     * @param {Uint8Array} checksum
     * @param {String} desiredKeyID
     * @return {Promise<String>} KeyID
     */
    importKeyShare(sessionConfig: SessionConfig, threshold: number, wrappedKeyShare: Uint8Array, checksum: Uint8Array, desiredKeyID: string): Promise<string>;
    /**
     * Create an AES CTR key stream
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} iv
     * @param {Number} keyStreamLength
     * @return {Promise<Uint8Array>}
     */
    ctrKeyStream(sessionConfig: SessionConfig, keyID: string, iv: Uint8Array, keyStreamLength: number): Promise<Uint8Array>;
    /**
     * AES CBC encrypt
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} iv
     * @param {Uint8Array} plaintext
     * @return {Promise<Uint8Array>}
     */
    cbcEncrypt(sessionConfig: SessionConfig, keyID: string, iv: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array>;
    /**
     * AES CBC Decrypt
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} iv
     * @param {Uint8Array} ciphertext
     * @return {Promise<Uint8Array>}
     */
    cbcDecrypt(sessionConfig: SessionConfig, keyID: string, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array>;
    /**
     * AES GCM Encrypt
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} iv
     * @param {Uint8Array} plaintext
     * @param {Uint8Array} additionalData
     * @return {Promise<Uint8Array>}
     */
    gcmEncrypt(sessionConfig: SessionConfig, keyID: string, iv: Uint8Array, plaintext: Uint8Array, additionalData: Uint8Array): Promise<Uint8Array>;
    /**
     * AES GCM Decrypt
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} iv
     * @param {Uint8Array} ciphertext
     * @param {Uint8Array} additionalData
     * @param {Uint8Array} tag
     * @return {Promise<Uint8Array>}
     */
    gcmDecrypt(sessionConfig: SessionConfig, keyID: string, iv: Uint8Array, ciphertext: Uint8Array, additionalData: Uint8Array, tag: Uint8Array): Promise<Uint8Array>;
    /**
     * AES Finalize CTR
     * @param {Uint8Array[]} partialResults
     * @return {Promise<Uint8Array>}
     */
    finalizeCTR(partialResults: Uint8Array[]): Promise<Uint8Array>;
    /**
     * AES Finalize CBC Encryption
     * @param {Uint8Array[]} partialResults
     * @return {Promise<Uint8Array>}
     */
    finalizeCBCEncrypt(partialResults: Uint8Array[]): Promise<Uint8Array>;
    /**
     * AES Finalize CBC Decryption
     * @param {Uint8Array[]} partialResults
     * @return {Promise<Uint8Array>}
     */
    finalizeCBCDecrypt(partialResults: Uint8Array[]): Promise<Uint8Array>;
    /**
     * AES Finalize GCM Encryption
     * @param {Uint8Array[]} partialResults
     * @return {Promise<{ciphertext: Uint8Array, authTag: Uint8Array}>}
     */
    finalizeGCMEncrypt(partialResults: Uint8Array[]): Promise<{
        ciphertext: Uint8Array;
        authTag: Uint8Array;
    }>;
    /**
     * AES Finalize GCM Decryption
     * @param {Uint8Array[]} partialResults
     * @return {Promise<Uint8Array>}
     */
    finalizeGCMDecrypt(partialResults: Uint8Array[]): Promise<Uint8Array>;
}
