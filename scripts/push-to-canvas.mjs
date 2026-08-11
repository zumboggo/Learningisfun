#!/usr/bin/env node
/**
 * Pushes a generated daily quiz into Canvas.
 *
 * The app builds the JSON bundle (in the browser, where the flashcards live);
 * this script is the only thing that ever sees the Canvas API token, and it
 * runs on your machine. Nothing here is deployed.
 *
 * Usage:
 *   node --env-file=.env.canvas.local scripts/push-to-canvas.mjs <bundle.json> [flags]
 *
 * Flags:
 *   --dry-run   Show exactly what would be sent; make no requests that change Canvas.
 *   --publish   Publish the quiz once every question is in. Omitted = leave it
 *               unpublished so you can eyeball it in Canvas first.
 *   --force     Push even if a quiz with the same fingerprint already exists.
 *   --course=N  Override CANVAS_COURSE_ID.
 *
 * Required environment:
 *   CANVAS_BASE_URL   e.g. https://yourschool.instructure.com
 *   CANVAS_API_TOKEN  Account > Settings > New Access Token
 *   CANVAS_COURSE_ID  the number in /courses/12345
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const FINGERPRINT_PREFIX = 'edu-spark-daily';

/* ------------------------------------------------------------------ *
 * CLI plumbing
 * ------------------------------------------------------------------ */

class UserError extends Error {}

function parseArgs(argv) {
  const flags = { dryRun: false, publish: false, force: false, course: null };
  const positional = [];
  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--publish') flags.publish = true;
    else if (arg === '--force') flags.force = true;
    else if (arg.startsWith('--course=')) flags.course = arg.slice('--course='.length);
    else if (arg.startsWith('--')) throw new UserError(`Unknown flag: ${arg}`);
    else positional.push(arg);
  }
  return { flags, positional };
}

function readConfig(flags) {
  const baseUrl = (process.env.CANVAS_BASE_URL || '').trim().replace(/\/+$/, '');
  const token = (process.env.CANVAS_API_TOKEN || '').trim();
  const courseId = (flags.course || process.env.CANVAS_COURSE_ID || '').trim();

  const missing = [];
  if (!baseUrl) missing.push('CANVAS_BASE_URL');
  if (!token) missing.push('CANVAS_API_TOKEN');
  if (!courseId) missing.push('CANVAS_COURSE_ID (or --course=N)');
  if (missing.length) {
    throw new UserError(
      `Missing configuration: ${missing.join(', ')}.\n` +
        `Copy .env.canvas.example to .env.canvas.local, fill it in, and run with:\n` +
        `  node --env-file=.env.canvas.local scripts/push-to-canvas.mjs <bundle.json>`,
    );
  }
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new UserError(`CANVAS_BASE_URL must start with https:// — got "${baseUrl}"`);
  }
  if (!/^\d+$/.test(courseId)) {
    throw new UserError(`Course id must be numeric — got "${courseId}". It's the number in /courses/12345.`);
  }
  return { baseUrl, token, courseId };
}

/* ------------------------------------------------------------------ *
 * Canvas HTTP
 * ------------------------------------------------------------------ */

