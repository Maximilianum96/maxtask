/**
 * HACOY Daily News Tracker — CSV Exporter
 *
 * Exports articles to CSV files as local backup.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'data', 'exports');

/**
 * Escape a CSV field value
 */
function escapeField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an article to a CSV row
 */
function articleToRow(article) {
  return [
    article.date,
    article.title,
    article.source,
    article.category,
    article.geo,
    article.relevanceScore,
    article.summary,
    article.people.join('; '),
    article.author,
    article.companies.join('; '),
    article.tags.join('; '),
    article.url,
  ].map(escapeField).join(',');
}

/**
 * Export articles to a CSV file
 * @param {Array} articles - Scored and filtered articles
 * @param {string} [filename] - Optional custom filename
 * @returns {string} Path to the exported CSV file
 */
export function exportToCsv(articles, filename) {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const date = new Date().toISOString().split('T')[0];
  const file = filename || `hacoy-news-${date}.csv`;
  const filePath = join(OUTPUT_DIR, file);

  const header = 'Date,Title,Source,Category,Geographic Scope,Relevance Score,Summary,People Mentioned,Author/Editor,Companies Mentioned,Tags,URL';
  const rows = articles.map(articleToRow);
  const csv = [header, ...rows].join('\n');

  writeFileSync(filePath, csv, 'utf-8');
  console.log(`📄 CSV exported: ${filePath} (${articles.length} articles)\n`);

  return filePath;
}
