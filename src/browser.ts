import { Markify } from './markify';

(async () => {
  let html = (() => {
    const mainContent = document.querySelector('main');
    if (mainContent) return mainContent;
    const article = document.querySelector('article');
    if (article) return article;
    return document.body;
  })();

  let url = location.href;
  let markify = new Markify({
    html,
    url,
  });
  let markdown = await markify.toMarkdown();
  markdown = `
> 原文：${url}

${markdown}
  `;
  console.log(markdown);
})().catch(e => {
  console.error(e);
});
