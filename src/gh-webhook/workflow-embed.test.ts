import { describe, expect, it } from 'vitest';
import { buildWorkflowRunEmbed, type WorkflowRunPayload } from './workflow-embed.ts';

function makePayload(overrides?: Record<string, unknown> & { action?: string }): WorkflowRunPayload {
  const { action, ...workflowRunOverrides } = overrides ?? {};
  return {
    action: action ?? 'completed',
    workflow_run: {
      name: 'CI',
      head_branch: 'main',
      head_sha: 'abc1234567890def',
      run_number: 42,
      conclusion: 'success',
      html_url: 'https://github.com/biomejs/biome/actions/runs/123456',
      actor: {
        login: 'ematipico',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234',
        html_url: 'https://github.com/ematipico',
      },
      updated_at: '2026-04-27T10:00:00Z',
      ...workflowRunOverrides,
    },
    repository: {
      full_name: 'biomejs/biome',
      html_url: 'https://github.com/biomejs/biome',
    },
  } as WorkflowRunPayload;
}

describe('buildWorkflowRunEmbed', () => {
  it('builds a green embed for success', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ conclusion: 'success' }));
    expect(embed.color).toBe(0x28a745);
    expect(embed.title).toContain('success');
    expect(embed.title).toContain('CI');
    expect(embed.title).toContain('#42');
  });

  it('builds a red embed for failure', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ conclusion: 'failure' }));
    expect(embed.color).toBe(0xd73a49);
    expect(embed.title).toContain('failure');
  });

  it('builds a yellow embed for cancelled', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ conclusion: 'cancelled' }));
    expect(embed.color).toBe(0xdbab09);
  });

  it('builds a yellow embed for timed_out', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ conclusion: 'timed_out' }));
    expect(embed.color).toBe(0xdbab09);
    expect(embed.title).toContain('timed out');
  });

  it('builds a blue embed for in_progress action', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ action: 'in_progress', conclusion: null }));
    expect(embed.color).toBe(0x0366d6);
    expect(embed.title).toContain('in progress');
  });

  it('uses gray fallback for unknown conclusion', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ conclusion: null }));
    expect(embed.color).toBe(0x6a737d);
    expect(embed.title).toContain('unknown');
  });

  it('displays shortened SHA in text but full SHA in the commit URL', () => {
    const embed = buildWorkflowRunEmbed(makePayload({ head_sha: 'abc1234567890def' }));
    expect(embed.description).toContain('[`abc1234`]');
    expect(embed.description).toContain('/commit/abc1234567890def');
  });

  it('links to the workflow run', () => {
    const embed = buildWorkflowRunEmbed(makePayload());
    expect(embed.url).toBe('https://github.com/biomejs/biome/actions/runs/123456');
  });

  it('sets the actor as author', () => {
    const embed = buildWorkflowRunEmbed(makePayload());
    expect(embed.author?.name).toBe('ematipico');
    expect(embed.author?.url).toBe('https://github.com/ematipico');
    expect(embed.author?.icon_url).toContain('avatars.githubusercontent.com');
  });

  it('sets repository as footer', () => {
    const embed = buildWorkflowRunEmbed(makePayload());
    expect(embed.footer?.text).toBe('biomejs/biome');
  });

  it('includes timestamp', () => {
    const embed = buildWorkflowRunEmbed(makePayload());
    expect(embed.timestamp).toBe('2026-04-27T10:00:00Z');
  });

  it('links commit SHA to the commit URL', () => {
    const embed = buildWorkflowRunEmbed(makePayload());
    expect(embed.description).toContain('https://github.com/biomejs/biome/commit/abc1234567890def');
  });
});
