/**
 * HACOY Daily News Tracker — JSON Exporter
 *
 * Exports articles to JSON files as local backup and data archive.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'data', 'exports');

/**
 * Export articles to a JSON file
 * @param {Array} articles - Scored and filtered articles
 * @param {string} [filename] - Optional custom filename
 * @returns {string} Path to the exported JSON file
 */
export function exportToJson(articles, filename) {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const date = new Date().toISOString().split('T')[0];
  const file = filename || `hacoy-news-${date}.json`;
  const filePath = join(OUTPUT_DIR, file);

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      date,
      totalArticles: articles.length,
      categories: [...new Set(articles.map(a => a.category))],
      sources: [...new Set(articles.map(a => a.source))],
      avgRelevance: articles.length > 0
        ? Math.round(articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length)
        : 0,
    },
    articles,
  };

  writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`📋 JSON exported: ${filePath} (${articles.length} articles)\n`);

  return filePath;
}
