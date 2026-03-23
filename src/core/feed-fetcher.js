/**
 * HACOY Daily News Tracker — RSS/Atom Feed Fetcher
 *
 * Fetches and parses RSS/Atom feeds using built-in fetch().
 * Lightweight XML parsing via regex (no external dependencies).
 */

/**
 * Decode common HTML entities in text
 */
function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
}

/**
 * Strip HTML tags from text
 */
function stripHtml(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract text content between XML tags
 */
function extractTag(xml, tagName) {
  const patterns = [
    new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i'),
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return '';
}

/**
 * Parse an RSS 2.0 feed XML string into article items
 */
function parseRss(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemXml = match[1];
    items.push({
      title: stripHtml(extractTag(itemXml, 'title')),
      link: extractTag(itemXml, 'link') || extractTag(itemXml, 'guid'),
      pubDate: extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date'),
      description: stripHtml(extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded')),
      author: extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'author'),
    });
  }

  return items;
}

/**
 * Parse an Atom feed XML string into article items
 */
function parseAtom(xml) {
  const items = [];
  const entryMatches = xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi);

  for (const match of entryMatches) {
    const entryXml = match[1];

    // Atom links use <link href="..." /> attribute
    const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
    const link = linkMatch ? decodeEntities(linkMatch[1]) : '';

    items.push({
      title: stripHtml(extractTag(entryXml, 'title')),
      link,
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated'),
      description: stripHtml(extractTag(entryXml, 'summary') || extractTag(entryXml, 'content')),
      author: extractTag(entryXml, 'name') || extractTag(entryXml, 'author'),
    });
  }

  return items;
}

/**
 * Parse feed XML (auto-detects RSS vs Atom format)
 */
function parseFeed(xml) {
  if (xml.includes('<feed') && xml.includes('<entry')) {
    return parseAtom(xml);
  }
  return parseRss(xml);
}

/**
 * Fetch a single RSS/Atom feed and return parsed items
 * @param {Object} source - Source config object from sources.js
 * @returns {Promise<Array>} Parsed feed items with source metadata
 */
export async function fetchFeed(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HACOY-News-Tracker/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`  ⚠ ${source.name}: HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const items = parseFeed(xml);

    return items.map(item => ({
      ...item,
      sourceName: source.name,
      sourceCategory: source.category,
      sourceLanguage: source.language,
      sourceGeo: source.geo,
    }));
  } catch (error) {
    const msg = error.name === 'AbortError' ? 'timeout' : error.message;
    console.warn(`  ⚠ ${source.name}: ${msg}`);
    return [];
  }
}

/**
 * Fetch all configured feeds sequentially with a small delay
 * @param {Array} sources - Array of source config objects
 * @returns {Promise<Array>} All parsed items from all feeds
 */
export async function fetchAllFeeds(sources) {
  const allItems = [];
  let successCount = 0;

  console.log(`\n📡 Fetching ${sources.length} feeds...\n`);

  for (const source of sources) {
    const items = await fetchFeed(source);
    if (items.length > 0) {
      successCount++;
      allItems.push(...items);
      console.log(`  ✓ ${source.name}: ${items.length} articles`);
    }
    // Small delay between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Fetched ${allItems.length} articles from ${successCount}/${sources.length} feeds\n`);
  return allItems;
}
