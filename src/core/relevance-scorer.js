/**
 * HACOY Daily News Tracker — Relevance Scorer
 *
 * Scores articles 0–100 based on keyword relevance to HACOY's focus areas.
 * Supports bilingual (EN + DE) keyword matching.
 */

import {
  highKeywords,
  mediumKeywords,
  lowKeywords,
  geoKeywords,
  scoring,
} from '../config/keywords.js';

/**
 * Count keyword matches in text (case-insensitive)
 * @param {string} text - Text to search
 * @param {Array<string>} keywords - Keywords to match
 * @returns {number} Number of unique keyword matches
 */
function countMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

/**
 * Calculate geographic bonus score
 * @param {string} text - Text to search
 * @returns {number} Geographic bonus points
 */
function geoBonus(text) {
  // Munich bonus (higher priority)
  if (geoKeywords.munich.terms.some(t => text.includes(t))) {
    return geoKeywords.munich.bonus;
  }
  // DACH bonus
  if (geoKeywords.dach.terms.some(t => text.includes(t))) {
    return geoKeywords.dach.bonus;
  }
  return 0;
}

/**
 * Score a single article for HACOY relevance
 * @param {Object} article - Processed article object
 * @returns {number} Relevance score 0–100
 */
export function scoreArticle(article) {
  const text = `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLowerCase();

  let score = 0;

  // Keyword matching
  score += countMatches(text, highKeywords) * scoring.highWeight;
  score += countMatches(text, mediumKeywords) * scoring.mediumWeight;
  score += countMatches(text, lowKeywords) * scoring.lowWeight;

  // Geographic bonus
  score += geoBonus(text);

  // Bonus for HACOY mention
  if (text.includes('hacoy')) {
    score += 30;
  }

  // Cap at max score
  return Math.min(score, scoring.maxScore);
}

/**
 * Score all articles and filter by minimum threshold
 * @param {Array} articles - Array of processed articles
 * @returns {Array} Scored and filtered articles, sorted by relevance
 */
export function scoreAndFilter(articles) {
  const scored = articles.map(article => ({
    ...article,
    relevanceScore: scoreArticle(article),
  }));

  const filtered = scored.filter(a => a.relevanceScore >= scoring.minThreshold);

  // Sort by relevance score (highest first), then by date (newest first)
  filtered.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.date.localeCompare(a.date);
  });

  console.log(`🎯 Scored ${articles.length} articles → ${filtered.length} above threshold (≥${scoring.minThreshold})\n`);

  return filtered;
}
