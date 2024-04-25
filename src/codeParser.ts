
interface ParseCodeResult {
  language: string;
  code: string;
}

function codeText(el: HTMLElement) {
  return el.textContent;
  // // TODO: why innerText don't work in node?
  // let isBrowser = typeof window !== 'undefined';
  // return isBrowser ? el.innerText : el.innerHTML;
}

export function parseCode(node: HTMLElement, url: string): ParseCodeResult | null {
  if (node.nodeName !== 'PRE') {
    return null;
  }
  let preClass = node.className || '';
  let codeEl = findCodeEl(node);
  let parentEl = node.parentElement;
  let code = '';
  let language = '';
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

  code = code.trim();

  return {
    code,
    language,
  };
}

function findCodeEl(node: HTMLElement) {
  return node.querySelector('code') as HTMLElement;
}