async function canvasRequest(config, method, path, body) {
  let response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new UserError(
      `Could not reach ${config.baseUrl} — check CANVAS_BASE_URL and your network.\n  ${cause.message}`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new UserError(
      'Canvas rejected the API token (HTTP ' +
        response.status +
        ').\nGenerate a fresh one at Account > Settings > New Access Token, and check it has teacher rights on this course.',
    );
  }
  if (response.status === 404) {
    throw new UserError(
      `Canvas returned 404 for ${method} ${path}.\nUsually a wrong CANVAS_COURSE_ID, or the token's user isn't enrolled as a teacher in that course.`,
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const detail = describeCanvasError(payload) || text.slice(0, 300) || '(no response body)';
    throw new UserError(`Canvas rejected ${method} ${path} (HTTP ${response.status}):\n  ${detail}`);
  }

  return { payload, link: response.headers.get('link') };
}

function describeCanvasError(payload) {
  if (!payload) return null;
  if (typeof payload.message === 'string') return payload.message;
  if (Array.isArray(payload.errors)) {
    return payload.errors.map(e => e.message || JSON.stringify(e)).join('; ');
  }
  if (payload.errors && typeof payload.errors === 'object') {
    return Object.entries(payload.errors)
      .map(([field, issues]) => {
        const list = Array.isArray(issues) ? issues.map(i => i.message || i).join(', ') : issues;
        return `${field}: ${list}`;
      })
      .join('; ');
  }
  return null;
}

/** Follows Canvas's Link-header pagination until there's no `next`. */
async function canvasGetAll(config, path) {
  const results = [];
  let next = path;
  while (next) {
    const { payload, link } = await canvasRequest(config, 'GET', next);
    if (Array.isArray(payload)) results.push(...payload);
    next = parseNextLink(link, config.baseUrl);
  }
  return results;
}

function parseNextLink(link, baseUrl) {
  if (!link) return null;
  for (const part of link.split(',')) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1].startsWith(baseUrl) ? match[1].slice(baseUrl.length) : match[1];
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Bundle validation
 * ------------------------------------------------------------------ */

async function loadBundle(path) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (cause) {
    throw new UserError(`Could not read bundle file "${path}": ${cause.message}`);
  }

  let bundle;
  try {
    bundle = JSON.parse(raw);
  } catch (cause) {
    throw new UserError(`"${path}" is not valid JSON: ${cause.message}`);
  }

  if (bundle?.formatVersion !== 1) {
    throw new UserError(
      `Unsupported bundle format (got ${JSON.stringify(bundle?.formatVersion)}, expected 1). Re-export from the app.`,
    );
  }
  if (!bundle.quizPayload?.quiz?.title) {
    throw new UserError('Bundle is missing quizPayload.quiz.title — re-export from the app.');
  }
  if (!Array.isArray(bundle.questionPayloads) || bundle.questionPayloads.length === 0) {
    throw new UserError('Bundle contains no questions — nothing to push.');
  }

  bundle.questionPayloads.forEach((entry, index) => {
    const q = entry?.question;
    const label = `question ${index + 1}`;
    if (!q) throw new UserError(`Malformed ${label}: missing "question" object.`);
    if (!q.question_type) throw new UserError(`Malformed ${label}: missing question_type.`);
    if (!Array.isArray(q.answers) || q.answers.length === 0) {
      throw new UserError(`Malformed ${label}: no answers.`);
    }
    if (q.question_type === 'multiple_choice_question') {
      const correct = q.answers.filter(a => a.answer_weight === 100);
      if (correct.length !== 1) {
        throw new UserError(
          `Malformed ${label}: multiple choice needs exactly one answer weighted 100, found ${correct.length}.`,
        );
      }
    }
    if (q.question_type === 'fill_in_multiple_blanks_question') {
      const blankIds = [...new Set(q.answers.map(a => a.blank_id).filter(Boolean))];
      if (blankIds.length === 0) throw new UserError(`Malformed ${label}: no blank_id on any answer.`);
      for (const blankId of blankIds) {
        if (!String(q.question_text).includes(`[${blankId}]`)) {
          throw new UserError(
            `Malformed ${label}: question text has no [${blankId}] placeholder, so Canvas cannot grade it.`,
          );
        }
      }
    }
  });

  return bundle;
}

/* ------------------------------------------------------------------ *
 * Duplicate guard
 * ------------------------------------------------------------------ */

