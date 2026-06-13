import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@actions/github', () => {
  return {
    context: {
      repo: { owner: 'octo-org', repo: 'action-notifications' },
      eventName: 'push',
      ref: 'refs/heads/main',
      workflow: 'CI',
      actor: 'octocat',
      payload: {
        head_commit: {
          id: '1234567890abcdef',
          url: 'https://github.com/octo-org/action-notifications/commit/1234567',
          message: 'Add node24 support',
        },
      },
      serverUrl: 'https://github.com',
      runId: 99,
    },
  };
});

import {
  getPayloadDiscord,
  getPayloadGoogleChat,
  getPayloadMsTeams,
  getPayloadSlack,
  getPayloadTelegram,
} from '../src/utils';
import { fitEmbed, truncStr } from '../src/validate';

const inputs = {
  status: 'success',
  title: 'Deploy',
  description: 'Shipped to production',
  discord_webhook: '',
  slack_webhook: '',
  slack_username: 'bot',
  telegram_bot_token: 'token',
  telegram_chat_id: 'chat-id',
  telegram_message_thread_id: '',
  google_chat_webhook: '',
  ms_teams_webhook: '',
  qrcode: '',
};

describe('payload builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds Discord payload with embed fields', async () => {
    const payload: any = await getPayloadDiscord(inputs);
    expect(payload.embeds).toHaveLength(1);
    expect(payload.embeds[0].title).toContain('Success: Deploy');
  });

  it('builds Slack payload with attachments', () => {
    const payload: any = getPayloadSlack(inputs);
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0].title).toContain('Success: Deploy');
  });

  it('builds Telegram payload with markdown mode', () => {
    const payload: any = getPayloadTelegram(inputs);
    expect(payload.parse_mode).toBe('MarkdownV2');
    expect(payload.text).toContain('Repository');
  });

  it('builds Google Chat payload card', () => {
    const payload: any = getPayloadGoogleChat(inputs);
    expect(payload.cards).toHaveLength(1);
    expect(payload.cards[0].sections).toBeTruthy();
  });

  it('builds MS Teams payload with connector card', () => {
    const payload: any = getPayloadMsTeams(inputs);
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0].content['@type']).toBe('MessageCard');
  });
});

describe('validate helpers', () => {
  it('truncates over-limit strings', () => {
    expect(truncStr('abcdefghij', 6)).toBe('abc...');
  });

  it('reduces long embed values to fit limits', () => {
    const embed: any = {
      title: 'a'.repeat(300),
      description: 'b'.repeat(3000),
      fields: [{ name: 'c'.repeat(300), value: 'd'.repeat(2000) }],
    };

    const fitted = fitEmbed(embed);

    expect(fitted.title.length).toBeLessThanOrEqual(256);
    expect(fitted.description.length).toBeLessThanOrEqual(2048);
    expect(fitted.fields[0].name.length).toBeLessThanOrEqual(256);
    expect(fitted.fields[0].value.length).toBeLessThanOrEqual(1024);
  });
});
