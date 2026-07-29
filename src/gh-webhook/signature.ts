export async function verifyGitHubSignature(headers: Headers, body: string, secret: string): Promise<boolean> {
  const signature = headers.get('X-Hub-Signature-256');
  const match = signature?.match(/^sha256=([0-9a-f]{64})$/i);

  if (!match) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'verify',
  ]);
  const signatureBytes = Uint8Array.from(match[1].match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));

  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body));
}