async function findExistingQuiz(config, fingerprint, title) {
  const quizzes = await canvasGetAll(config, `/api/v1/courses/${config.courseId}/quizzes?per_page=100`);
  return (
    quizzes.find(q => typeof q.description === 'string' && q.description.includes(fingerprint)) ||
    quizzes.find(q => q.title === title) ||
    null
  );
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  if (positional.length !== 1) {
    throw new UserError(
      'Usage: node --env-file=.env.canvas.local scripts/push-to-canvas.mjs <bundle.json> [--dry-run] [--publish] [--force]',
    );
  }

  const bundle = await loadBundle(positional[0]);
  const config = readConfig(flags);
  const fingerprint = bundle.fingerprint || `${FINGERPRINT_PREFIX}:unknown`;
  const title = bundle.quizPayload.quiz.title;
  const questionCount = bundle.questionPayloads.length;

  console.log(`Quiz:      ${title}`);
  console.log(`Course:    ${config.baseUrl}/courses/${config.courseId}`);
  console.log(`Questions: ${questionCount} (${countType(bundle, 'multiple_choice_question')} MC, ${countType(bundle, 'fill_in_multiple_blanks_question')} cloze)`);
  if (bundle.summary) {
    console.log(`Mix:       ${bundle.summary.fromToday ?? '?'} from today, ${bundle.summary.fromReview ?? '?'} review`);
    const skipped = bundle.summary.skipped;
    if (Array.isArray(skipped) && skipped.length) {
      console.log(`Skipped:   ${skipped.length} card(s) produced no question:`);
      for (const s of skipped) console.log(`             - ${s.front}: ${s.reason}`);
    }
  }
  console.log('');

  if (flags.dryRun) {
    console.log('--dry-run: no requests sent. Payloads that would be posted:\n');
    console.log(JSON.stringify(bundle.quizPayload, null, 2));
    for (const entry of bundle.questionPayloads) {
      console.log(JSON.stringify(entry, null, 2));
    }
    return;
  }

  const existing = await findExistingQuiz(config, fingerprint, title);
  if (existing && !flags.force) {
    throw new UserError(
      `This quiz is already in Canvas: "${existing.title}" (id ${existing.id})\n` +
        `  ${config.baseUrl}/courses/${config.courseId}/quizzes/${existing.id}\n` +
        `Nothing was changed. Delete it in Canvas and re-run, or pass --force to create a second copy anyway.`,
    );
  }
  if (existing && flags.force) {
    console.log(`! --force: an existing quiz (id ${existing.id}) matches this one. Creating a duplicate.\n`);
  }

  const { payload: quiz } = await canvasRequest(
    config,
    'POST',
    `/api/v1/courses/${config.courseId}/quizzes`,
    bundle.quizPayload,
  );
  const quizUrl = `${config.baseUrl}/courses/${config.courseId}/quizzes/${quiz.id}`;
  console.log(`Created unpublished quiz ${quiz.id}`);

  let added = 0;
  try {
    for (const entry of bundle.questionPayloads) {
      await canvasRequest(
        config,
        'POST',
        `/api/v1/courses/${config.courseId}/quizzes/${quiz.id}/questions`,
        entry,
      );
      added++;
      process.stdout.write(`\r  questions added: ${added}/${questionCount}`);
    }
    process.stdout.write('\n');
  } catch (cause) {
    process.stdout.write('\n');
    throw new UserError(
      `Failed after adding ${added}/${questionCount} questions.\n` +
        `The quiz is still UNPUBLISHED, so no student can see it: ${quizUrl}\n` +
        `Delete it in Canvas before re-running.\n\n${cause.message}`,
    );
  }

  if (flags.publish) {
    await canvasRequest(config, 'PUT', `/api/v1/courses/${config.courseId}/quizzes/${quiz.id}`, {
      quiz: { published: true, notify_of_update: false },
    });
    console.log('Published. Students can take it now, and marks post to the gradebook automatically.');
  } else {
    console.log('Left unpublished — review it, then publish in Canvas (or re-run with --publish).');
  }

  console.log(`\n${quizUrl}`);
}

function countType(bundle, type) {
  return bundle.questionPayloads.filter(e => e.question?.question_type === type).length;
}

main().catch(error => {
  if (error instanceof UserError) {
    console.error(`\n${error.message}\n`);
  } else {
    console.error('\nUnexpected failure:\n', error);
  }
  process.exitCode = 1;
});
