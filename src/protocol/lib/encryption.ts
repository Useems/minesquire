import * as crypto from "crypto";

export interface EncryptSet {
    sharedSecret: Buffer,
    verifyToken: Buffer
}

export class Encrypt {
    cipher: crypto.Cipher;
    decipher: crypto.Decipher;

    async set(publicKey: Buffer, verifyToken: Buffer) : Promise<EncryptSet> {
        let sharedSecret: Buffer = await new Promise((resolve, _reject) => {
            crypto.randomBytes(16, (_err, buf) => resolve(buf));
        });

        let pemPublicKey = this.generatePublicKey(publicKey.toString("base64"));

        let encryptedSharedSecretBuffer = crypto.publicEncrypt({key: pemPublicKey, padding: crypto.constants.RSA_PKCS1_PADDING}, sharedSecret);
        let encryptedVerifyTokenBuffer = crypto.publicEncrypt({key: pemPublicKey, padding: crypto.constants.RSA_PKCS1_PADDING}, verifyToken);

        this.cipher = crypto.createCipheriv("aes-128-cfb8", sharedSecret, sharedSecret);
        this.decipher = crypto.createDecipheriv("aes-128-cfb8", sharedSecret, sharedSecret);

        return {
            sharedSecret: encryptedSharedSecretBuffer,
            verifyToken: encryptedVerifyTokenBuffer
        };
    }

    private generatePublicKey(publicKey) : string {
        let pem = "-----BEGIN PUBLIC KEY-----\n";
        let maxLineLength = 65;

        while (publicKey.length > 0) {
            pem += publicKey.substring(0, maxLineLength) + '\n';
            publicKey = publicKey.substring(maxLineLength);
        }

        pem += "-----END PUBLIC KEY-----\n";

        return pem;
    }
}
