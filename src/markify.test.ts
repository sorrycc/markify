import assert from 'assert';
import { Markify } from "./markify";

(async () => {
  assert.strictEqual(await testMarkify('<h1>Hello World</h1>'), '# Hello World');
  assert.strictEqual(await testMarkify('<img src="a" alt="b">'), '![b](a)');
  assert.strictEqual(await testMarkify('<img src="a" alt="b\n\nc">'), '![b\nc](a)');
  assert.strictEqual(await testMarkify('<pre><code class="language-ts">a;</code><pre>'), '```ts\na;\n```');
  // shiki
  assert.strictEqual(await testMarkify('<pre class="shiki foo"><div class="language-id">ts</div><code>a;</code><pre>'), '```ts\na;\n```');
})();

async function testMarkify(html: string) {
  const markify = new Markify({ html, url: 'http://localhost' });
  return await markify.toMarkdown();
}
