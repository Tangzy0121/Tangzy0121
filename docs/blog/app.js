(() => {
  const root = document.getElementById('tangzy-blog');
  const posts = [...window.TangzyBlogPosts].sort((a,b) => b.date.localeCompare(a.date));
  const categories = ['全部', ...new Set(['技术','科研','随笔','生活', ...posts.map(post => post.category)])];
  const pageSize = 8;
  const years = ['all', ...new Set(posts.map(post => post.date.slice(0,4)))];
  const state = { query:'', category:'全部', year:'all', visible:pageSize, article:null };
  const ui = {
    page:root.querySelector('.bs-page'), archive:root.querySelector('.bs-archive'), reader:root.querySelector('.bs-reader'),
    query:root.querySelector('#bs-query'), year:root.querySelector('#bs-year'), categories:root.querySelector('.bs-categories'),
    count:root.querySelector('.bs-count'), reset:root.querySelector('.bs-reset'), clear:root.querySelector('.bs-clear'),
    results:root.querySelector('.bs-results'), empty:root.querySelector('.bs-empty'), more:root.querySelector('.bs-more'), back:root.querySelector('.bs-back')
  };
  let timer, composing = false, renderedList = [];
  const lower = value => value.toLocaleLowerCase();
  const tokens = () => [...new Set(lower(state.query).trim().split(/\s+/).filter(Boolean))];
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function highlight(node, text, words = tokens()) {
    const textLower = lower(text), ranges = [];
    for (const word of words) {
      let offset = 0, index;
      while ((index = textLower.indexOf(word, offset)) !== -1) {
        ranges.push([index, index + word.length]);
        offset = index + word.length;
      }
    }
    ranges.sort((a,b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) {
      const last = merged[merged.length-1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
    }
    let offset = 0;
    for (const [start,end] of merged) {
      node.append(document.createTextNode(text.slice(offset,start)), element('mark','',text.slice(start,end)));
      offset = end;
    }
    node.append(document.createTextNode(text.slice(offset)));
  }
  function matchingPosts() {
    const words = tokens();
    return posts.filter(post => {
      const corpus = lower([post.title,post.category,...post.tags,...post.body].join(' '));
      return (state.category === '全部' || post.category === state.category)
        && (state.year === 'all' || post.date.startsWith(state.year))
        && words.every(word => corpus.includes(word));
    });
  }
  function bodySnippet(post) {
    const body = post.body.join(' '), textLower = lower(body);
    const indices = tokens().map(word => textLower.indexOf(word)).filter(index => index >= 0);
    if (!indices.length) return '';
    const index = Math.min(...indices), start = Math.max(0,index-20), end = Math.min(body.length,index+65);
    return (start ? '…' : '') + body.slice(start,end) + (end < body.length ? '…' : '');
  }
  function address() {
    const url = new URL(location.href);
    for (const key of ['q','category','year']) url.searchParams.delete(key);
    if (state.query.trim()) url.searchParams.set('q',state.query.trim());
    if (state.category !== '全部') url.searchParams.set('category',state.category);
    if (state.year !== 'all') url.searchParams.set('year',state.year);
    url.hash = state.article ? 'post=' + encodeURIComponent(state.article) : '';
    return url;
  }
  function persist() {
    history.replaceState({ ...history.state, blog:{ ...history.state?.blog, visible:state.visible } },'',address());
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    state.query = (params.get('q') || '').slice(0,160);
    state.category = categories.includes(params.get('category')) ? params.get('category') : '全部';
    state.year = years.includes(params.get('year')) ? params.get('year') : 'all';
    const visible = history.state?.blog?.visible;
    state.visible = Number.isInteger(visible) ? Math.min(Math.max(pageSize,posts.length),Math.max(pageSize,visible)) : pageSize;
    let article = null;
    try { if (location.hash.startsWith('#post=')) article = decodeURIComponent(location.hash.slice(6)); } catch {}
    state.article = posts.some(post => post.id === article) ? article : null;
  }
  function renderReader() {
    const post = posts.find(post => post.id === state.article);
    ui.archive.hidden = !!post;
    ui.reader.hidden = !post;
    document.title = post ? post.title + ' · Tangzy Blog' : 'Tangzy Blog · 写下来的事';
    if (!post) return;
    ui.reader.querySelector('.bs-reader-title').textContent = post.title;
    ui.reader.querySelector('.bs-reader-meta').textContent = post.date + ' · ' + post.category;
    ui.reader.querySelector('.bs-reader-tags').textContent = post.tags.map(tag => '#' + tag).join('  ');
    const body = ui.reader.querySelector('.bs-reader-body');
    body.replaceChildren(...post.body.map(paragraph => {
      const node = element('p');
      highlight(node,paragraph);
      return node;
    }));
  }
  function openArticle(post) {
    history.replaceState({ ...history.state, blog:{ visible:state.visible, scrollY:window.scrollY } },'',location.href);
    state.article = post.id;
    history.pushState({ blog:{ visible:state.visible, fromArchive:true } },'',address());
    renderReader();
    window.scrollTo(0,0);
    ui.back.focus();
  }
  function render() {
    ui.query.value = state.query;
    ui.year.value = state.year;
    ui.clear.hidden = !state.query;
    const active = !!state.query.trim() || state.category !== '全部' || state.year !== 'all';
    ui.reset.hidden = !active;
    for (const button of ui.categories.querySelectorAll('button')) button.setAttribute('aria-pressed',String(button.dataset.category === state.category));
    renderedList = matchingPosts();
    const shown = renderedList.slice(0,state.visible);
    ui.count.textContent = (active ? '找到 ' : '共 ') + renderedList.length + ' 篇文章' + (shown.length < renderedList.length ? ' · 已显示 ' + shown.length + ' 篇' : '');
    ui.empty.hidden = !!renderedList.length;
    ui.empty.querySelector('h2').textContent = posts.length ? '没有找到相关文章' : '第一篇文字，正在路上。';
    ui.empty.querySelector('p').textContent = posts.length ? '试试其他关键词，或放宽类别与年份。' : '这里将按时间记录技术、科研与生活。';
    ui.empty.querySelector('button').hidden = !active;
    ui.more.hidden = shown.length >= renderedList.length;
    ui.more.textContent = '再看 ' + Math.min(pageSize,renderedList.length-shown.length) + ' 篇';
    ui.results.replaceChildren();
    for (const year of [...new Set(shown.map(post => post.date.slice(0,4)))]) {
      const section = element('section','bs-group');
      section.setAttribute('aria-label',year + ' 年文章');
      section.append(element('h2','bs-year-heading',year));
      const list = element('ul','bs-list');
      for (const post of shown.filter(post => post.date.startsWith(year))) {
        const row = element('li','bs-row');
        row.dataset.id = post.id;
        const date = element('time','bs-date',post.date.slice(5));
        date.dateTime = post.date;
        date.setAttribute('aria-label',post.date);
        const entry = element('div','bs-entry');
        const title = element('a','bs-title cursor-interaction');
        const target = address(); target.hash = 'post=' + encodeURIComponent(post.id);
        title.href = target.href;
        title.dataset.id = post.id;
        title.setAttribute('aria-label','阅读：' + post.title);
        highlight(title,post.title);
        title.addEventListener('click',event => { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); openArticle(post); });
        entry.append(title);
        if (tokens().length) {
          const tags = element('div','bs-search-tags');
          highlight(tags,post.tags.map(tag => '#' + tag).join('  '));
          entry.append(tags);
          const snippet = bodySnippet(post);
          if (snippet) {
            const node = element('div','bs-snippet');
            highlight(node,snippet);
            entry.append(node);
          }
        }
        row.append(date,element('span','bs-category',post.category),entry);
        list.append(row);
      }
      section.append(list);
      ui.results.append(section);
    }
    renderReader();
  }
  function updateSearch() {
    clearTimeout(timer);
    state.query = ui.query.value;
    state.visible = pageSize;
    render();
    persist();
  }
  function reset() {
    clearTimeout(timer);
    Object.assign(state,{ query:'', category:'全部', year:'all', visible:pageSize, article:null });
    render();
    persist();
    ui.query.focus();
  }
  for (const category of categories) {
    const button = element('button','bs-category-button cursor-interaction',category);
    button.type = 'button';
    button.dataset.category = category;
    button.addEventListener('click',() => {
      clearTimeout(timer);
      Object.assign(state,{ category, query:ui.query.value, visible:pageSize });
      render(); persist();
    });
    ui.categories.append(button);
  }
  ui.query.addEventListener('compositionstart',() => { composing = true; clearTimeout(timer); });
  ui.query.addEventListener('compositionend',() => { composing = false; updateSearch(); });
  ui.query.addEventListener('input',() => {
    ui.clear.hidden = !ui.query.value;
    if (composing) return;
    clearTimeout(timer); timer = setTimeout(updateSearch,160);
  });
  root.querySelector('form').addEventListener('submit',event => { event.preventDefault(); if (!composing) updateSearch(); });
  ui.year.addEventListener('change',() => {
    clearTimeout(timer);
    Object.assign(state,{ year:ui.year.value, query:ui.query.value, visible:pageSize });
    render(); persist();
  });
  ui.clear.addEventListener('click',() => { ui.query.value = ''; updateSearch(); ui.query.focus(); });
  ui.reset.addEventListener('click',reset);
  root.querySelector('.bs-empty-reset').addEventListener('click',reset);
  ui.more.addEventListener('click',() => {
    const firstNew = renderedList[state.visible]?.id;
    state.visible += pageSize;
    render(); persist();
    const target = [...ui.results.querySelectorAll('.bs-title')].find(button => button.dataset.id === firstNew);
    if (target) target.focus();
  });
  ui.back.addEventListener('click',() => {
    if (history.state?.blog?.fromArchive) { history.back(); return; }
    state.article = null; persist(); renderReader(); ui.query.focus();
  });
  for (const year of years.filter(year => year !== 'all')) {
    const option = element('option','',year); option.value = year; ui.year.append(option);
  }
  ui.year.disabled = years.length === 1;
  function navigate() {
    clearTimeout(timer); restore(); render();
    requestAnimationFrame(() => window.scrollTo(0,state.article ? 0 : (history.state?.blog?.scrollY || 0)));
  }
  window.addEventListener('popstate',navigate);
  window.addEventListener('hashchange',navigate);
  restore(); render();
})();
