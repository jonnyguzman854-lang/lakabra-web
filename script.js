const DEFAULT = {
  youtube: 'https://www.youtube.com/channel/UC5yhMjSb7zw-tE2Nm2wV_NA',
  tiktok: 'https://www.tiktok.com/@lakabraoficial',
  discord: '#',
  whatsapp: 'https://wa.me/',
  paypal: 'https://www.paypal.com/donate/?business=jonnyguzman358%40gmail.com&currency_code=USD',
  stats: { videos: 0, community: 0, hours: 126, clips: 0 },
  manualVideos: [],
  manualClips: [],
  accounts: [
    { title: 'Cuenta Prime Rush #1', price: 'Consultar', rank: 'Leyenda', level: 'Nivel 75', status: 'Disponible', desc: 'Cuenta disponible. Revisa las fotos y el video antes de contactar.', video: '', contact: 'https://wa.me/', photos: ['/assets/hero-banner.jpg', '/assets/og-image.jpg'], active: true }
  ]
};

let settings = structuredClone(DEFAULT);
const db = window.lakabraDb;

const $ = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const isDesktopHover = () => window.matchMedia('(hover:hover) and (pointer:fine)').matches;

async function loadSettings() {
  if (!db) return structuredClone(DEFAULT);
  const { data, error } = await db.from('site_settings').select('data').eq('id', 'main').single();
  if (error) {
    console.error('No se pudo cargar Supabase:', error);
    return structuredClone(DEFAULT);
  }
  return { ...structuredClone(DEFAULT), ...(data?.data || {}) };
}

