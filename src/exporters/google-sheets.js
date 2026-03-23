/**
 * HACOY Daily News Tracker — Google Sheets Exporter
 *
 * Appends daily news articles to a Google Sheet via the Sheets API.
 * Uses a service account for authentication.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY - JSON string of service account credentials
 *   GOOGLE_SHEET_ID            - ID of the target Google Sheet
 */

import { google } from 'googleapis';

const SHEET_NAME = 'Daily News';
const DASHBOARD_SHEET = 'Dashboard';

/**
 * Get authenticated Google Sheets client
 * @returns {Object} Google Sheets API client
 */
async function getClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
  }

  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Ensure the sheet has a header row
 */
async function ensureHeader(sheets, spreadsheetId) {
  const header = [
    'Date', 'Title', 'Source', 'Category', 'Geographic Scope',
    'Relevance Score', 'Summary', 'People Mentioned', 'Author/Editor',
    'Companies Mentioned', 'Tags', 'URL',
  ];

  // Check if header exists
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A1:L1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_NAME}'!A1:L1`,
        valueInputOption: 'RAW',
        requestBody: { values: [header] },
      });
    }
  } catch (error) {
    // Sheet might not exist, try creating it
    if (error.code === 400 || error.message?.includes('Unable to parse range')) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: { properties: { title: SHEET_NAME } },
            }],
          },
        });
      } catch {
        // Sheet may already exist, ignore
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_NAME}'!A1:L1`,
        valueInputOption: 'RAW',
        requestBody: { values: [header] },
      });
    }
  }
}

/**
 * Convert article to a sheet row
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
  ];
}

/**
 * Update the Dashboard tab with summary statistics
 */
async function updateDashboard(sheets, spreadsheetId, articles) {
  // Ensure Dashboard sheet exists
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: DASHBOARD_SHEET } },
        }],
      },
    });
  } catch {
    // Sheet may already exist, ignore
  }

  const today = new Date().toISOString().split('T')[0];

  // Category breakdown
  const categories = {};
  const sources = {};
  const geos = {};
  for (const a of articles) {
    categories[a.category] = (categories[a.category] || 0) + 1;
    sources[a.source] = (sources[a.source] || 0) + 1;
    geos[a.geo] = (geos[a.geo] || 0) + 1;
  }

  const dashboardData = [
    [`HACOY Daily News Dashboard — ${today}`],
    [''],
    ['Total Articles', articles.length],
    ['Avg Relevance Score', articles.length > 0
      ? Math.round(articles.reduce((s, a) => s + a.relevanceScore, 0) / articles.length)
      : 0],
    [''],
    ['— By Category —'],
    ...Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
    [''],
    ['— By Geography —'],
    ...Object.entries(geos).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
    [''],
    ['— Top Sources —'],
    ...Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, v]),
    [''],
    ['— Top People Mentioned —'],
    ...getTopPeople(articles).map(([name, count]) => [name, count]),
    [''],
    ['— Top Companies —'],
    ...getTopCompanies(articles).map(([name, count]) => [name, count]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${DASHBOARD_SHEET}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: dashboardData },
  });
}

function getTopPeople(articles) {
  const counts = {};
  for (const a of articles) {
    for (const p of a.people) {
      counts[p] = (counts[p] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function getTopCompanies(articles) {
  const counts = {};
  for (const a of articles) {
    for (const c of a.companies) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

/**
 * Export articles to Google Sheets
 * @param {Array} articles - Scored and filtered articles
 * @returns {Promise<void>}
 */
export async function exportToSheets(articles) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable');
  }

  console.log('📊 Exporting to Google Sheets...\n');

  const sheets = await getClient();

  // Ensure header exists
  await ensureHeader(sheets, spreadsheetId);

  // Append article rows
  const rows = articles.map(articleToRow);

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A:L`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });
  }

  // Update dashboard
  await updateDashboard(sheets, spreadsheetId, articles);

  console.log(`✅ Google Sheets updated: ${articles.length} articles appended\n`);
  console.log(`📎 https://docs.google.com/spreadsheets/d/${spreadsheetId}\n`);
}
