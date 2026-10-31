/* Interface behavior. Personal details and project text live in content.js. */
import './projects-loader.js';
import {imageURL} from './project-model.js';
(async () => {
  'use strict';
  const data = window.PORTFOLIO;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const imagePath = imageURL;
  // Text is inserted as textContent, not interpreted as HTML.
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  $$('[data-name]').forEach(el => el.textContent = data.name);
  $$('[data-email]').forEach(el => el.textContent = data.email);
  $$('[data-location]').forEach(el => el.textContent = data.location);
  $('[data-intro]').textContent = data.introduction;
  $$('.email-link').forEach(el => el.href = `mailto:${data.email}`);
  $$('.resume-link').forEach(el => el.href = data.resume);
  $('#phone-link').textContent = data.phone;
  $('#phone-link').href = `tel:${data.phone.replace(/[^+\d]/g, '')}`;
  document.title = `${data.name} — Hardware & Embedded Systems`;
  $('#year').textContent = new Date().getFullYear();
  [['LinkedIn', data.linkedin], ['GitHub', data.github]].forEach(([label, url]) => {
    if (!url || !/^https:\/\//i.test(url)) return;
    const link = element('a', '', `${label} ↗`);
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    $('#social-links').append(link);
  });

  // Theme preference persists on this browser when storage is available.
  let theme = 'dark';
  try { theme = localStorage.getItem('ezra-theme') || 'dark'; } catch { /* Storage is optional. */ }
  function setTheme(value) {
    theme = value === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    $('.theme-button').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#0a1113' : '#f5f5ef';
    try { localStorage.setItem('ezra-theme', theme); } catch { /* Private browsing may block storage. */ }
  }
  setTheme(theme);
  $('.theme-button').addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  const menu = $('.menu-button');
  function closeMenu() { $('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); }
  menu.addEventListener('click', () => {
    const open = $('#navigation').classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
  });
  $$('#navigation a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  // Project grid and filters.
  await window.PORTFOLIO_READY;
  const filters=$('.filter-row'); filters.replaceChildren();
  ['All',...new Set(data.projects.map(p=>p.category))].forEach((category,i)=>{const b=element('button',`filter${i===0?' active':''}`,category==='All'?`All projects (${data.projects.length})`:category);b.dataset.filter=category;b.setAttribute('aria-pressed',String(i===0));filters.append(b);});
  if(window.PROJECT_LOAD_ERROR) $('#project-grid').append(element('p','','Projects are temporarily unavailable. Please reload to try again.'));
  else if(!data.projects.length) $('#project-grid').append(element('p','','New projects are on the way.'));
  const grid = $('#project-grid');
  data.projects.forEach(project => {
    const card = element('article', 'project-card');
    card.dataset.category = project.category;
    const coverButton = element('button', 'project-image');
    coverButton.setAttribute('aria-label', `View ${project.title}`);
    const img = element('img'); img.src = imagePath(project.cover);
    img.alt = project.images.find(item => item[0] === project.cover)?.[1] || project.title;
    img.loading = 'lazy'; img.width = 800; img.height = 600;
    coverButton.append(img, element('span', 'image-counter', `${String(project.images.length).padStart(2, '0')} PHOTOS ↗`));
    const body = element('div', 'project-content');
    body.append(element('div', 'project-number', `${project.number} / ${project.category.toUpperCase()}`), element('h3', '', project.title), element('p', 'card-role', project.role), element('p', '', project.subtitle));
    const tags = element('ul', 'tags'); project.tags.forEach(tag => tags.append(element('li', '', tag))); body.append(tags);
    const link = element('button', 'project-link', 'Explore project'); link.append(element('span', '', '↗')); body.append(link);
    [link, coverButton].forEach(button => button.addEventListener('click', () => openProject(project)));
    card.append(coverButton, body); grid.append(card);
  });
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(filter => { filter.classList.toggle('active', filter === button); filter.setAttribute('aria-pressed', String(filter === button)); });
    let count = 0;
    $$('.project-card').forEach(card => { card.hidden = button.dataset.filter !== 'All' && card.dataset.category !== button.dataset.filter; if (!card.hidden) count++; });
    $('#filter-status').textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown`;
  }));

  // Native dialog supplies keyboard focus trapping and Escape-to-close.
  const dialog = $('#project-dialog');
  let currentProject = null;
  let imageIndex = 0;
  let previousFocus = null;
  function showImage(index) {
    const photos = currentProject.images;
    imageIndex = (index + photos.length) % photos.length;
    const [file, caption] = photos[imageIndex];
    $('#gallery-image').src = imagePath(file); $('#gallery-image').alt = caption;
    $('#gallery-caption').textContent = caption;
    $('#gallery-count').textContent = `${imageIndex + 1} / ${photos.length}`;
    $('#full-image').href = imagePath(file);
    $$('.thumbnail').forEach((button, i) => button.setAttribute('aria-pressed', String(i === imageIndex)));
  }
  function openProject(project) {
    previousFocus = document.activeElement;
    currentProject = project;
    $('#dialog-category').textContent = `${project.number} / ${project.category}`;
    $('#dialog-role').textContent = project.role; $('#dialog-title').textContent = project.title;
    $('#dialog-description').textContent = project.description;
    $('#dialog-contribution').textContent = project.contribution;
    $('#contribution-title').textContent = ['switch', 'node'].includes(project.id) ? 'Project focus' : 'My contribution';
    $('#dialog-highlights').replaceChildren(...project.highlights.map(text => element('li', '', text)));
    $('#dialog-facts').replaceChildren(...project.facts.map(([label, value]) => { const dl = element('dl'); dl.append(element('dt', '', label), element('dd', '', value)); return dl; }));
    $('#gallery-thumbnails').replaceChildren(...project.images.map(([file, caption], i) => {
      const button = element('button', 'thumbnail'); button.setAttribute('aria-label', `Show photo ${i + 1}: ${caption}`);
      const img = element('img'); img.src = imagePath(file); img.alt = ''; img.loading = 'lazy';
      button.append(img); button.addEventListener('click', () => showImage(i)); return button;
    }));
    showImage(Math.max(0,project.images.findIndex(x=>x[0]===project.cover))); dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('modal-open'); $('#close-dialog').focus();
  }
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); previousFocus?.focus(); });
  $('#previous-image').addEventListener('click', () => showImage(imageIndex - 1));
  $('#next-image').addEventListener('click', () => showImage(imageIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(imageIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(imageIndex - 1); }
  });

  data.experience.forEach(job => {
    const item = element('article', 'timeline-item');
    item.append(element('p', 'eyebrow', job.date), element('h3', '', job.title), element('p', 'timeline-company', job.company), element('p', '', job.text));
    $('#experience-list').append(item);
  });

  // Illustrative meter: integrate L/min over seconds / 60. No sensor connection.
  const rate = $('#flow-rate');
  let running = false, volume = 0, elapsed = 0, lastTime = 0, frame = 0;
  let flow = Number(rate.value);
  function advance(now) {
    if (!running) return;
    const dt = Math.max(0, (now - lastTime) / 1000);
    volume += flow * dt / 60; elapsed += dt; lastTime = now;
  }
  function renderMeter() {
    $('#volume-value').textContent = volume.toFixed(3);
    const secs = Math.floor(elapsed);
    $('#elapsed-value').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    $('#flow-value').textContent = String(flow);
    $('.pipe').classList.toggle('running', running && flow > 0);
    $('.pipe-flow').style.animationDuration = `${Math.max(.4, 8 / Math.max(flow / 5, 1))}s`;
    $('.pipe-flow').style.opacity = flow === 0 ? '0' : '.7';
  }
  function tick(now) { advance(now); renderMeter(); if (running) frame = requestAnimationFrame(tick); }
  function setRunning(value) {
    if (running) advance(performance.now());
    running = value; cancelAnimationFrame(frame);
    $('#lab-toggle').textContent = running ? 'Pause simulation Ⅱ' : 'Start simulation ▶';
    $('#lab-state').textContent = running ? 'RUNNING' : 'PAUSED'; $('#lab-state').classList.toggle('running', running);
    lastTime = performance.now(); renderMeter();
    if (running) frame = requestAnimationFrame(tick);
  }
  rate.addEventListener('input', () => { advance(performance.now()); flow = Number(rate.value); renderMeter(); });
  $('#lab-toggle').addEventListener('click', () => setRunning(!running));
  $('#lab-reset').addEventListener('click', () => { setRunning(false); volume = 0; elapsed = 0; renderMeter(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) setRunning(false); });
  window.addEventListener('labchange',()=>{if($('#water-lab').hidden&&running)setRunning(false);});
  renderMeter();

  $('#copy-email').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(data.email); $('#copy-status').textContent = 'Email address copied.'; }
    catch { $('#copy-status').textContent = `Copy this address manually: ${data.email}`; }
  });
})();
