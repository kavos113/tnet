import { describe, expect, it } from 'vitest';
import { parseFeedXml } from './feedParser';

describe('parseFeedXml', () => {
  it('parses RSS 2.0 feeds', () => {
    const parsed = parseFeedXml(`
      <rss version="2.0">
        <channel>
          <title>Example RSS</title>
          <link>https://example.com</link>
          <item>
            <guid>item-1</guid>
            <title>Hello</title>
            <link>https://example.com/hello#fragment</link>
            <pubDate>Fri, 01 May 2026 10:00:00 GMT</pubDate>
            <description><![CDATA[<p>Summary</p><script>alert(1)</script>]]></description>
          </item>
        </channel>
      </rss>
    `);

    expect(parsed.title).toBe('Example RSS');
    expect(parsed.items[0]).toMatchObject({
      externalId: 'item-1',
      title: 'Hello',
      link: 'https://example.com/hello'
    });
    expect(parsed.items[0].contentHtml).toBe('<p>Summary</p>');
  });

  it('parses Atom feeds', () => {
    const parsed = parseFeedXml(`
      <feed>
        <title>Example Atom</title>
        <link href="https://example.com" />
        <entry>
          <id>tag:example.com,2026:1</id>
          <title>Atom Item</title>
          <link href="https://example.com/atom" />
          <updated>2026-05-01T10:00:00Z</updated>
        </entry>
      </feed>
    `);

    expect(parsed.title).toBe('Example Atom');
    expect(parsed.items[0]).toMatchObject({
      externalId: 'tag:example.com,2026:1',
      title: 'Atom Item',
      link: 'https://example.com/atom'
    });
  });

  it('parses RDF feeds with an XML declaration', () => {
    const parsed = parseFeedXml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
      >
        <channel rdf:about="https://example.com/">
          <title>Example RDF</title>
          <link>https://example.com/</link>
          <description>RDF feed</description>
        </channel>
        <item rdf:about="https://example.com/rdf-item">
          <title>RDF Item</title>
          <link>https://example.com/rdf-item</link>
          <dc:date>2026-05-01T10:00:00Z</dc:date>
          <description><![CDATA[<p>RDF Summary</p>]]></description>
        </item>
      </rdf:RDF>
    `);

    expect(parsed.title).toBe('Example RDF');
    expect(parsed.items[0]).toMatchObject({
      title: 'RDF Item',
      link: 'https://example.com/rdf-item',
      publishedAt: '2026-05-01T10:00:00.000Z'
    });
    expect(parsed.items[0].contentHtml).toBe('<p>RDF Summary</p>');
  });

  it('parses JSON Feed', () => {
    const parsed = parseFeedXml(
      JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'JSON Feed',
        home_page_url: 'https://example.com',
        items: [
          {
            id: 'json-1',
            url: 'https://example.com/json',
            title: 'JSON Item',
            content_text: 'Text content',
            date_published: '2026-05-01T10:00:00Z'
          }
        ]
      })
    );

    expect(parsed.title).toBe('JSON Feed');
    expect(parsed.items[0]).toMatchObject({
      externalId: 'json-1',
      title: 'JSON Item',
      link: 'https://example.com/json'
    });
  });
});
