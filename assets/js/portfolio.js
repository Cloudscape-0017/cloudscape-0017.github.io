(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const statusTimers = new WeakMap();
  function status(node, text) {
    if (!node) return;
    clearTimeout(statusTimers.get(node));
    node.textContent = text;
    statusTimers.set(node, setTimeout(() => { node.textContent = ''; }, 2400));
  }
  async function copy(text, node) {
    try {
      if (navigator.clipboard && isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea');
        field.value = text;
        field.className = 'clipboard-field';
        field.setAttribute('readonly', '');
        (document.querySelector('dialog[open]') || document.body).append(field);
        field.select();
        const ok = document.execCommand('copy');
        field.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      status(node, '链接已复制');
    } catch { status(node, '复制失败，请复制地址栏中的链接'); }
  }

  // Native details keeps this menu usable without JavaScript.
  $$('.film-menu').forEach(menu => {
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        event.preventDefault(); menu.open = false; $('summary', menu).focus();
      }
    });
    document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
    menu.addEventListener('focusout', () => setTimeout(() => {
      if (!menu.contains(document.activeElement)) menu.open = false;
    }, 0));
  });

  const homeCards = $$('.project-entry');
  homeCards.forEach(card => card.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    try { sessionStorage.setItem('cloudscape-return', JSON.stringify({id: card.id, y: scrollY, at: Date.now()})); } catch {}
  }));
  if (homeCards.length) {
    const id = new URL(location.href).searchParams.get('return');
    const card = homeCards.find(item => item.id === id);
    if (card) {
      const restore = () => {
        let saved;
        try { saved = JSON.parse(sessionStorage.getItem('cloudscape-return')); } catch {}
        if (saved?.id === id && Date.now() - saved.at < 30 * 60 * 1000 && Number.isFinite(saved.y))
          scrollTo({top: saved.y, behavior: 'instant'});
        else card.scrollIntoView({block: 'center', behavior: 'instant'});
        card.focus({preventScroll: true});
        window.ScrollTrigger?.refresh();
      };
      if (document.readyState === 'complete') requestAnimationFrame(restore);
      else addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(restore)), {once: true});
    }
  }

  const cards = $$('.chapter .work-card');
  const viewer = $('#lightbox');
  if (cards.length && viewer) {
    const works = cards.map(card => {
      const image = $('img', card);
      return {src: image.getAttribute('src'), alt: image.alt, width: Number(image.getAttribute('width')), height: Number(image.getAttribute('height')),
        title: $('.work-meta strong', card).textContent.trim(), tag: $('.work-meta small', card).textContent.trim(),
        description: $('.work-description', card).textContent.trim()};
    });
    const image = $('#lightbox-image');
    const media = $('.lightbox-media');
    const zoom = $('[data-image-zoom]');
    const strip = $('.viewer-filmstrip');
    const overview = $('.gallery-overview');
    const gallery = $('#project-gallery');
    let index = 0, opener = null, pushed = false, dragging = null;
    const pad = value => String(value).padStart(2, '0');
    const sceneFromUrl = () => {
      const value = new URL(location.href).searchParams.get('scene');
      if (!value || !/^\d{1,2}$/.test(value)) return null;
      const n = Number(value);
      return n >= 1 && n <= works.length ? n - 1 : null;
    };
    function sceneUrl(n) {
      const url = new URL(location.href);
      url.searchParams.set('scene', n + 1);
      url.searchParams.delete('return');
      return url;
    }
    function setZoom(enabled) {
      media.classList.toggle('is-zoomed', enabled);
      zoom.setAttribute('aria-pressed', String(enabled));
      $('span', zoom).textContent = enabled ? '适应屏幕' : '实际像素';
      if (enabled) requestAnimationFrame(() => {
        media.scrollLeft = Math.max(0, (media.scrollWidth - media.clientWidth) / 2);
        media.scrollTop = Math.max(0, (media.scrollHeight - media.clientHeight) / 2);
      });
      else { media.scrollLeft = 0; media.scrollTop = 0; }
    }
    function update(n, updateUrl = true) {
      index = (n + works.length) % works.length;
      const work = works[index];
      setZoom(false);
      image.src = work.src; image.alt = work.alt;
      image.width = work.width; image.height = work.height;
      media.style.setProperty('--viewer-ratio', String(work.width / work.height));
      media.style.setProperty('--image-width', `${work.width}px`);
      media.style.setProperty('--image-height', `${work.height}px`);
      $('#lightbox-title').textContent = work.title;
      $('#lightbox-tag').textContent = work.tag;
      $('#lightbox-description').textContent = work.description;
      $('#lightbox-count').textContent = `${pad(index + 1)} / ${pad(works.length)}`;
      $$('.viewer-thumb', strip).forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === index)));
      if (updateUrl && viewer.open) history.replaceState(history.state, '', sceneUrl(index));
      if (viewer.open) $$('.viewer-thumb', strip)[index]?.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
      const next = new Image(); next.src = works[(index + 1) % works.length].src;
    }
    function open(n, trigger, fromUrl = false) {
      opener = trigger || cards[n];
      update(n, false);
      if (!viewer.open) {
        if (!fromUrl) {
          history.pushState({...history.state, cloudscapeScene: true}, '', sceneUrl(n)); pushed = true;
        }
        viewer.showModal(); document.documentElement.classList.add('has-viewer');
        $('[data-close]', viewer).focus({preventScroll: true});
      }
      if (!reduced.matches) viewer.animate([{opacity: 0}, {opacity: 1}], {duration: 180, easing: 'ease-out'});
    }
    function closeUi() {
      if (!viewer.open) return;
      viewer.close(); document.documentElement.classList.remove('has-viewer'); setZoom(false);
      opener?.focus({preventScroll: true});
    }
    function close() {
      if (!viewer.open) return;
      if (pushed && history.state?.cloudscapeScene) { pushed = false; history.back(); }
      else {
        const url = new URL(location.href); url.searchParams.delete('scene');
        history.replaceState(history.state, '', url); closeUi();
      }
    }
    works.forEach((work, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button'; thumb.className = 'viewer-thumb';
      thumb.setAttribute('aria-label', `${pad(i + 1)} ${work.title}`);
      const picture = document.createElement('img'); picture.src = work.src; picture.alt = ''; picture.loading = 'lazy';
      picture.width = 100; picture.height = 66; thumb.append(picture);
      thumb.addEventListener('click', () => update(i)); strip.append(thumb);
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'overview-tile';
      tile.setAttribute('aria-label', `查看场景 ${pad(i + 1)}：${work.title}`);
      const tileImage = picture.cloneNode(); tileImage.width = work.width; tileImage.height = work.height;
      const caption = document.createElement('span');
      const number = document.createElement('small'); number.textContent = pad(i + 1);
      const name = document.createElement('strong'); name.textContent = work.title;
      caption.append(number, name); tile.append(tileImage, caption);
      tile.addEventListener('click', () => open(i, tile)); overview.append(tile);
    });
    const modes = $$('[data-gallery-mode]');
    function setMode(mode) {
      const isOverview = mode === 'overview';
      gallery.dataset.galleryView = isOverview ? 'overview' : 'chapters';
      overview.hidden = !isOverview;
      modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryMode === gallery.dataset.galleryView)));
      window.ScrollTrigger?.refresh();
    }
    modes.forEach(button => button.addEventListener('click', () => setMode(button.dataset.galleryMode)));
    cards.forEach((card, i) => { card.addEventListener('click', () => open(i, card)); card.disabled = false; });
    $('[data-close]', viewer).addEventListener('click', close);
    $('[data-previous]', viewer).addEventListener('click', () => update(index - 1));
    $('[data-next]', viewer).addEventListener('click', () => update(index + 1));
    zoom.addEventListener('click', () => setZoom(!media.classList.contains('is-zoomed')));
    $('[data-image-share]', viewer).addEventListener('click', () => copy(sceneUrl(index).href, $('.viewer-status', viewer)));
    viewer.addEventListener('cancel', event => { event.preventDefault(); close(); });
    viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
    viewer.addEventListener('close', () => document.documentElement.classList.remove('has-viewer'));
    addEventListener('keydown', event => {
      if (!viewer.open || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        if (media.classList.contains('is-zoomed') && document.activeElement === media) return;
        event.preventDefault(); update(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    media.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || !media.classList.contains('is-zoomed') || event.button) return;
      dragging = {x: event.clientX, y: event.clientY, left: media.scrollLeft, top: media.scrollTop};
      media.setPointerCapture(event.pointerId); media.classList.add('is-dragging');
    });
    media.addEventListener('pointermove', event => {
      if (!dragging) return;
      media.scrollLeft = dragging.left - event.clientX + dragging.x;
      media.scrollTop = dragging.top - event.clientY + dragging.y;
    });
    const endDrag = () => { dragging = null; media.classList.remove('is-dragging'); };
    media.addEventListener('pointerup', endDrag); media.addEventListener('pointercancel', endDrag);
    addEventListener('popstate', () => {
      const scene = sceneFromUrl();
      if (scene === null) closeUi(); else open(scene, cards[scene], true);
    });
    const initial = sceneFromUrl();
    if (initial !== null) requestAnimationFrame(() => {
      cards[initial].scrollIntoView({block: 'center', behavior: 'instant'}); open(initial, cards[initial], true);
    });
    setMode('chapters');
    modes.forEach(button => { button.disabled = false; });
  }

  const video = $('video');
  if (video) {
    const frames = $$('[data-seek]');
    const message = $('.reel-status');
    const stamp = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    const requested = new URL(location.href).searchParams.get('t');
    let pendingTime = requested && /^\d+(\.\d+)?$/.test(requested) ? Number(requested) : null;
    let pendingPlay = false;
    function seek(seconds, play) {
      if (video.readyState < 1) { pendingTime = seconds; pendingPlay = play; video.load(); status(message, '正在载入片段…'); return; }
      video.currentTime = Math.min(Math.max(0, seconds), Math.max(0, video.duration - 0.1));
      if (play) video.play().catch(() => status(message, '已定位，点击播放即可观看'));
      frames.forEach(button => button.classList.toggle('is-active', Number(button.dataset.seek) === seconds));
    }
    video.addEventListener('loadedmetadata', () => {
      if (pendingTime !== null) { seek(pendingTime, pendingPlay); pendingTime = null; pendingPlay = false; }
    });
    if (video.readyState >= 1 && pendingTime !== null) { seek(pendingTime, false); pendingTime = null; }
    frames.forEach(button => button.addEventListener('click', () => {
      const seconds = Number(button.dataset.seek); seek(seconds, true);
      const url = new URL(location.href); url.searchParams.set('t', String(seconds));
      history.replaceState(history.state, '', url);
      const box = video.getBoundingClientRect();
      if (box.top < 88 || box.bottom > innerHeight) video.scrollIntoView({block: 'center', behavior: reduced.matches ? 'instant' : 'smooth'});
    }));
    frames.forEach(button => { button.disabled = false; });
    $('[data-video-share]')?.addEventListener('click', () => {
      const url = new URL(location.href); url.searchParams.set('t', String(Math.floor(video.currentTime || 0)));
      history.replaceState(history.state, '', url); copy(url.href, message);
    });
    if ($('[data-video-share]')) $('[data-video-share]').disabled = false;
    video.addEventListener('error', () => status(message, '视频暂未加载成功，请刷新后重试'));
    video.addEventListener('timeupdate', () => {
      const time = video.currentTime;
      frames.forEach((button, i) => button.classList.toggle('is-active', time >= Number(button.dataset.seek) && (i === frames.length - 1 || time < Number(frames[i + 1].dataset.seek))));
    });
    document.querySelectorAll('.project-neighbor').forEach(link => link.addEventListener('click', () => video.pause()));
  }
  document.documentElement.dataset.portfolioReady = 'true';
})();
