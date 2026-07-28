/* ═══════════════════════════════════════════════════════
   PAGE BUILDER — do not edit below this line
   ═══════════════════════════════════════════════════════ */
function buildProduct() {
  const P = PRODUCT;

  document.getElementById('page-meta-desc').content = P.metaDesc;
  document.getElementById('sys-text').textContent = P.id + ' · ' + P.status;

  const bcCat = document.getElementById('bc-cat');
  bcCat.textContent = P.breadcrumbCategory;
  bcCat.href = P.breadcrumbCategoryHref;
  document.getElementById('bc-name').textContent = P.name;

  document.getElementById('gallery-tag').textContent = P.id;
  const edEl = document.getElementById('gallery-edition');
  if (P.edition) {
    edEl.textContent = P.editionLabel;
    edEl.className   = 'gallery-main-edition edition-' + P.edition;
  } else {
    edEl.style.display = 'none';
  }

  const galleryMain = document.querySelector('.gallery-main');
  const img = document.getElementById('gallery-img');
  img.alt = P.name + ' — main view';
  if (P.photos && P.photos.length) {
    img.src = P.photos[0];
  } else {
    img.setAttribute('data-failed', '1');
    galleryMain.insertAdjacentHTML('beforeend', P.gallerySvg);
  }

  document.getElementById('model-tag').textContent = P.id + ' · 3D VIEW';

  const thumbItems = (P.photos && P.photos.length)
    ? P.photos.map((src, i) => `<img src="${src}" loading="lazy" alt="${P.name} view ${i+1}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block">`)
    : P.thumbSvgs;
  document.getElementById('gallery-thumbs').innerHTML = thumbItems.map((content, i) =>
    `<div class="thumb${i===0?' active':''}">${content}<span class="thumb-n">${String(i+1).padStart(2,"0")}</span></div>`
  ).join('');

  document.getElementById('prod-id').textContent  = P.id + ' · ' + P.series;
  document.getElementById('prod-cats').innerHTML  = P.categories.map(c => `<span class="prod-cat">${c}</span>`).join('');
  document.getElementById('prod-title').textContent    = P.name;
  document.getElementById('prod-subtitle').textContent = P.subtitle;


  document.getElementById('prod-desc').innerHTML = P.description;

  document.getElementById('specs-grid').innerHTML = P.specs.map(s =>
    `<div class="spec-item"><span class="spec-k">${s.k}</span><span class="spec-v${s.accent?' accent':''}">${s.v}</span></div>`
  ).join('');

  document.getElementById('lof-tags').innerHTML = P.formTags.map(t => `<span class="lof-tag">${t}</span>`).join('');

  document.getElementById('prod-avail').innerHTML = `<span class="dot-avail"></span>${P.availability}`;

  const iHref = `mailto:${P.inquireEmail}?subject=${encodeURIComponent(P.inquireSubject)}&body=${encodeURIComponent(P.inquireBody)}`;
  const vHref = `mailto:${P.inquireEmail}?subject=${encodeURIComponent(P.viewingSubject)}`;
  document.getElementById('prod-ctas').innerHTML =
    `<a href="${iHref}" class="btn primary">Enquire about this piece →</a>` +
    `<a href="${vHref}" class="btn ghost">Book a studio viewing</a>`;

  document.getElementById('prod-trust').innerHTML = P.trust.map(t =>
    `<div class="trust-item"><span class="trust-icon">${t.icon}</span><span class="trust-label">${t.label}</span></div>`
  ).join('');

  const M = P.manifest;
  document.getElementById('manifest-id-name').innerHTML   = `<b>${P.id}</b><br>${P.name.toUpperCase()}`;
  document.getElementById('manifest-primitive').innerHTML  = M.primitive;
  document.getElementById('manifest-technique').innerHTML  = M.technique;
  document.getElementById('manifest-dimensions').innerHTML = M.dimensions;
  document.getElementById('manifest-edition').innerHTML    = M.edition;

  document.getElementById('related-grid').innerHTML = P.related.map(r => {
    const ext = r.external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${r.href}" class="rel-card"${ext}>
      <div class="rel-img">
        <span class="rel-id">${r.id}</span>
        <img ${r.img ? `src="${r.img}"` : 'data-failed="1"'} alt="${r.name}" loading="lazy">
        ${r.svg||''}
      </div>
      <div class="rel-tags">${r.tags}</div>
      <div class="rel-name">${r.name}</div>
      <div class="rel-row"><span class="rel-price" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">View piece</span><span class="rel-arrow">→</span></div>
    </a>`;
  }).join('');

  document.getElementById('contact-product-name').textContent = P.name;
  const cHref = `mailto:${P.inquireEmail}?subject=${encodeURIComponent(P.inquireSubject)}`;
  document.getElementById('contact-inquire').href = cHref;
  document.getElementById('contact-inquire-val').textContent = P.inquireEmail;
}

document.addEventListener('DOMContentLoaded', buildProduct);

/* ── Theme toggle ── */
(function(){
  const KEY = 'soboof.theme';
  const btn = document.getElementById('theme-toggle');
  function apply(t){document.body.classList.toggle('day', t==='day')}
  apply(localStorage.getItem(KEY) || 'night');
  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('day') ? 'night' : 'day';
    apply(next); localStorage.setItem(KEY, next);
  });
})();

/* ── Thumbnail switcher ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gallery-thumbs').addEventListener('click', e => {
    const thumb = e.target.closest('.thumb');
    if (!thumb) return;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (PRODUCT.photos && PRODUCT.photos.length) {
      const idx = [...thumb.parentElement.children].indexOf(thumb);
      if (PRODUCT.photos[idx]) document.getElementById('gallery-img').src = PRODUCT.photos[idx];
    }
  });
});

/* ── Image fallback for related cards ── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.rel-img img').forEach(img => {
    const fail = () => img.setAttribute('data-failed','1');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
});
