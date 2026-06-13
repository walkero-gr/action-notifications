#!/usr/bin/env node

/**
 * Local Discord notification test script
 * Usage: node scripts/test-discord-local.js <webhook_url> [title] [description]
 * 
 * Example:
 *   node scripts/test-discord-local.js "https://discord.com/api/webhooks/..." "Test Title" "Test Description"
 */

const axios = require('axios');

// Mock GitHub context
const mockGitHubContext = {
  repo: {
    owner: 'test-user',
    repo: 'action-notifications',
  },
  eventName: 'push',
  ref: 'refs/heads/main',
  workflow: 'Local Test',
  actor: 'test-actor',
  payload: {
    head_commit: {
      id: 'abc1234567890def',
      url: 'https://github.com/test-user/action-notifications/commit/abc1234',
      message: 'Test commit from local script',
    },
  },
  serverUrl: 'https://github.com',
  runId: 0,
};

// Parse command-line arguments
const webhookUrl = process.argv[2];
const title = process.argv[3] || 'Local Test Notification';
const description = process.argv[4] || 'Testing Discord notification from local script';

if (!webhookUrl) {
  console.error('❌ Error: Discord webhook URL is required');
  console.error('Usage: node scripts/test-discord-local.js <webhook_url> [title] [description]');
  process.exit(1);
}

// Validate webhook URL format
if (!webhookUrl.includes('discord.com/api/webhooks')) {
  console.error('❌ Error: Invalid Discord webhook URL');
  console.error('Expected format: https://discord.com/api/webhooks/...');
  process.exit(1);
}

console.log('🚀 Testing Discord notification locally...');
console.log(`📝 Title: ${title}`);
console.log(`📝 Description: ${description}`);
console.log('');

// Status options matching src/utils.ts
const statusOpts = {
  success: { status: 'Success', color: 0x28a745 },
  failure: { status: 'Failure', color: 0xcb2431 },
  cancelled: { status: 'Cancelled', color: 0xdbab09 },
};

const status = 'success';

try {
  // Build payload matching the actual Discord formatter from src/utils.ts
  console.log('⚙️  Building Discord payload...');
  
  const embed = {
    color: statusOpts[status]?.color || 0x28a745,
    timestamp: new Date().toISOString(),
    title: `${statusOpts[status]?.status || 'Success'}: ${title}`,
    description: description,
    fields: [
      {
        name: 'Repository',
        value: `[${mockGitHubContext.repo.owner}/${mockGitHubContext.repo.repo}](https://github.com/${mockGitHubContext.repo.owner}/${mockGitHubContext.repo.repo})`,
        inline: true,
      },
      {
        name: 'Ref',
        value: mockGitHubContext.ref,
        inline: true,
      },
      {
        name: `Event - ${mockGitHubContext.eventName}`,
        value: `[${mockGitHubContext.payload.head_commit.id.substring(0, 7)}](${mockGitHubContext.payload.head_commit.url}) ${mockGitHubContext.payload.head_commit.message}`,
        inline: false,
      },
      {
        name: 'Triggered by',
        value: mockGitHubContext.actor,
        inline: true,
      },
      {
        name: 'Workflow',
        value: `[${mockGitHubContext.workflow}](https://github.com/${mockGitHubContext.repo.owner}/${mockGitHubContext.repo.repo}/actions/runs/${mockGitHubContext.runId})`,
        inline: true,
      },
    ],
  };

  const payload = {
    embeds: [embed],
  };

  console.log('📦 Payload structure:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  // Send to Discord
  console.log('📤 Sending to Discord...');
  axios.post(webhookUrl, payload).then((response) => {
    console.log('✅ Success! Discord webhook returned status:', response.status);
    console.log('💬 Check your Discord channel for the notification.');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error sending to Discord:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}
