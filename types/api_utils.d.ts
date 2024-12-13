export class API_Utils {
    /**
     * Create a new Key Management instance, used internally
     * @param {TSMClient} tsmClient
     */
    constructor(_sdkv2: any);
    sdkv2: any;
    /**
     * Generate ECDSA key pair
     * @param curveName, one of "P-224", "P-256", "P-384", "P-521"
     * @return {Promise<{"pkcs8PrivateKey": Uint8Array, "spkiPublicKey": Uint8Array}>}
     */
    generateECDSAKeyPair(curveName: any): Promise<{
        "pkcs8PrivateKey": Uint8Array;
        "spkiPublicKey": Uint8Array;
    }>;
    /**
     * Transform pkix public key (only ECDSA) to uncompressed point
     * @param {Uint8Array} spkiPublicKey
     * @return {Promise<Uint8Array>}
     */
    pkixPublicKeyToUncompressedPoint(spkiPublicKey: Uint8Array): Promise<Uint8Array>;
    /**
     * Transform PKIX public key (ECDSA or Schnoor) into compressed point
     * @param {Uint8Array} spkiPublicKey
     * @return {Promise<Uint8Array>}
     */
    pkixPublicKeyToCompressedPoint(spkiPublicKey: Uint8Array): Promise<Uint8Array>;
    /**
     * Transform ecPoint into PKIX public key
     * @param {string} curveName
     * @param {Uint8Array} ecPoint
     * @return {Promise<Uint8Array>}
     */
    ecPointToPKIXPublicKey(curveName: string, ecPoint: Uint8Array): Promise<Uint8Array>;
    /**
     * PrivateKeyToPKIXPublicKey returns the public key for a given private key. The private key must be a raw
     * EC key. The corresponding public key is returned as a SubjectPublicKeyInfo structure (see RFC 5280, Section 4.1).
     * @param {Uint8Array} privateKey
     * @param {String} curveName
     * @return {Promise<Uint8Array>}
     */
    privateKeyToPKIXPublicKey(privateKey: Uint8Array, curveName: string): Promise<Uint8Array>;
    /**
     * ShamirRecombine interpolates the shares, and returns the secret in big endian format.
     * This method can be used to obtain a key from the secret shares of the key exported from the TSM.
     * @param {int} threshold
     * @param {Map} shares map of shares, with player index as key
     * @param {String} curveName
     * @return {Promise<Uint8Array>}
     */
    shamirRecombine(threshold: int, shares: Map<any, any>, curveName: string): Promise<Uint8Array>;
    /**
     * Create a Shamir Secret Share of a value
     * @param {Number} threshold
     * @param {Uint32Array} players
     * @param {string} curveName
     * @param {Uint8Array} value
     * @return {Promise<Map>}
     */
    shamirSecretShare(threshold: number, players: Uint32Array, curveName: string, value: Uint8Array): Promise<Map<any, any>>;
    /**
     * Wrap a value using the SPKI public key
     * @param {Uint8Array} spkiPublicKey
     * @param {Uint8Array} value
     * @return {Promise<Uint8Array>}
     */
    wrap(spkiPublicKey: Uint8Array, value: Uint8Array): Promise<Uint8Array>;
    /**
     * Unwrap a value using the PKCS#8 private key
     * @param {Uint8Array} pkcs8PrivateKey
     * @param {Uint8Array} wrappedValue
     * @return {Promise<Uint8Array>}
     */
    unwrap(pkcs8PrivateKey: Uint8Array, wrappedValue: Uint8Array): Promise<Uint8Array>;
    /**
     * Secret share an RSA private key
     * @param {Number} threshold
     * @param {Uint32Array} players
     * @param {Uint8Array} privateKey
     * @return {Promise<Map>} map of shares, with player index as key
     */
    rsaSecretShare(threshold: number, players: Uint32Array, privateKey: Uint8Array): Promise<Map<any, any>>;
    /**
     * Recombine an RSA private key
     * @param {Object} shares map of shares, with player index as key
     * @return {Promise<Uint8Array>}
     */
    rsaRecombine(shares: any): Promise<Uint8Array>;
    /**
     * Secret share an AES private key
     * @param {Uint32Array} players
     * @param {Uint8Array} aesKey
     * @return {Promise<{sharesMap: Map, checksum: Uint8Array}>} map of shares, with player index as key
     */
    aesSecretShare(players: Uint32Array, aesKey: Uint8Array): Promise<{
        sharesMap: Map<any, any>;
        checksum: Uint8Array;
    }>;
    /**
     * Recombine an AES private key
     * @param {Object} shares map of shares, with player index as key
     * @param {Uint8Array} checksum
     * @return {Promise<Uint8Array>}
     */
    aesRecombine(shares: any, checksum: Uint8Array): Promise<Uint8Array>;
    /**
     * Secret share an HMAC private key
     * @param {Uint32Array} players
     * @param {Uint8Array} hmacKey
     * @return {Promise<{sharesMap: Map, checksum: Uint8Array}>} map of shares, with player index as key
     */
    hmacSecretShare(players: Uint32Array, hmacKey: Uint8Array): Promise<{
        sharesMap: Map<any, any>;
        checksum: Uint8Array;
    }>;
    /**
     * Recombine an HMAC private key
     * @param {Object} shares map of shares, with player index as key
     * @param {Uint8Array} checksum
     * @return {Promise<Uint8Array>}
     */
    hmacRecombine(shares: any, checksum: Uint8Array): Promise<Uint8Array>;
    /**
     * Wrap a value using public key
     * @param {Uint8Array} spkiPublicKey
     * @param {Uint8Array} value
     * @return {Promise<Uint8Array>}
     */
    envelopWrap(spkiPublicKey: Uint8Array, value: Uint8Array): Promise<Uint8Array>;
    /**
     * Unwrap a wrapped value using private key
     * @param {Uint8Array} pkcs8PrivateKey
     * @param {Uint8Array} wrappedValue
     * @return {Promise<Uint8Array>}
     */
    envelopeUnwrap(pkcs8PrivateKey: Uint8Array, wrappedValue: Uint8Array): Promise<Uint8Array>;
}
