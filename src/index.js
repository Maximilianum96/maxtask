#!/usr/bin/env node

/**
 * HACOY Daily News Tracker
 *
 * Fetches daily news from RSS feeds covering fashion, tech, sustainability,
 * circular economy, and startups across Munich, DACH, and EU regions.
 *
 * Usage:
 *   node src/index.js                    # Full run: fetch + all exports
 *   node src/index.js --mode=fetch       # Fetch only (console output)
 *   node src/index.js --mode=export-csv  # Export last fetch to CSV
 *   node src/index.js --mode=export-json # Export last fetch to JSON
 *   node src/index.js --mode=export-sheets # Export to Google Sheets
 */

import { sources } from './config/sources.js';
import { fetchAllFeeds } from './core/feed-fetcher.js';
import { processAllArticles } from './core/article-processor.js';
import { scoreAndFilter } from './core/relevance-scorer.js';
import { deduplicate } from './core/deduplicator.js';
import { exportToCsv } from './exporters/csv-exporter.js';
import { exportToJson } from './exporters/json-exporter.js';
import { exportToSheets } from './exporters/google-sheets.js';

function printBanner() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          HACOY Daily News Tracker                       ║');
  console.log('║   Fashion · Tech · Sustainability · DACH & EU           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
}

function printSummary(articles) {
  if (articles.length === 0) {
    console.log('No new articles found above relevance threshold.\n');
    return;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📰 ${articles.length} articles found`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Category breakdown
  const categories = {};
  const geos = {};
  for (const a of articles) {
    categories[a.category] = (categories[a.category] || 0) + 1;
    geos[a.geo] = (geos[a.geo] || 0) + 1;
  }

  console.log('By category:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log('\nBy geography:');
  for (const [geo, count] of Object.entries(geos).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${geo}: ${count}`);
  }

  // Top 5 articles
  console.log('\n🔝 Top 5 most relevant:');
  for (const article of articles.slice(0, 5)) {
    console.log(`  [${article.relevanceScore}] ${article.title}`);
    console.log(`      ${article.source} | ${article.geo} | ${article.date}`);
    if (article.companies.length > 0) {
      console.log(`      Companies: ${article.companies.join(', ')}`);
    }
    console.log('');
  }
}

function getMode() {
  const modeArg = process.argv.find(a => a.startsWith('--mode='));
  return modeArg ? modeArg.split('=')[1] : 'full';
}

async function run() {
  printBanner();

  const mode = getMode();
  const startTime = Date.now();

  try {
    // Step 1: Fetch feeds
    console.log('Step 1/4: Fetching RSS feeds...');
    const rawItems = await fetchAllFeeds(sources);

    if (rawItems.length === 0) {
      console.log('⚠ No articles fetched from any source. Check your network connection.\n');
      process.exit(1);
    }

    // Step 2: Process articles
    console.log('Step 2/4: Processing articles...');
    const processed = processAllArticles(rawItems);
    console.log(`  Processed ${processed.length} articles\n`);

    // Step 3: Score and filter
    console.log('Step 3/4: Scoring relevance...');
    const scored = scoreAndFilter(processed);

    // Step 4: Deduplicate
    console.log('Step 4/4: Deduplicating...');
    const articles = deduplicate(scored);

    // Print summary
    printSummary(articles);

    if (articles.length === 0) {
      console.log('✅ Done — no new articles to export.\n');
      return;
    }

    // Export based on mode
    if (mode === 'fetch') {
      console.log('Fetch-only mode — skipping exports.\n');
    } else if (mode === 'export-csv') {
      exportToCsv(articles);
    } else if (mode === 'export-json') {
      exportToJson(articles);
    } else if (mode === 'export-sheets') {
      await exportToSheets(articles);
    } else {
      // Full mode: all exports
      exportToCsv(articles);
      exportToJson(articles);

      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID) {
        await exportToSheets(articles);
      } else {
        console.log('ℹ Google Sheets export skipped (credentials not configured)');
        console.log('  Set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID to enable.\n');
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Done in ${elapsed}s\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

run();
