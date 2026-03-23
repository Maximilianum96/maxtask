import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchFeed } from '../core/feed-fetcher.js';

describe('Feed Fetcher', () => {
  it('should parse RSS 2.0 feed items', async () => {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Test Feed</title>
        <item>
          <title>Sustainable Fashion Trends 2026</title>
          <link>https://example.com/article-1</link>
          <pubDate>Mon, 23 Mar 2026 08:00:00 GMT</pubDate>
          <description>The latest in sustainable fashion from Munich.</description>
          <dc:creator>Anna Schmidt</dc:creator>
        </item>
        <item>
          <title>Circular Economy Report</title>
          <link>https://example.com/article-2</link>
          <pubDate>Sun, 22 Mar 2026 10:00:00 GMT</pubDate>
          <description>New EU regulations on textile waste.</description>
          <author>Max Mueller</author>
        </item>
      </channel>
    </rss>`;

    const mockSource = {
      name: 'Test Source',
      url: 'https://example.com/rss',
      category: 'Fashion',
      language: 'en',
      geo: 'EU',
    };

    // Mock global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      text: async () => rssXml,
    }));

    try {
      const items = await fetchFeed(mockSource);

      assert.equal(items.length, 2);
      assert.equal(items[0].title, 'Sustainable Fashion Trends 2026');
      assert.equal(items[0].link, 'https://example.com/article-1');
      assert.equal(items[0].sourceName, 'Test Source');
      assert.equal(items[0].sourceCategory, 'Fashion');
      assert.equal(items[0].sourceGeo, 'EU');
      assert.equal(items[1].title, 'Circular Economy Report');
      assert.equal(items[1].author, 'Max Mueller');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should parse Atom feed entries', async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Atom Test</title>
      <entry>
        <title>GOTS Certification Update</title>
        <link href="https://example.com/atom-1" />
        <published>2026-03-23T09:00:00Z</published>
        <summary>New GOTS standards for organic cotton.</summary>
        <author><name>Lisa Weber</name></author>
      </entry>
    </feed>`;

    const mockSource = {
      name: 'Atom Source',
      url: 'https://example.com/atom',
      category: 'Sustainability',
      language: 'de',
      geo: 'DACH',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      text: async () => atomXml,
    }));

    try {
      const items = await fetchFeed(mockSource);

      assert.equal(items.length, 1);
      assert.equal(items[0].title, 'GOTS Certification Update');
      assert.equal(items[0].link, 'https://example.com/atom-1');
      assert.equal(items[0].author, 'Lisa Weber');
      assert.equal(items[0].sourceLanguage, 'de');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle fetch errors gracefully', async () => {
    const mockSource = {
      name: 'Broken Source',
      url: 'https://example.com/broken',
      category: 'Fashion',
      language: 'en',
      geo: 'EU',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      throw new Error('Network error');
    });

    try {
      const items = await fetchFeed(mockSource);
      assert.equal(items.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle HTTP error responses', async () => {
    const mockSource = {
      name: '404 Source',
      url: 'https://example.com/404',
      category: 'Fashion',
      language: 'en',
      geo: 'EU',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 404,
    }));

    try {
      const items = await fetchFeed(mockSource);
      assert.equal(items.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
