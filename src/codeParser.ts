
interface ParseCodeResult {
  language: string;
  code: string;
}

function codeText(el: HTMLElement) {
  // return el.textContent || '';
  // TODO: why innerText don't work in node?
  let isBrowser = typeof window !== 'undefined';
  return isBrowser ? el.innerText : el.innerHTML;
}

function trimDoubleLineBreak(text: string) {
  return text.replace(/\n\n/g, '\n');
}

const LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
];

export function parseCode(node: HTMLElement, url: string): ParseCodeResult | null {
  let isEpicReact = node.nodeName === 'DIV' && node.className.includes('ch-codeblock');
  if (isEpicReact) {
    let language = node.querySelector('.ch-code-scroll-parent')?.getAttribute('data-ch-lang') || '';
    let code = codeText(findCodeEl(node));
    return {
      code,
      language,
    };
  }

  if (node.nodeName !== 'PRE') {
    return null;
  }

  let preClass = node.className || '';
  let codeEl = findCodeEl(node);
  let parentEl = node.parentElement;
  let code = '';
  let language = '';
  let cls = node.getAttribute('class') || '';
  let clsItems = cls.split(' ');

  if (codeEl) {
    let className = codeEl.getAttribute('class') || '';
    let lang = (className.match(/language-(\S+)/) || [null, ''])[1];
    if (lang) {
      language = lang;
    }
    code = codeText(codeEl);
  }

  // language for shiki
  // ref: https://www.totaltypescript.com/typescript-and-node
  let isShiki = preClass.split(' ').includes('shiki');
  if (isShiki && !language) {
    let langEl = node.querySelector('.language-id');
    if (langEl) {
      language = langEl.textContent || '';
    }
  }

  // github code block
  if (!code && !language) {
    let cls = parentEl?.getAttribute('class') || '';
    let clsItems = cls.split(' ');
    const isHighlight = clsItems.includes('highlight');
    if (isHighlight && !codeEl) {
      let cls = clsItems.filter(item => item.startsWith('highlight-source-'))[0];
      if (cls) {
        language = cls.replace('highlight-source-', '');
      }
      code = codeText(node);
    }
  }

  // e.g. sp-cm sp-pristine sp-javascript
  // e.g. https://react.dev/blog/2024/04/25/react-19
  if (!language && clsItems.includes('sp-cm')) {
    for (let lang of LANGUAGES) {
      if (clsItems.includes(`sp-${lang}`)) {
        language = lang;
        break;
      }
    }
    code = trimDoubleLineBreak(code);
  }

  if (!code && !codeEl) {
    code = codeText(node);
  }

  // default language
  if (!language) {
    language = 'ts';
  }

  code = code.trim();

  return {
    code,
    language,
  };
}

function findCodeEl(node: HTMLElement) {
  return node.querySelector('code') as HTMLElement;
}
