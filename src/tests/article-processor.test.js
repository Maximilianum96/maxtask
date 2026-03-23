import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processArticle, processAllArticles } from '../core/article-processor.js';

describe('Article Processor', () => {
  it('should process a raw feed item into enriched article', () => {
    const item = {
      title: 'Patagonia Expands Sustainable Sportswear Line in Munich',
      link: 'https://example.com/patagonia-munich',
      pubDate: 'Mon, 23 Mar 2026 08:00:00 GMT',
      description: 'Anna Schmidt reports: Patagonia launches new organic cotton activewear collection in München, partnering with local Bavarian artisans.',
      author: 'Anna Schmidt',
      sourceName: 'FashionUnited',
      sourceCategory: 'Fashion',
      sourceLanguage: 'en',
      sourceGeo: 'EU',
    };

    const article = processArticle(item);

    assert.equal(article.title, 'Patagonia Expands Sustainable Sportswear Line in Munich');
    assert.equal(article.source, 'FashionUnited');
    assert.equal(article.category, 'Fashion');
    assert.equal(article.date, '2026-03-23');
    assert.equal(article.author, 'Anna Schmidt');
    assert.equal(article.url, 'https://example.com/patagonia-munich');
    assert.equal(article.geo, 'Munich');

    // Should detect Patagonia as a tracked company
    assert.ok(article.companies.includes('Patagonia'), 'Should detect Patagonia');

    // Should detect person names
    assert.ok(article.people.length > 0, 'Should extract people');

    // Should generate relevant tags
    assert.ok(article.tags.length > 0, 'Should generate tags');
    assert.ok(article.tags.includes('activewear') || article.tags.includes('materials'),
      'Should include relevant tags');
  });

  it('should normalize dates to ISO format', () => {
    const item = {
      title: 'Test',
      link: 'https://example.com/test',
      pubDate: 'Mon, 23 Mar 2026 08:00:00 GMT',
      description: 'Test article',
      author: '',
      sourceName: 'Test',
      sourceCategory: 'Fashion',
      sourceLanguage: 'en',
      sourceGeo: 'EU',
    };

    const article = processArticle(item);
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('should handle missing fields gracefully', () => {
    const item = {
      title: '',
      link: 'https://example.com/empty',
      pubDate: '',
      description: '',
      author: '',
      sourceName: '',
      sourceCategory: '',
      sourceLanguage: '',
      sourceGeo: '',
    };

    const article = processArticle(item);
    assert.equal(article.title, 'Untitled');
    assert.equal(article.source, 'Unknown');
    assert.ok(article.date, 'Should have a default date');
  });

  it('should truncate long summaries', () => {
    const longDesc = 'A'.repeat(500);
    const item = {
      title: 'Test',
      link: 'https://example.com/long',
      pubDate: '2026-03-23',
      description: longDesc,
      author: '',
      sourceName: 'Test',
      sourceCategory: 'Fashion',
      sourceLanguage: 'en',
      sourceGeo: 'EU',
    };

    const article = processArticle(item);
    assert.ok(article.summary.length <= 284, `Summary too long: ${article.summary.length}`);
  });

  it('should filter items without title or link', () => {
    const items = [
      { title: 'Valid', link: 'https://example.com/1', description: 'OK', sourceName: 'S' },
      { title: '', link: 'https://example.com/2', description: 'No title', sourceName: 'S' },
      { title: 'No link', link: '', description: 'Missing', sourceName: 'S' },
      { title: 'Also valid', link: 'https://example.com/3', description: 'OK', sourceName: 'S' },
    ];

    const articles = processAllArticles(items);
    assert.equal(articles.length, 2);
  });

  it('should detect Munich geographic scope from content', () => {
    const item = {
      title: 'Fashion Event in München',
      link: 'https://example.com/munich',
      description: 'A sustainable fashion show in Bavaria.',
      sourceName: 'Test',
      sourceCategory: 'Fashion',
      sourceLanguage: 'de',
      sourceGeo: 'DACH',
    };

    const article = processArticle(item);
    assert.equal(article.geo, 'Munich');
  });
});
