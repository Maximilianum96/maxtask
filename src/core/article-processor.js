/**
 * HACOY Daily News Tracker — Article Processor
 *
 * Extracts and enriches metadata from raw feed items:
 * people mentioned, companies, categories, geographic scope, tags.
 */

import { trackedCompanies } from '../config/keywords.js';

/**
 * Extract potential person names from text.
 * Looks for patterns of 2-3 capitalized words (common name format).
 */
function extractPeople(text) {
  if (!text) return [];
  // Match patterns like "John Smith" or "Anna-Maria von Trapp"
  const namePattern = /\b([A-ZÄÖÜ][a-zäöüß]+([-\s](?:von\s|van\s|de\s|di\s)?[A-ZÄÖÜ][a-zäöüß]+){1,2})\b/g;
  const names = new Set();
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1].trim();
    // Filter out common false positives
    const skipWords = [
      'The New', 'New York', 'Los Angeles', 'San Francisco', 'Hong Kong',
      'European Union', 'United States', 'United Kingdom', 'South Korea',
      'North America', 'South America', 'High Street', 'Fast Fashion',
      'Slow Fashion', 'Fair Trade', 'Supply Chain', 'Business Model',
      'Annual Report', 'Press Release', 'Read More', 'Learn More',
      'Last Year', 'Next Year', 'This Year',
    ];
    if (!skipWords.some(sw => name.startsWith(sw))) {
      names.add(name);
    }
  }
  return [...names];
}

/**
 * Extract company names from text by matching against tracked list
 */
function extractCompanies(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  return trackedCompanies.filter(company =>
    lowerText.includes(company.toLowerCase())
  );
}

/**
 * Detect geographic scope from text content and source metadata
 */
function detectGeo(text, sourceGeo) {
  const lowerText = (text || '').toLowerCase();
  const munichTerms = ['munich', 'münchen', 'bavaria', 'bayern', 'bavarian', 'bayerisch'];
  const dachTerms = [
    'germany', 'deutschland', 'austria', 'österreich', 'switzerland', 'schweiz',
    'berlin', 'hamburg', 'frankfurt', 'vienna', 'wien', 'zurich', 'zürich',
    'düsseldorf', 'cologne', 'köln', 'stuttgart',
  ];

  if (munichTerms.some(t => lowerText.includes(t))) return 'Munich';
  if (sourceGeo === 'Munich') return 'Munich';
  if (dachTerms.some(t => lowerText.includes(t))) return 'DACH';
  if (sourceGeo === 'DACH') return 'DACH';
  return 'EU';
}

/**
 * Generate tags from article content based on keyword matches
 */
function generateTags(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const tagMap = {
    'sustainability': ['sustainable', 'nachhaltig', 'green', 'eco-friendly', 'umweltfreundlich'],
    'circular-economy': ['circular', 'kreislauf', 'recycle', 'upcycl', 'resale', 'rental'],
    'ethical-fashion': ['ethical', 'ethisch', 'fair trade', 'faire mode', 'transparency'],
    'slow-fashion': ['slow fashion', 'capsule', 'timeless', 'quality over quantity'],
    'materials': ['organic cotton', 'bio-baumwolle', 'textile', 'fabric', 'material', 'gots'],
    'supply-chain': ['supply chain', 'lieferkette', 'sourcing', 'manufacturing', 'production'],
    'tech': ['technology', 'technologie', 'innovation', 'digital', 'ai ', 'blockchain'],
    'startup': ['startup', 'start-up', 'gründ', 'founder', 'funding', 'investment'],
    'regulation': ['regulation', 'regulierung', 'legislation', 'eu directive', 'policy'],
    'luxury': ['luxury', 'luxus', 'premium', 'high-end'],
    'retail': ['retail', 'einzelhandel', 'ecommerce', 'e-commerce', 'online shop'],
    'activewear': ['activewear', 'sportswear', 'athleisure', 'swimwear', 'workout'],
  };

  const tags = [];
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD)
 */
function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Truncate text to a max length, preserving whole words
 */
function truncate(text, maxLen = 280) {
  if (!text || text.length <= maxLen) return text || '';
  const truncated = text.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Process a raw feed item into enriched article object
 * @param {Object} item - Raw feed item from feed-fetcher
 * @returns {Object} Enriched article with metadata
 */
export function processArticle(item) {
  const fullText = `${item.title || ''} ${item.description || ''}`;

  return {
    date: normalizeDate(item.pubDate),
    title: item.title || 'Untitled',
    source: item.sourceName || 'Unknown',
    category: item.sourceCategory || 'General',
    geo: detectGeo(fullText, item.sourceGeo),
    relevanceScore: 0, // Set later by relevance-scorer
    summary: truncate(item.description),
    people: extractPeople(fullText),
    author: item.author || '',
    companies: extractCompanies(fullText),
    tags: generateTags(fullText),
    url: item.link || '',
    language: item.sourceLanguage || 'en',
  };
}

/**
 * Process all raw feed items into enriched articles
 * @param {Array} items - Raw feed items
 * @returns {Array} Enriched articles
 */
export function processAllArticles(items) {
  return items
    .filter(item => item.title && item.link)
    .map(processArticle);
}
