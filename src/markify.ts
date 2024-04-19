// TODO: use bundle to include turndown.js for browser
// 'file: libs/turndown.js';

import TurndownService from 'turndown';
import { parseCode } from './codeParser';

interface MarkifyOpts {
  html: string;
  // for relative URLs
  url: string;
}

export class Markify {
  #opts: MarkifyOpts;
  constructor(opts: MarkifyOpts) {
    this.#opts = opts;
  }

  async toMarkdown() {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: undefined,
      // @ts-ignore
      preformattedCode: false,
    });

    let opts = this.#opts;
    turndownService.addRule('code', {
      filter(node) {
        let parseResult = parseCode(node as HTMLElement, opts.url);
        if (parseResult) {
          const { code, language } = parseResult;
          node.setAttribute('data-markify-code', code);
          node.setAttribute('data-markify-language', language);
          return true;
        } else {
          return false;
        }
      },
      replacement(content, node, options) {
        const language = (node as HTMLElement).getAttribute('data-markify-language') || '';
        const code = (node as HTMLElement).getAttribute('data-markify-code') || '';
        const fence = options.fence;
        return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
      },
    });

    turndownService.addRule('image', {
      filter: 'img',
      replacement: (content, node) => {
        function cleanAttribute(attribute: any) {
          return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
        }
        const el = node as HTMLImageElement;
        const alt = cleanAttribute(el.getAttribute('alt'));
        let src = el.getAttribute('src') || '';
        // TODO: support relative URLs
        if (src.startsWith('/')) {
          // TODO: join with this.#opts.url
          src = window.location.origin + src;
        } else if (isRemote(src)) {
          src = src;
        }
        return src ? '![' + alt + ']' + '(' + src + ')' : ''
      }
    });

    return turndownService.turndown(this.#opts.html);
  }
}

function isRemote(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}