function youtubeId(url = '') {
  const patterns = [/[?&]v=([^&#]+)/, /youtu\.be\/([^?&#/]+)/, /shorts\/([^?&#/]+)/, /embed\/([^?&#/]+)/, /live\/([^?&#/]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function youtubeThumb(id, quality = 'maxresdefault') {
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '/assets/hero-banner.jpg';
}

function thumbnailCandidates(id) {
  if (!id) return ['/assets/hero-banner.jpg'];
  return [
    youtubeThumb(id, 'maxresdefault'),
    youtubeThumb(id, 'sddefault'),
    youtubeThumb(id, 'hqdefault'),
    youtubeThumb(id, 'mqdefault'),
    youtubeThumb(id, 'default')
  ];
}

function applyThumbnailFallback(img, id, finalFallback = '/assets/hero-banner.jpg') {
  if (!img) return;
  const candidates = thumbnailCandidates(id);
  let index = Math.max(0, candidates.indexOf(img.getAttribute('src')));
  img.onerror = () => {
    index += 1;
    if (index < candidates.length) img.src = candidates[index];
    else { img.onerror = null; img.src = finalFallback; }
  };
}

function isPlaceholderThumb(thumb = '') {
  return !thumb || /(?:hero-banner|profile-lakabra|og-image)\.jpg/i.test(thumb);
}

function embedUrl(item) {
  const id = item.videoId || youtubeId(item.url);
  return item.platform === 'youtube' && id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${id}&modestbranding=1&iv_load_policy=3`
    : '';
}

async function tiktokThumbnail(url) {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { mode: 'cors' });
    if (!response.ok) return '';
    const data = await response.json();
    return data.thumbnail_url || '';
  } catch {
    return '';
  }
}

async function normalize(item, kind = 'youtube') {
  const platform = (item.platform || kind).toLowerCase();
  const id = youtubeId(item.url || '');
  let thumb = item.thumb || '';

  // YouTube siempre usa la miniatura real cuando la miniatura está vacía o es una imagen demo.
  if (platform === 'youtube' && id && isPlaceholderThumb(thumb)) thumb = youtubeThumb(id, 'maxresdefault');
  if (platform === 'tiktok' && item.url && isPlaceholderThumb(thumb)) thumb = await tiktokThumbnail(item.url) || '/assets/profile-lakabra.jpg';
  if (!thumb) thumb = '/assets/hero-banner.jpg';

  return {
    title: item.title || 'Contenido LAKABRA',
    desc: item.desc || '',
    platform,
    type: (item.type || kind).toLowerCase(),
    url: item.url || '',
    thumb,
    videoId: id,
    published: item.published || ''
  };
}

function initLoader() {
  const loader = $('loader');
  // Nunca dejar la web atrapada en el loader aunque falle una petición externa.
  requestAnimationFrame(() => setTimeout(() => loader?.classList.add('hide'), 500));
  setTimeout(() => loader?.classList.add('hide'), 2500);
}

function initParticles() {
  const canvas = $('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, particles = [];
  const resize = () => {
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
    const amount = Math.min(76, Math.floor(width * height / 24000));
    particles = Array.from({ length: amount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.7 + .7
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(93,220,255,.72)';
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(93,220,255,.07)';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 115) {
          ctx.globalAlpha = 1 - d / 115;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    requestAnimationFrame(draw);
  };
  resize(); addEventListener('resize', resize, { passive: true }); draw();
}

function initCommonUi() {
  $('year').textContent = new Date().getFullYear();
  const glow = $('cursorGlow');
  if (glow && isDesktopHover()) addEventListener('mousemove', e => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; }, { passive: true });

  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

  const i18n = {
    es: 'Prime Rush, clips y comunidad. Entra, mira el contenido, revisa cuentas disponibles y conecta conmigo.',
    pt: 'Prime Rush, clipes e comunidade. Entre, veja o conteúdo, confira contas disponíveis e conecte comigo.',
    en: 'Prime Rush, clips and community. Watch content, check available accounts and connect with me.'
  };
  const langBtn = $('langBtn'), langMenu = $('langMenu');
  langBtn.onclick = () => langMenu.classList.toggle('show');
  langMenu.querySelectorAll('button').forEach(button => button.onclick = () => {
    const lang = button.dataset.lang;
    localStorage.setItem('lakabraLang', lang);
    langBtn.textContent = `${lang.toUpperCase()} ▾`;
    $('heroText').textContent = i18n[lang] || i18n.es;
    langMenu.classList.remove('show');
  });
  const lang = localStorage.getItem('lakabraLang') || 'es';
  langBtn.textContent = `${lang.toUpperCase()} ▾`;
  $('heroText').textContent = i18n[lang] || i18n.es;
}

function bindLinks() {
  $('youtubeBtn').href = settings.youtube;
  $('tiktokBtn').href = settings.tiktok;
  $('donateBtn').href = settings.paypal;
  $('whatsappLink').href = settings.whatsapp;
  $('floatingWhatsapp').href = settings.whatsapp;
  $('discordLink').href = settings.discord || '#';
}

function formatCount(n) {
  n = Number(n) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return String(n);
}

function previewController(card, item, iframe) {
  let timer;
  const start = () => {
    if (!isDesktopHover()) return;
    const embed = embedUrl(item);
    if (!embed) return;
    card.classList.add('preview-loading');
    timer = setTimeout(() => {
      iframe.onload = () => card.classList.remove('preview-loading');
      iframe.src = embed;
      card.classList.add('previewing');
      setTimeout(() => card.classList.remove('preview-loading'), 2200);
    }, 420);
  };
  const stop = () => {
    clearTimeout(timer);
    card.classList.remove('previewing', 'preview-loading');
    iframe.onload = null;
    iframe.src = '';
  };
  card.addEventListener('mouseenter', start);
  card.addEventListener('mouseleave', stop);
  card.addEventListener('focusin', start);
  card.addEventListener('focusout', stop);
}

function mediaCard(item, onFeature) {
  const card = document.createElement('article');
  card.className = 'media-item';
  card.tabIndex = 0;
  card.innerHTML = `
    <div class="media-thumb">
      <img src="${esc(item.thumb)}" alt="${esc(item.title)}" loading="lazy">
      <span class="card-play" aria-hidden="true">▶</span>
      <iframe title="Vista previa de ${esc(item.title)}" allow="autoplay; encrypted-media" loading="lazy"></iframe>
    </div>
    <div class="media-copy">
      <span class="platform-pill">${esc(item.platform)}</span>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.desc)}</p>
      <div class="media-meta">${esc(item.published)}</div>
    </div>`;
  const iframe = card.querySelector('iframe');
  applyThumbnailFallback(card.querySelector('img'), item.videoId || youtubeId(item.url));
  previewController(card, item, iframe);
  card.addEventListener('mouseenter', () => onFeature(item));
  card.onclick = () => item.url && window.open(item.url, '_blank', 'noopener');
  card.onkeydown = e => { if (e.key === 'Enter') card.click(); };
  return card;
}

function clipCard(item) {
  const card = document.createElement('article');
  card.className = 'clip-tile';
  card.tabIndex = 0;
  card.innerHTML = `
    <img src="${esc(item.thumb)}" alt="${esc(item.title)}" loading="lazy">
    <div class="clip-overlay"></div>
    <span class="platform-pill">${esc(item.platform)}</span>
    <span class="clip-title">${esc(item.title)}</span>
    <span class="card-play">▶</span>
    <iframe title="Vista previa de ${esc(item.title)}" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
  applyThumbnailFallback(card.querySelector('img'), item.videoId || youtubeId(item.url), '/assets/profile-lakabra.jpg');
  previewController(card, item, card.querySelector('iframe'));
  card.onclick = () => item.url && window.open(item.url, '_blank', 'noopener');
  card.onkeydown = e => { if (e.key === 'Enter') card.click(); };
  return card;
}

async function initMedia() {
  const videos = await Promise.all((settings.manualVideos || []).map(item => normalize(item, 'youtube')));
  const clips = await Promise.all((settings.manualClips || []).map(item => normalize(item, 'shorts')));

  if (!videos.length) videos.push(await normalize({ title: 'Agrega videos desde Admin', desc: 'Pega un enlace de YouTube y su miniatura se genera automáticamente.', platform: 'youtube', url: settings.youtube }, 'youtube'));
  if (!clips.length) {
    clips.push(await normalize({ title: 'Headshot clutch', desc: 'Clip destacado demo.', platform: 'youtube', type: 'shorts', url: settings.youtube }, 'shorts'));
    clips.push(await normalize({ title: '1v4 imposible', desc: 'Clip TikTok demo.', platform: 'tiktok', type: 'tiktok', url: settings.tiktok }, 'tiktok'));
  }

  $('statVideos').textContent = formatCount(settings.stats?.videos || videos.length);
  $('statCommunity').textContent = formatCount(settings.stats?.community || 0);
  $('statHours').textContent = formatCount(settings.stats?.hours || 126);
  $('statClips').textContent = formatCount(settings.stats?.clips || clips.length);

  let currentFilter = 'all';
  const allItems = [...videos, ...clips];
  const preview = $('mainPreview');
  let featuredTimer;

  const setFeatured = item => {
    $('featuredPlatform').textContent = item.platform;
    $('featuredTitle').textContent = item.title;
    $('featuredDesc').textContent = item.desc || 'Contenido oficial de LAKABRA';
    $('openFeatured').href = item.url || settings.youtube;
    preview.classList.remove('previewing');
    const featuredImage = preview.querySelector('img');
    featuredImage.src = item.thumb;
    applyThumbnailFallback(featuredImage, item.videoId || youtubeId(item.url));
    preview.querySelector('iframe').src = '';
    preview.dataset.embed = embedUrl(item);
  };

  const renderItems = () => {
    const filtered = allItems.filter(item => currentFilter === 'all' || item.platform === currentFilter || item.type === currentFilter);
    $('playlist').innerHTML = '';
    filtered.slice(0, 8).forEach(item => $('playlist').appendChild(mediaCard(item, setFeatured)));
    if (filtered[0]) setFeatured(filtered[0]);
  };

  document.querySelectorAll('#contentFilters button').forEach(button => button.onclick = () => {
    document.querySelectorAll('#contentFilters button').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderItems();
  });

  preview.addEventListener('mouseenter', () => {
    if (!isDesktopHover() || !preview.dataset.embed) return;
    featuredTimer = setTimeout(() => {
      preview.classList.add('previewing');
      preview.querySelector('iframe').src = preview.dataset.embed;
    }, 450);
  });
  preview.addEventListener('mouseleave', () => {
    clearTimeout(featuredTimer);
    preview.classList.remove('previewing');
    preview.querySelector('iframe').src = '';
  });

  renderItems();
  $('clipRow').innerHTML = '';
  clips.slice(0, 12).forEach(item => $('clipRow').appendChild(clipCard(item)));
  $('syncStatus').textContent = 'Miniaturas automáticas y vista previa al pasar el mouse.';
}

function accountPhotos(account) {
  const photos = (account.photos || []).filter(Boolean);
  return photos.length ? photos : ['/assets/hero-banner.jpg'];
}

function initAccounts() {
  const accounts = (settings.accounts || DEFAULT.accounts).filter(account => account.active !== false);
  const grid = $('accountsGrid');
  grid.innerHTML = '';
  if (!accounts.length) {
    grid.innerHTML = '<div class="empty-state">No hay cuentas publicadas todavía.</div>';
    return;
  }
  accounts.forEach(account => {
    const photos = accountPhotos(account);
    const card = document.createElement('article');
    card.className = 'account-card';
    card.innerHTML = `<div class="account-cover"><img src="${esc(photos[0])}" alt="${esc(account.title || 'Cuenta Prime Rush')}" loading="lazy"><span class="account-badge">${esc(account.status || 'Disponible')}</span><span class="account-photos">${photos.length} fotos</span></div><div class="account-body"><h3>${esc(account.title || 'Cuenta Prime Rush')}</h3><div class="account-meta"><span>${esc(account.rank || 'Rango')}</span><span>${esc(account.level || 'Nivel')}</span></div><p>${esc(account.desc || '')}</p><div class="account-price">${esc(account.price || 'Consultar')}</div><button class="btn btn-green" type="button">Ver detalles</button></div>`;
    card.onclick = () => openAccount(account);
    grid.appendChild(card);
  });
}

function videoEmbed(url) {
  const id = youtubeId(url);
  if (id) return `<div class="modal-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" allowfullscreen></iframe></div>`;
  return url ? `<div class="modal-video"><a href="${esc(url)}" target="_blank" rel="noopener">Ver video de la cuenta</a></div>` : '';
}

function openAccount(account) {
  const photos = accountPhotos(account);
  $('modalMainImage').src = photos[0];
  $('modalThumbs').innerHTML = '';
  photos.forEach((photo, index) => {
    const image = document.createElement('img');
    image.src = photo;
    image.className = index === 0 ? 'active' : '';
    image.onclick = () => {
      $('modalMainImage').src = photo;
      $('modalThumbs').querySelectorAll('img').forEach(x => x.classList.remove('active'));
      image.classList.add('active');
    };
    $('modalThumbs').appendChild(image);
  });
  $('modalStatus').textContent = account.status || 'Disponible';
  $('modalTitle').textContent = account.title || 'Cuenta Prime Rush';
  $('modalPrice').textContent = account.price || 'Consultar';
  $('modalDesc').textContent = account.desc || '';
  $('modalVideoBox').innerHTML = videoEmbed(account.video || '');
  $('modalContact').href = account.contact || settings.whatsapp;
  $('accountModal').classList.add('show');
  $('accountModal').setAttribute('aria-hidden', 'false');
}

function initForms() {
  $('modalClose').onclick = () => $('accountModal').classList.remove('show');
  $('accountModal').onclick = e => { if (e.target === $('accountModal')) $('accountModal').classList.remove('show'); };

  $('subscribeForm').onsubmit = async e => {
    e.preventDefault();
    const email = $('subscriberInput').value.trim();
    if (!email) return;
    const { error } = await db.from('subscribers').insert({ email });
    if (error && error.code !== '23505') return alert(`No se pudo registrar: ${error.message}`);
    $('subscriberInput').value = '';
    alert(error?.code === '23505' ? 'Ese correo ya estaba registrado.' : 'Te agregaste a la lista LAKABRA.');
    updateSubscriberCount();
  };

  $('contactForm').onsubmit = async e => {
    e.preventDefault();
    const payload = { name: $('contactName').value.trim(), contact: $('contactContact').value.trim(), message: $('contactMessage').value.trim() };
    const { error } = await db.from('messages').insert(payload);
    if (error) return alert(`No se pudo enviar: ${error.message}`);
    $('contactForm').reset();
    alert('Mensaje enviado correctamente.');
  };
}

async function updateSubscriberCount() {
  // RLS no permite conteo público; mostramos un mensaje elegante sin exponer datos.
  $('subscriberCount').textContent = 'Únete a la comunidad privada LAKABRA';
}

function initMobileNav() {
  const nav = document.createElement('div');
  nav.className = 'mobile-bottom-nav';
  nav.innerHTML = '<a href="#inicio">Inicio</a><a href="#videos">TV</a><a href="#clips">Clips</a><a href="#cuentas">Cuentas</a>';
  document.body.appendChild(nav);
}

async function start() {
  initLoader();
  settings = await loadSettings();
  initCommonUi();
  initParticles();
  bindLinks();
  await initMedia();
  initAccounts();
  initForms();
  initMobileNav();
  updateSubscriberCount();
}

start().catch(error => {
  console.error(error);
  initLoader();
});
