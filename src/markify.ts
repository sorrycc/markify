import TurndownService from 'turndown';
import path from 'path';
import { parseCode } from './codeParser';
import { unescape } from 'querystring';

interface MarkifyOpts {
  html: string | HTMLElement | Document | DocumentFragment;
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
    let url = new URL(opts.url);
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
        if (!isRemote(src)) {
          src = url.origin + path.resolve(url.pathname, src);
        }
        return src ? '![' + alt + ']' + '(' + src + ')' : ''
      }
    });

    let markdown = turndownService.turndown(this.#opts.html);
    markdown = this.#normalizeMarkdown(markdown);
    return markdown;
  }

  #normalizeMarkdown(markdown: string) {
    let lines = markdown.split('\n');
    let result = [];
    for (let line of lines) {
      let originLine = line;

      line = line.trim();
      line = line.replace(/\\#/g, '#');
      line = line.replace(/\\\[/g, '[');
      line = line.replace(/\\\]/g, ']');

      // remove anchor link for empty header
      // e.g. [#](#why-did-this-happen)
      if (/^\[#\]\(#[^\)]+\)$/.test(line)) {
        continue;
      }
      // remove end anchor link for headers
      // e.g. # test[](#why-did-this-happen)
      let endWithAnchorReg = /\[\]\(#[^\)]+\)$/;
      let isTitle = /^#+\s+[^\s]/.test(line);
      if (isTitle && endWithAnchorReg.test(line)) {
        result.push(line.replace(endWithAnchorReg, ''));
        continue;
      }

      result.push(originLine);
    }
    return result.join('\n');
  }
}

function isRemote(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}
