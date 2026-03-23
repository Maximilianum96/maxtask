import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreArticle, scoreAndFilter } from '../core/relevance-scorer.js';

describe('Relevance Scorer', () => {
  it('should score high for sustainable fashion keywords', () => {
    const article = {
      title: 'Sustainable Fashion Revolution in Munich',
      summary: 'New circular economy initiative for ethical fashion with GOTS certified organic cotton.',
      tags: ['sustainability', 'circular-economy'],
    };

    const score = scoreArticle(article);
    assert.ok(score >= 50, `Expected score >= 50, got ${score}`);
  });

  it('should score low for unrelated articles', () => {
    const article = {
      title: 'Tech Company Launches New Phone',
      summary: 'A new smartphone has been released by a major tech company.',
      tags: ['tech'],
    };

    const score = scoreArticle(article);
    assert.ok(score < 15, `Expected score < 15, got ${score}`);
  });

  it('should give Munich geographic bonus', () => {
    const munichArticle = {
      title: 'Fashion Startup in München',
      summary: 'A new sustainable fashion startup launches in Bavaria.',
      tags: ['startup'],
    };

    const euArticle = {
      title: 'Fashion Startup in Paris',
      summary: 'A new sustainable fashion startup launches in France.',
      tags: ['startup'],
    };

    const munichScore = scoreArticle(munichArticle);
    const euScore = scoreArticle(euArticle);

    assert.ok(munichScore > euScore, `Munich score (${munichScore}) should be > EU score (${euScore})`);
  });

  it('should give bonus for HACOY mention', () => {
    const withHacoy = {
      title: 'HACOY launches new collection',
      summary: 'Ethical fashion brand HACOY releases sustainable activewear.',
      tags: ['ethical-fashion'],
    };

    const withoutHacoy = {
      title: 'Brand launches new collection',
      summary: 'Ethical fashion brand releases sustainable activewear.',
      tags: ['ethical-fashion'],
    };

    const scoreWith = scoreArticle(withHacoy);
    const scoreWithout = scoreArticle(withoutHacoy);

    assert.ok(scoreWith > scoreWithout, `HACOY score (${scoreWith}) should be > without (${scoreWithout})`);
  });

  it('should cap score at 100', () => {
    const article = {
      title: 'Sustainable fashion circular economy ethical fashion organic cotton GOTS Munich',
      summary: 'Slow fashion fair trade fashion activewear sportswear Bavaria textile innovation HACOY',
      tags: ['sustainability', 'circular-economy', 'ethical-fashion', 'materials', 'activewear'],
    };

    const score = scoreArticle(article);
    assert.equal(score, 100);
  });

  it('should filter articles below threshold', () => {
    const articles = [
      {
        title: 'Sustainable fashion in Munich',
        summary: 'Circular economy for ethical fashion with organic cotton.',
        tags: ['sustainability'],
        date: '2026-03-23',
      },
      {
        title: 'New phone released',
        summary: 'Latest smartphone review.',
        tags: [],
        date: '2026-03-23',
      },
    ];

    const filtered = scoreAndFilter(articles);
    assert.ok(filtered.length >= 1, 'Should keep relevant article');
    assert.ok(filtered.every(a => a.relevanceScore >= 15), 'All should be above threshold');
  });
});
