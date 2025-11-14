import crypto from 'crypto';

export function verifyPaddleSignature(body: string, signature: string): boolean {
  const publicKey = process.env.PADDLE_PUBLIC_KEY;

  if (!publicKey) {
    console.error('❌ Paddle public key is missing!');
    return false;
  }

  const verifier = crypto.createVerify('sha256');
  verifier.update(body, 'utf8');
  verifier.end();

  try {
    return verifier.verify(publicKey, signature, 'base64');
  } catch (err) {
    console.error('❌ Invalid Paddle signature:', err);
    return false;
  }
}
