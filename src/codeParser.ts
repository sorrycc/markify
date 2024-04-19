
interface ParseCodeResult {
  language: string;
  code: string;
}

export function parseCode(node: HTMLElement, url: string): ParseCodeResult | null {
  if (node.nodeName !== 'PRE') {
    return null;
  }
  let preClass = node.className || '';
  let codeEl = findCodeEl(node);
  let code = '';
  let language = '';
  if (codeEl) {
    let className = codeEl.getAttribute('class') || '';
    let lang = (className.match(/language-(\S+)/) || [null, ''])[1];
    if (lang) {
      language = lang;
    }
    // TODO: why innerText don't work in node?
    code = codeEl.innerHTML;
    // code = codeEl.innerText;
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

  return {
    code,
    language,
  };
}

function findCodeEl(node: HTMLElement) {
  return node.querySelector('code') as HTMLElement;
}
