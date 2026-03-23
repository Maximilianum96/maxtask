/**
 * HACOY Daily News Tracker — Deduplicator
 *
 * Tracks seen article URLs to prevent duplicates across daily runs.
 * Stores URL hashes with dates, auto-prunes entries older than 90 days.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const SEEN_FILE = join(DATA_DIR, 'seen-urls.json');
const MAX_AGE_DAYS = 90;

/**
 * Hash a URL for storage
 */
function hashUrl(url) {
  return createHash('sha256').update(url).digest('hex').substring(0, 16);
}

/**
 * Load the seen URLs database
 * @returns {Object} Map of URL hash → date string
 */
function loadSeen() {
  try {
    const data = readFileSync(SEEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Save the seen URLs database
 * @param {Object} seen - Map of URL hash → date string
 */
function saveSeen(seen) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}

/**
 * Prune entries older than MAX_AGE_DAYS
 * @param {Object} seen - Map of URL hash → date string
 * @returns {Object} Pruned map
 */
function prune(seen) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const pruned = {};
  for (const [hash, date] of Object.entries(seen)) {
    if (date >= cutoffStr) {
      pruned[hash] = date;
    }
  }
  return pruned;
}

/**
 * Deduplicate articles — remove already-seen URLs and mark new ones as seen
 * @param {Array} articles - Array of processed articles
 * @returns {Array} Only new (unseen) articles
 */
export function deduplicate(articles) {
  let seen = loadSeen();
  seen = prune(seen);

  const today = new Date().toISOString().split('T')[0];
  const newArticles = [];

  for (const article of articles) {
    if (!article.url) continue;
    const hash = hashUrl(article.url);
    if (!seen[hash]) {
      seen[hash] = today;
      newArticles.push(article);
    }
  }

  saveSeen(seen);

  const dupeCount = articles.length - newArticles.length;
  if (dupeCount > 0) {
    console.log(`🔄 Dedup: ${dupeCount} duplicates removed, ${newArticles.length} new articles\n`);
  }

  return newArticles;
}

/**
 * Reset the seen URLs database (for testing)
 */
export function resetSeen() {
  saveSeen({});
}
