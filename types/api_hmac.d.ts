export class API_HMAC {
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
     * Export HMAC key shares from the TSM
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
     * Import key shares into the TSM
     * @param {SessionConfig} sessionConfig
     * @param {Number} threshold
     * @param {Uint8Array} wrappedKeyShare
     * @param {Uint8Array} checksum
     * @param {String} desiredKeyID
     * @return {Promise<String>} KeyID
     */
    importKeyShare(sessionConfig: SessionConfig, threshold: number, wrappedKeyShare: Uint8Array, checksum: Uint8Array, desiredKeyID: string): Promise<string>;
    /**
     * Create a HMAC SHA256
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} data
     * @return {Promise<Uint8Array>} Partial Result
     */
    hmacSHA256(sessionConfig: SessionConfig, keyID: string, data: Uint8Array): Promise<Uint8Array>;
    /**
     * Create a HMAC SHA512
     * @param {SessionConfig} sessionConfig
     * @param {String} keyID
     * @param {Uint8Array} data
     * @return {Promise<Uint8Array>} Partial Result
     */
    hmacSHA512(sessionConfig: SessionConfig, keyID: string, data: Uint8Array): Promise<Uint8Array>;
    /**
     * HMAC Finalize
     * @param {Uint8Array[]} partialResults
     * @return {Promise<Uint8Array>}
     */
    finalizeHMAC(partialResults: Uint8Array[]): Promise<Uint8Array>;
}
