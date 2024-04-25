import assert from 'assert';
import { Markify } from "./markify";

(async () => {
  assert.strictEqual(await testMarkify('<h1>Hello World</h1>'), '# Hello World');

  // images
  assert.strictEqual(await testMarkify('<img src="http://c.com/a" alt="b">'), '![b](http://c.com/a)');
  assert.strictEqual(await testMarkify('<img src="a" alt="b">'), '![b](http://localhost/a)');
  assert.strictEqual(await testMarkify('<img src="a" alt="b">', 'http://a.com/b/'), '![b](http://a.com/b/a)');
  assert.strictEqual(await testMarkify('<img src="a" alt="b\n\nc">'), '![b\nc](http://localhost/a)');

  // code
  assert.strictEqual(await testMarkify('<pre><code class="language-ts">a;</code><pre>'), '```ts\na;\n```');
  // shiki
  assert.strictEqual(await testMarkify('<pre class="shiki foo"><div class="language-id">ts</div><code>a;</code><pre>'), '```ts\na;\n```');
  // github
  assert.strictEqual(await testMarkify('<div class="highlight highlight-source-ts"><pre>a;</pre></div>'), '```ts\na;\n```');

  // remove anchor links only lines
  assert.strictEqual(await testMarkify('<a href="#abc">#</a>'), '');
})();

async function testMarkify(html: string, url: string = 'http://localhost') {
  const markify = new Markify({ html, url });
  return await markify.toMarkdown();
}
