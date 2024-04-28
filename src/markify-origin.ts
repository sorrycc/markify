import type TurndownService from 'turndown';

'file: libs/turndown.js';
'file: libs/Readability.js';

declare global {
  interface Window {
    TurndownService: typeof import('turndown');
  }
  const TurndownService: typeof import('turndown');
  const Readability: typeof import('@mozilla/readability').Readability;
}

class HtmlToMarkdown {
  #html: HTMLElement;
  constructor() {
    this.#html = this.#getMainContentElement();
    this.#convert().then(() => {
      console.log('done');
    }).catch((err) => {
      console.error(err);
    });
  }

  #getMainContentElement() {
    const mainContent = document.querySelector('main');
    if (mainContent) return mainContent;
    const article = document.querySelector('article');
    if (article) return article;
    return document.body;
  }

  async #getTurndownClass() {
    return new Promise<typeof TurndownService>((resolve, reject) => {
      const inBrowser = typeof window !== 'undefined';
      if (inBrowser) {
        if (window.TurndownService) return resolve(window.TurndownService);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/turndown/dist/turndown.js';
        document.body.appendChild(script);
        script.onload = () => {
          resolve(window.TurndownService);
        };
        script.onerror = (err) => {
          reject(err);
        };
      } else {
        resolve(require('turndown'));
      }
    });
  }

  async #convert() {
    // const TurndownService = await this.#getTurndownClass();
    // @ts-ignore
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: undefined,
      // @ts-ignore
      preformattedCode: false,
    });
    turndownService.addRule('code', {
      filter(node, options) {
        // https://github.com/denoland/fresh/issues/2363
        if (node.nodeName === 'PRE' && (node.parentNode! as HTMLElement).className.includes('highlight')) {
          return true;
        }
        // https://www.joshwcomeau.com/react/css-in-rsc/
        if (node.nodeName === 'PRE' && node.querySelector('div[data-code-snippet=true]')) {
          return true;
        }
        return !!(
          node.nodeName === 'PRE' &&
          node.firstChild &&
          (node.firstChild.nodeName === 'CODE' ||
            // why pre > pre?
            // e.g. https://www.robinwieruch.de/next-forms/
            node.firstChild.nodeName === 'PRE' ||
            // why
            // e.g. https://claritydev.net/blog/improving-react-testing-library-tests
            node.lastChild?.nodeName === 'CODE' ||
            // e.g. https://www.totaltypescript.com/typescript-and-node
            node.querySelector('div.code-container')
          )
        )
      },
      replacement(content, node, options) {
        let codeEl = (node.lastChild?.nodeName === 'CODE' ? node.lastChild : node.firstChild) as HTMLElement;
        let language = '';
        if (codeEl && codeEl.nodeName === 'CODE') {
          const className = codeEl.getAttribute('class') || '';
          language = (className.match(/language-(\S+)/) || [null, ''])[1];
          if (!language && (node as HTMLElement).getAttribute('data-language')) {
            language = (node as HTMLElement).getAttribute('data-language')!;
          }
          // ref: https://www.totaltypescript.com/typescript-and-node
          if (node.querySelector('div.language-id')) {
            language = node.querySelector('div.language-id')!.textContent!;
          }
          // ref: https://www.totaltypescript.com/typescript-and-node
          if (node.querySelector('div.code-container > code')) {
            codeEl = node.querySelector('div.code-container > code') as HTMLElement;
          }
        }
        // ref: https://github.com/denoland/fresh/issues/2363
        if (node.nodeName === 'PRE' && (node.parentNode! as HTMLElement).className.includes('highlight')) {
          codeEl = node as HTMLElement;
        }
        // https://www.joshwcomeau.com/react/css-in-rsc/
        if (node.nodeName === 'PRE' && node.querySelector('div[data-code-snippet=true]')) {
          codeEl = node.querySelector('div[data-code-snippet=true] textarea') as HTMLElement;
          language = node.firstChild!.firstChild!.textContent!;
        }
        const code = codeEl.innerText;
        // console.log('----');
        // console.log(node);
        // console.log((node as HTMLElement).innerText);
        // console.log('----');
        const fence = options.fence;
        return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
      }
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
          src = window.location.origin + src;
        } else if (src.startsWith('http')) {
          src = src;
        }
        const title = cleanAttribute(el.getAttribute('title'));
        const titlePart = title ? ' "' + title + '"' : '';
        return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
      }
    });
    const markdown = turndownService.turndown(this.#html);
    console.log(markdown);
  }
}

new HtmlToMarkdown();

