import type { WorkflowRunCompletedEvent, WorkflowRunInProgressEvent } from '@octokit/webhooks-types';
import type { APIEmbed } from 'discord-api-types/v10';

export type WorkflowRunPayload = WorkflowRunCompletedEvent | WorkflowRunInProgressEvent;

const STATUS_COLORS: Record<string, number> = {
  success: 0x28a745,
  failure: 0xd73a49,
  cancelled: 0xdbab09,
  timed_out: 0xdbab09,
  in_progress: 0x0366d6,
};

const STATUS_EMOJI: Record<string, string> = {
  success: '✅',
  failure: '❌',
  cancelled: '⚠️',
  timed_out: '⏰',
  in_progress: '🔄',
};

const FALLBACK_COLOR = 0x6a737d;

export function buildWorkflowRunEmbed(payload: WorkflowRunPayload): APIEmbed {
  const { workflow_run, repository } = payload;

  const status = payload.action === 'in_progress' ? 'in_progress' : (workflow_run.conclusion ?? 'unknown');

  const emoji = STATUS_EMOJI[status] ?? '❓';
  const color = STATUS_COLORS[status] ?? FALLBACK_COLOR;
  const shortSha = workflow_run.head_sha.slice(0, 7);

  return {
    title: `${emoji} ${workflow_run.name} #${workflow_run.run_number} ${status.replaceAll('_', ' ')}`,
    url: workflow_run.html_url,
    color,
    description: `**Branch:** \`${workflow_run.head_branch}\`  ·  **Commit:** [\`${shortSha}\`](${repository.html_url}/commit/${workflow_run.head_sha})`,
    author: {
      name: workflow_run.actor.login,
      url: workflow_run.actor.html_url,
      icon_url: workflow_run.actor.avatar_url,
    },
    footer: { text: repository.full_name },
    timestamp: workflow_run.updated_at,
  };
}
