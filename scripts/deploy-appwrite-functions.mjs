// Deploys the server-enforced collaboration functions.
// Run with: node --env-file=.env.setup.local scripts/deploy-appwrite-functions.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client, Functions, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';

if (!endpoint || !projectId || !apiKey) {
  throw new Error('Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY');
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const functions = new Functions(client);
const root = resolve(import.meta.dirname, '..');

const allDefinitions = [
  {
    id: 'learning-content',
    name: 'Learning Content',
    directory: 'functions/learning-content',
    timeout: 120,
    variables: {
      ...(process.env.OPENROUTER_API_KEY
        ? { OPENROUTER_API_KEY: { value: process.env.OPENROUTER_API_KEY, secret: true } }
        : {}),
      OPENROUTER_MODEL: { value: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', secret: false },
    },
  },
  {
    id: 'writing-ai-feedback',
    name: 'Writing AI Feedback',
    directory: 'functions/writing-ai-feedback',
    variables: {
      ...(process.env.OPENROUTER_API_KEY
        ? { OPENROUTER_API_KEY: { value: process.env.OPENROUTER_API_KEY, secret: true } }
        : {}),
      OPENROUTER_MODEL: { value: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', secret: false },
    },
  },
];
const requestedIds = new Set(process.argv.slice(2));
const definitions = requestedIds.size ? allDefinitions.filter(definition => requestedIds.has(definition.id)) : allDefinitions;
if (requestedIds.size && definitions.length !== requestedIds.size) throw new Error(`Unknown function ID. Available: ${allDefinitions.map(definition => definition.id).join(', ')}`);

async function ensureFunction(definition) {
  try {
    await functions.get({ functionId: definition.id });
    console.log(`Function ${definition.id} already exists`);
  } catch (error) {
    if (error?.code !== 404) throw error;
    await functions.create({
      functionId: definition.id,
      name: definition.name,
      runtime: 'node-22',
      execute: ['users'],
      timeout: definition.timeout || 30,
      enabled: true,
      logging: true,
      entrypoint: 'src/main.js',
      commands: 'npm install',
    });
    console.log(`Created function ${definition.id}`);
  }

  await functions.update({
    functionId: definition.id,
    name: definition.name,
    // Appwrite may clear execute permissions when a function is updated. Keep
    // authenticated-user access explicit on every deploy, not only creation.
    execute: ['users'],
    timeout: definition.timeout || 30,
    enabled: true,
    logging: true,
    entrypoint: 'src/main.js',
    commands: 'npm install',
  });

  const commonVariables = {
    APPWRITE_ENDPOINT: { value: endpoint, secret: false },
    APPWRITE_API_KEY: { value: apiKey, secret: true },
    APPWRITE_DATABASE_ID: { value: databaseId, secret: false },
  };
  const desired = { ...commonVariables, ...definition.variables };
  const existing = await functions.listVariables({ functionId: definition.id });

  for (const [key, config] of Object.entries(desired)) {
    const found = existing.variables.find(variable => variable.key === key);
    if (found) {
      await functions.updateVariable({
        functionId: definition.id,
        variableId: found.$id,
        key,
        value: config.value,
        secret: config.secret,
      });
    } else {
      await functions.createVariable({
        functionId: definition.id,
        variableId: ID.unique(),
        key,
        value: config.value,
        secret: config.secret,
      });
    }
  }

  const tempDirectory = mkdtempSync(join(tmpdir(), 'learningisfun-function-'));
  const archive = join(tempDirectory, `${definition.id}.tar.gz`);
  try {
    execFileSync('tar', ['-czf', archive, '-C', resolve(root, definition.directory), '.']);
    const deployment = await functions.createDeployment({
      functionId: definition.id,
      code: InputFile.fromPath(archive),
      activate: true,
      entrypoint: 'src/main.js',
      commands: 'npm install',
    });
    console.log(`Deployed ${definition.id}: ${deployment.$id}`);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

for (const definition of definitions) {
  await ensureFunction(definition);
}

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY is not set; AI feedback is deployed but remains disabled until configured.');
}

console.log('Function IDs: learning-content, writing-ai-feedback');
