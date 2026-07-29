import { describe, expect, it } from 'vitest';
import { verifyGitHubSignature } from './signature.ts';

describe('verifyGitHubSignature', () => {
  it('accepts the GitHub documentation test vector', async () => {
    const headers = new Headers({
      'X-Hub-Signature-256': 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
    });

    await expect(verifyGitHubSignature(headers, 'Hello, World!', "It's a Secret to Everybody")).resolves.toBe(true);
  });

  it('rejects missing, malformed, and incorrect signatures', async () => {
    await expect(verifyGitHubSignature(new Headers(), 'body', 'secret')).resolves.toBe(false);
    await expect(
      verifyGitHubSignature(new Headers({ 'X-Hub-Signature-256': 'sha256=invalid' }), 'body', 'secret'),
    ).resolves.toBe(false);
    await expect(
      verifyGitHubSignature(new Headers({ 'X-Hub-Signature-256': `sha256=${'0'.repeat(64)}` }), 'body', 'secret'),
    ).resolves.toBe(false);
  });
});
