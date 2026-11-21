(() => {
  'use strict';
  const data = window.KIYOTO_EDITOR_DATA;
  if (!data) return;
  const ordered = (g, parent = '', depth = 0) => depth > 50 ? [] : g.items.filter(n=>(n.parent||'')===parent).flatMap(n=>[n,...ordered(g,n.id,depth+1)]);
  window.KIYOTO_GROUPS = data.groups.map(g=>({...g,items:ordered(g)}));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const text = (value, lang) => value?.[lang] || value?.en || '';
  const safeCopy = value => Array.isArray(value) ? value.map(safeCopy) : typeof value === 'string' ? esc(value) : value;
  for (const lang of ['en', 'fa', 'ar']) {
    for (const [key, value] of Object.entries(data.content[lang])) if (Object.hasOwn(window.KIYOTO_CONTENT[lang], key)) window.KIYOTO_CONTENT[lang][key] = safeCopy(value);
    window.KIYOTO_CONTENT[lang].names = data.members.map(m => esc(m.name[lang]));
    window.KIYOTO_CONTENT[lang].roles = data.members.map(m => esc(m.role[lang]));
    window.KIYOTO_CONTENT[lang].bios = data.members.map(m => m.bio[lang]);
  }
  window.KIYOTO_MEMBERS = data.members.map(m => ({ id: m.id, image: m.image.replace(/^assets\//, ''), width: 800, height: 1000, instagram: m.instagram || '' }));
  if (data.settings?.logo && /^assets\/[a-zA-Z0-9/_.-]+$/.test(data.settings.logo)) document.documentElement.style.setProperty('--full-mask', `url("${data.settings.logo}")`);
  window.KIYOTO_RENDER_WORK = (lang, groups, x) => groups.flatMap(group => group.items.flatMap(discipline => {
    const projects = data.projects.filter(p => p.discipline === discipline.id && p.published !== false && p.media?.length).sort((a, b) => (a.slot || 0) - (b.slot || 0));
    const cards = projects.map(p => {
      const cover = p.media[0];
      const style = `object-position:${cover?.x ?? 50}% ${cover?.y ?? 50}%`;
      const title = text(p.title, lang) || discipline[lang];
      return `<article class="work-space filled-work" data-category="${group.id}" data-discipline="${discipline.id}"><button class="project-cover" data-project="${esc(p.id)}" aria-label="${esc(title)}">${cover.type === 'video' ? `<video src="${esc(cover.src)}" muted playsinline preload="metadata" style="${style}"></video><span class="play-mark" aria-hidden="true">▶</span>` : `<img src="${esc(cover.src)}" alt="${esc(text(cover.alt, lang) || title)}" loading="lazy" style="${style}">`}</button><div class="work-caption"><h3>${esc(title)}</h3><span>${esc(discipline[lang])}${p.year ? ` / ${esc(p.year)}` : ''}</span></div></article>`;
    });
    return cards;
  })).join('');
  function closeProject(dialog) { dialog.close(); dialog.remove(); }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-project]');
    if (!button) return;
    const project = data.projects.find(p => p.id === button.dataset.project);
    if (!project) return;
    const lang = document.documentElement.lang;
    const subject = data.groups.flatMap(g => g.items).find(d => d.id === project.discipline);
    const title = text(project.title, lang) || subject?.[lang] || '';
    const dialog = document.createElement('dialog');
    dialog.className = 'project-dialog';
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = `<div class="project-dialog-top"><span>${esc(project.client || '')} ${esc(project.year || '')}</span><button class="project-close" aria-label="${lang === 'fa' ? 'بستن' : lang === 'ar' ? 'إغلاق' : 'Close project'}">×</button></div><h2>${esc(title)}</h2><div class="project-description">${text(project.description, lang).split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}</div><div class="project-gallery">${project.media.map(m => `<figure>${m.type === 'video' ? `<video src="${esc(m.src)}" controls playsinline preload="metadata"></video>` : `<img src="${esc(m.src)}" alt="${esc(text(m.alt, lang) || title)}" loading="lazy">`}</figure>`).join('')}</div>`;
    document.body.append(dialog);
    dialog.querySelector('.project-close').onclick = () => closeProject(dialog);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(dialog); });
    dialog.showModal();
  });
  // Preview parameters are only used by the local desktop preview server.
  if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
    const lang = new URL(location.href).searchParams.get('previewLanguage');
    if (['en', 'fa', 'ar'].includes(lang)) {
      try { localStorage.setItem('kiyoto-v2-language', lang); sessionStorage.setItem('kiyoto-v2-entered', 'yes'); } catch {}
    }
  }
})();
