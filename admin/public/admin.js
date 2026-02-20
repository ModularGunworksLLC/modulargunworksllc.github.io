(function () {
  const TOKEN_KEY = 'admin_token';
  const CDN_IMAGE_HOST = 'media.chattanoogashooting.com';
  let token = localStorage.getItem(TOKEN_KEY);
  let allProducts = [];
  let categories = [];
  let mappingOptions = [];
  let currentView = 'listed';

  function imageSrc(url) {
    if (!url || !url.trim()) return '';
    var u = url.trim();
    if (u.startsWith('//')) u = 'https:' + u;
    var allowed = u.startsWith('https://' + CDN_IMAGE_HOST + '/') || u.startsWith('http://' + CDN_IMAGE_HOST + '/');
    if (allowed && token) {
      return API_BASE + '/api/image-proxy?url=' + encodeURIComponent(u) + '&token=' + encodeURIComponent(token);
    }
    return u;
  }

  // Use admin server (port 3001) for API when page is opened from another origin (e.g. main site)
  const isAdminOrigin = (window.location.port === '3001' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  const API_BASE = isAdminOrigin ? window.location.origin : ('http://' + (window.location.hostname || 'localhost') + ':3001');

  function api(path, options = {}) {
    const url = path.startsWith('http') ? path : (API_BASE + path);
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, { ...options, headers }).then(res => {
      if (res.status === 401) { token = null; localStorage.removeItem(TOKEN_KEY); document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('app').classList.add('hidden'); throw new Error('Login required'); }
      return res;
    });
  }

  function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    fetch(API_BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { errEl.textContent = data.error; return; }
        token = data.token;
        localStorage.setItem(TOKEN_KEY, token);
        showApp();
        loadCategories();
        loadProducts();
      })
      .catch(() => { errEl.textContent = 'Login failed.'; });
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    api('/api/logout', { method: 'POST' }).catch(() => {});
    token = null;
    localStorage.removeItem(TOKEN_KEY);
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  });

  function loadCategories() {
    api('/api/categories?view=' + encodeURIComponent(currentView)).then(r => r.json()).then(data => {
      categories = data.categories || [];
      const sel = document.getElementById('category-filter');
      sel.innerHTML = '<option value="">All categories</option>' + categories.map(c => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
    }).catch(() => {});
    api('/api/mapping-options').then(r => r.json()).then(data => {
      mappingOptions = data.options || [];
    }).catch(() => { mappingOptions = []; });
  }

  function loadProducts(noCache) {
    const search = (document.getElementById('search') && document.getElementById('search').value) ? document.getElementById('search').value.trim() : '';
    const category = (document.getElementById('category-filter') && document.getElementById('category-filter').value) || '';
    const mappingEl = document.getElementById('mapping-filter');
    const mappingFilter = mappingEl ? mappingEl.value : '';
    const showHiddenOnly = document.getElementById('filter-hidden') ? document.getElementById('filter-hidden').checked : false;
    let url = '/api/products?view=' + encodeURIComponent(currentView);
    if (search) url += '&search=' + encodeURIComponent(search);
    if (category && mappingFilter !== 'unmapped') url += '&category=' + encodeURIComponent(category);
    if (noCache) url += '&_=' + Date.now();
    api(url).then(r => r.json()).then(data => {
      let list = Array.isArray(data.products) ? data.products.slice() : [];
      if (showHiddenOnly) list = list.filter(function (p) { return p.hidden; });
      if (mappingFilter === 'mapped') {
        list = list.filter(function (p) { return p.mappedCategory && p.mappedCategory.top; });
      } else if (mappingFilter === 'unmapped') {
        list = list.filter(function (p) { return !p.mappedCategory || !(p.mappedCategory.top && p.mappedCategory.top.trim()); });
      }
      allProducts = list;
      var countEl = document.getElementById('product-count');
      if (countEl) countEl.textContent = allProducts.length + ' products';
      renderTable(allProducts);
    }).catch(function (err) { console.error('loadProducts error', err); });
  }

  function setView(view) {
    currentView = view === 'chattanooga' ? 'chattanooga' : 'listed';
    document.querySelectorAll('.view-tab').forEach(function (tab) {
      var isActive = (tab.getAttribute('data-view') || '') === currentView;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    var hint = document.getElementById('view-tab-hint');
    if (hint) {
      hint.textContent = currentView === 'listed'
        ? 'Products currently on your live site (mapped + visible + have list price). List price = override, then MSRP, then MAP. Only products with neither MSRP nor MAP need an override.'
        : 'Full Chattanooga feed. List price = override, then MSRP, then MAP. Add override in Edit only if feed has no MSRP and no MAP so the product can appear on the site. Mapped/Unmapped counts come from last sync — run sync to apply mapping template changes.';
    }
    loadCategories();
    loadProducts();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatPrice(p) {
    if (p == null || p === '') return '—';
    const n = parseFloat(p);
    return isNaN(n) ? '—' : '$' + n.toFixed(2);
  }

  function getPriceNum(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v === null || v === undefined) continue;
      var n = parseFloat(v);
      if (!isNaN(n) && n >= 0) return n;
      var s = String(v).trim();
      if (s === '') continue;
      n = parseFloat(s);
      if (!isNaN(n) && n >= 0) return n;
    }
    return null;
  }

  function renderTable(products) {
    const tbody = document.getElementById('product-tbody');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="empty-state">No products match.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => {
      const img = (p.image || p['Image Location'] || '').trim();
      const name = p['Web Item Name'] || p['Item Name'] || p.SKU || '—';
      const sku = (p.SKU || p.sku || '').toString();
      const feedCat = (p.Category || '').trim() || '—';
      var siteCat = (p.mappedCategory && p.mappedCategory.top)
        ? (p.mappedCategory.sub && p.mappedCategory.sub !== p.mappedCategory.top ? p.mappedCategory.top + ' — ' + p.mappedCategory.sub : p.mappedCategory.top)
        : '— Not mapped';
      siteCat = String(siteCat).replace(/\s+/g, ' ').trim();
      const mapNum = getPriceNum(p, ['MAP', 'Map', 'map']);
      const msrpNum = getPriceNum(p, ['MSRP', 'Msrp', 'msrp']);
      const hasMap = mapNum != null;
      const hasMsrp = msrpNum != null;
      // Your price = override, then MSRP, then MAP (same as live site)
      const yourPriceNum = p.priceOverride != null ? Number(p.priceOverride) : (msrpNum ?? mapNum ?? null);
      const yourPrice = yourPriceNum != null && !isNaN(yourPriceNum) ? formatPrice(yourPriceNum) : '—';
      const hasYourPrice = yourPrice !== '—';
      var mapStr = hasMap ? formatPrice(mapNum) : '—';
      var msrpStr = hasMsrp ? formatPrice(msrpNum) : '—';
      const stockVal = p['Quantity In Stock'] ?? p.quantity ?? p.stock ?? '';
      const stock = (stockVal != null && String(stockVal).trim() !== '') ? String(stockVal) : '—';
      // Active = shown on live site: mapped + not hidden + has list price (override, MSRP, or MAP)
      const isOnSite = !!(p.mappedCategory && p.mappedCategory.top && !p.hidden && hasYourPrice);
      const activeLabel = isOnSite ? 'Active' : 'No';
      const badgeClass = isOnSite ? 'badge-visible' : 'badge-hidden';
      const activeTitle = isOnSite ? 'Shown on live site' : 'Not on site (hidden, unmapped, or no MSRP/MAP/override)';
      const rowClasses = [];
      if (!img) rowClasses.push('row-no-image');
      if (!(p.mappedCategory && p.mappedCategory.top)) rowClasses.push('row-unmapped');
      if (!hasMap && !hasMsrp) rowClasses.push('row-no-map-msrp');
      const imgSrc = imageSrc(img);
      const imgCell = img
        ? '<img class="thumb" src="' + escapeHtml(imgSrc) + '" alt="" onerror="this.classList.add(\'thumb-error\'); this.alt=\'No image\';">'
        : '<span class="cell-no-image" title="Missing image — fix in Edit">No image</span>';
      return '<tr data-sku="' + escapeHtml(sku) + '" class="' + (rowClasses.length ? rowClasses.join(' ') : '') + '">' +
        '<td class="cell-image">' + imgCell + '</td>' +
        '<td><code>' + escapeHtml(sku) + '</code></td>' +
        '<td class="name-cell" title="' + escapeHtml(name) + '">' + escapeHtml(name.slice(0, 60)) + (name.length > 60 ? '…' : '') + '</td>' +
        '<td class="cell-feed-cat" title="Wholesale/manufacturer category">' + escapeHtml(feedCat) + '</td>' +
        '<td class="cell-site-cat" title="Where it appears on your site">' + escapeHtml(String(siteCat).replace(/_/g, ' ')) + '</td>' +
        '<td class="price-cell' + (hasMap ? ' cell-price-green' : ' cell-missing') + '" title="' + (hasMap ? 'MAP from feed' : 'No MAP — add override in Edit to show on site') + '">' + mapStr + '</td>' +
        '<td class="price-cell' + (hasMsrp ? ' cell-price-green' : ' cell-missing') + '" title="' + (hasMsrp ? 'MSRP from feed' : '') + '">' + msrpStr + '</td>' +
        '<td class="price-cell' + (hasYourPrice ? '' : ' cell-missing') + '" title="' + (p.priceOverride != null ? 'Override price' : (hasMsrp ? 'MSRP' : hasMap ? 'MAP' : 'No MSRP or MAP — add override to show on site')) + '">' + yourPrice + '</td>' +
        '<td class="cell-stock-qty">' + escapeHtml(stock) + '</td>' +
        '<td class="cell-active" title="' + escapeHtml(activeTitle) + '">' + '<span class="badge ' + badgeClass + '">' + escapeHtml(activeLabel) + '</span></td>' +
        '<td class="cell-edit">' + '<button type="button" class="btn-edit" data-sku="' + escapeHtml(sku) + '">Edit</button></td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function () { openEdit(this.getAttribute('data-sku')); });
    });
  }

  var METADATA_LABELS = {
    'SKU': 'SKU',
    'Item Name': 'Item name',
    'Web Item Name': 'Web item name',
    'Web Item Description': 'Web description',
    'Quantity In Stock': 'Quantity in stock',
    'Price': 'Dealer price',
    'MAP': 'MAP',
    'MSRP': 'MSRP',
    'UPC': 'UPC',
    'Category': 'Category',
    'Manufacturer': 'Manufacturer',
    'Manufacturer Item Number': 'Manufacturer item number',
    'Image Location': 'Image URL',
    'Ship Weight': 'Ship weight',
    'Length': 'Length',
    'Width': 'Width',
    'Height': 'Height',
    'Drop Ship Flag': 'Drop ship',
    'Drop Ship Price': 'Drop ship price',
    'Available Drop Ship Delivery Options': 'Delivery options',
    'Allocated Item?': 'Allocated item',
    'mappedCategory': 'Site category',
    'sourceCategory': 'Source category',
    'displayPrice': 'Display price'
  };

  function stripHtml(html) {
    if (html == null || typeof html !== 'string') return '';
    var div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  }

  function toNum(value) {
    var n = parseFloat(String(value).trim(), 10);
    return isNaN(n) ? null : n;
  }

  function formatImperial(key, value) {
    var n = toNum(value);
    if (n === null) return '—';
    if (key === 'Ship Weight') return n.toFixed(2) + ' lb';
    if (key === 'Length' || key === 'Width') return n.toFixed(2) + ' in';
    if (key === 'Height') {
      var totalIn = n;
      var ft = Math.floor(totalIn / 12);
      var inVal = totalIn - ft * 12;
      if (ft === 0) return inVal.toFixed(2) + ' in';
      return ft + ' ft ' + (inVal % 1 === 0 ? inVal : inVal.toFixed(2)) + ' in';
    }
    return null;
  }

  function formatMetaValue(key, value) {
    if (value == null) return '—';
    if (key === 'mappedCategory' && value && typeof value === 'object') return (value.top || '') + (value.sub ? ' / ' + value.sub : '');
    if (typeof value === 'object') return JSON.stringify(value);
    var imperial = formatImperial(key, value);
    if (imperial !== null) return imperial;
    var s = String(value).trim();
    if (key === 'Web Item Description') return stripHtml(s) || '—';
    return s || '—';
  }

  var WEB_DESC_TRUNCATE = 280;

  function buildMetaList(p) {
    var order = ['SKU', 'Item Name', 'Web Item Name', 'Web Item Description', 'Quantity In Stock', 'Price', 'MAP', 'MSRP', 'Category', 'Manufacturer', 'Manufacturer Item Number', 'UPC', 'Image Location', 'Ship Weight', 'Length', 'Width', 'Height', 'Drop Ship Flag', 'Drop Ship Price', 'Available Drop Ship Delivery Options', 'Allocated Item?', 'mappedCategory', 'sourceCategory', 'displayPrice'];
    var seen = {};
    var html = '';
    order.forEach(function (key) {
      if (p[key] === undefined && !(key in p)) return;
      seen[key] = true;
      var label = METADATA_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }).trim();
      var val = formatMetaValue(key, p[key]);
      if (key === 'Web Item Description' && val.length > WEB_DESC_TRUNCATE) {
        val = val.slice(0, WEB_DESC_TRUNCATE).trim() + '…';
      }
      var longClass = (key === 'Web Item Description' && val.length > 200) ? ' meta-value--long' : '';
      html += '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) + '</span><span class="meta-value' + longClass + '">' + escapeHtml(val) + '</span></div>';
    });
    Object.keys(p).forEach(function (key) {
      if (seen[key] || key === 'image' || key === 'hidden' || key === 'forceShow' || key === 'priceOverride') return;
      var label = METADATA_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }).trim();
      var val = formatMetaValue(key, p[key]);
      html += '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) + '</span><span class="meta-value">' + escapeHtml(val) + '</span></div>';
    });
    return html;
  }

  var RAW_VALUE_MAX = 120;

  function buildRawMetaList(p) {
    var keys = Object.keys(p).sort();
    var html = '';
    keys.forEach(function (key) {
      var v = p[key];
      var valStr;
      if (v === undefined) valStr = '(undefined)';
      else if (v === null) valStr = '(null)';
      else if (typeof v === 'object') valStr = JSON.stringify(v);
      else valStr = String(v).trim();
      if (valStr.length > RAW_VALUE_MAX) valStr = valStr.slice(0, RAW_VALUE_MAX) + '…';
      html += '<div class="meta-row meta-row--raw"><span class="meta-label meta-label--raw">' + escapeHtml(key) + '</span><span class="meta-value meta-value--raw">' + escapeHtml(valStr) + '</span></div>';
    });
    return html;
  }

  function fillMappingDropdown(mappingSel, currentMapping) {
    mappingSel.innerHTML = '<option value="">— No mapping / Unmapped —</option>' +
      mappingOptions.map(function (opt, idx) {
        var label = opt.top + (opt.sub && opt.sub !== opt.top ? ' — ' + opt.sub : '');
        return '<option value="' + idx + '">' + escapeHtml(label) + '</option>';
      }).join('');
    if (currentMapping && currentMapping.top) {
      var matchIdx = mappingOptions.findIndex(function (o) { return o.top === currentMapping.top && (o.sub || o.top) === (currentMapping.sub || currentMapping.top); });
      if (matchIdx >= 0) mappingSel.value = String(matchIdx);
      else mappingSel.value = '';
    } else mappingSel.value = '';
  }

  function getMappingFromDropdown() {
    var sel = document.getElementById('edit-site-category');
    if (!sel) return null;
    var val = (sel.value || '').trim();
    if (val === '') return null;
    var idx = parseInt(val, 10);
    if (!mappingOptions.length || isNaN(idx) || idx < 0 || idx >= mappingOptions.length) return null;
    var opt = mappingOptions[idx];
    return { top: opt.top, sub: opt.sub || opt.top };
  }

  function setEditImagePreview(url) {
    var imgEl = document.getElementById('edit-image');
    var brokenEl = document.getElementById('edit-image-broken');
    if (!url || !url.trim()) {
      imgEl.src = '';
      imgEl.alt = 'No image';
      if (brokenEl) brokenEl.classList.remove('hidden');
      return;
    }
    brokenEl.classList.add('hidden');
    imgEl.onerror = function () { if (brokenEl) brokenEl.classList.remove('hidden'); };
    imgEl.onload = function () { if (brokenEl) brokenEl.classList.add('hidden'); };
    imgEl.src = imageSrc(url) || url;
  }

  const CDN_IMAGE_BASE = 'https://media.chattanoogashooting.com/images/product/';

  function getEditImageBaseUrl() {
    var url = (document.getElementById('edit-image-override') && document.getElementById('edit-image-override').value) || '';
    if (url.trim()) return url.trim();
    url = (document.getElementById('edit-image-url') && document.getElementById('edit-image-url').value) || '';
    if (url.trim() && url.indexOf('(none') !== 0) return url.trim();
    var sku = document.getElementById('edit-sku') && document.getElementById('edit-sku').textContent;
    if (sku) return CDN_IMAGE_BASE + sku + '/' + sku + '.jpg';
    return '';
  }

  function openEdit(sku) {
    const p = allProducts.find(x => (x.SKU || x.sku) === sku);
    if (!p) return;
    const modal = document.getElementById('edit-modal');
    var feedUrl = (p['Image Location'] || p.image || '').trim();
    var overrideUrl = (p.imageOverride || '').trim();
    var displayUrl = overrideUrl || feedUrl || (sku ? CDN_IMAGE_BASE + sku + '/' + sku + '.jpg' : '');
    document.getElementById('edit-image-url').value = feedUrl || '';
    document.getElementById('edit-image-override').value = overrideUrl || '';
    document.getElementById('edit-image').alt = p['Item Name'] || sku;
    setEditImagePreview(displayUrl);
    document.getElementById('edit-name').textContent = p['Web Item Name'] || p['Item Name'] || sku;
    document.getElementById('edit-sku').textContent = sku;
    document.getElementById('edit-price').value = p.priceOverride != null ? p.priceOverride : '';

    document.getElementById('edit-feed-category').textContent = (p.Category || '').trim() || '—';
    var mappedStr = '— Not mapped';
    if (p.mappedCategory && p.mappedCategory.top) {
      mappedStr = p.mappedCategory.top;
      if (p.mappedCategory.sub && p.mappedCategory.sub !== p.mappedCategory.top) mappedStr += ' — ' + p.mappedCategory.sub;
    }
    document.getElementById('edit-mapped-on-site').textContent = mappedStr;

    var hasListPrice = (p.MSRP != null && String(p.MSRP).trim() !== '') || (p.MAP != null && String(p.MAP).trim() !== '');
    var priceHintEl = document.getElementById('edit-price-hint');
    if (!hasListPrice && !p.priceOverride) {
      priceHintEl.textContent = 'No MSRP or MAP in feed — add an override price above to display this product on the site.';
      priceHintEl.classList.add('edit-price-hint--show');
    } else {
      priceHintEl.textContent = '';
      priceHintEl.classList.remove('edit-price-hint--show');
    }

    var mappingSel = document.getElementById('edit-site-category');
    var current = (p.mappedCategory && p.mappedCategory.top) ? { top: p.mappedCategory.top, sub: p.mappedCategory.sub || p.mappedCategory.top } : null;
    if (mappingOptions.length > 0) {
      fillMappingDropdown(mappingSel, current);
    } else {
      mappingSel.innerHTML = '<option value="">Loading site categories…</option>';
      api('/api/mapping-options')
        .then(function (r) {
          if (!r.ok) throw new Error(r.status === 401 ? 'Session expired — please log in again' : 'Server error ' + r.status);
          var ct = (r.headers.get('content-type') || '').toLowerCase();
          if (ct.indexOf('application/json') === -1) {
            throw new Error('API returned a page, not data. Open admin at http://localhost:3001 (run: npm run admin)');
          }
          return r.text().then(function (text) {
            try {
              return JSON.parse(text);
            } catch (e) {
              if (text.trim().indexOf('<!') === 0) {
                throw new Error('API returned a page. Use admin at http://localhost:3001 (npm run admin)');
              }
              throw e;
            }
          });
        })
        .then(function (data) {
          mappingOptions = data.options || [];
          fillMappingDropdown(mappingSel, current);
        })
        .catch(function (err) {
          var msg = err.message || 'Failed to load options';
          if (msg.indexOf('not valid JSON') !== -1 || msg.indexOf('<!DOCTYPE') !== -1) {
            msg = 'API returned a page. Open admin at http://localhost:3001 (npm run admin)';
          }
          mappingSel.innerHTML = '<option value="">' + escapeHtml(msg) + '</option>';
        });
    }

    var msrpStr = (p.MSRP != null && String(p.MSRP).trim() !== '') ? formatPrice(p.MSRP) : '';
    var mapStr = (p.MAP != null && String(p.MAP).trim() !== '') ? formatPrice(p.MAP) : '';
    var dealerStr = (p.Price != null && String(p.Price).trim() !== '') ? formatPrice(p.Price) : '';
    var currentParts = [msrpStr && 'MSRP ' + msrpStr, mapStr && 'MAP ' + mapStr].filter(Boolean);
    if (currentParts.length) currentParts = currentParts.join(' · ');
    else currentParts = '';
    if (dealerStr) currentParts = (currentParts ? currentParts + ' · ' : '') + 'Dealer (cost) ' + dealerStr;
    document.getElementById('edit-current-price-val').textContent = currentParts || '—';

    var listPrice = p.displayPrice != null ? Number(p.displayPrice) : (parseFloat(p.MSRP) || parseFloat(p.MAP) || null);
    var cost = (p.Price != null && p.Price !== '') ? parseFloat(p.Price) : null;
    var margin = (listPrice != null && cost != null && !isNaN(listPrice) && !isNaN(cost)) ? (listPrice - cost) : null;
    var onSiteList = (p.mappedCategory && p.mappedCategory.top && !p.hidden && listPrice > 0)
      ? (formatPrice(listPrice) + ' list · cost ' + (cost != null ? formatPrice(cost) : '—') + (margin != null ? ' · margin ' + formatPrice(margin) : ''))
      : 'Not listed';
    document.getElementById('edit-on-site-summary').textContent = onSiteList;
    var vendorName = (p.vendor || 'chattanooga').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    var thisOffer = (listPrice != null && listPrice > 0)
      ? (vendorName + ': ' + formatPrice(listPrice) + ' list · cost ' + (cost != null ? formatPrice(cost) : '—') + (margin != null ? ' · margin ' + formatPrice(margin) : ''))
      : vendorName + ': no list price (add MSRP, MAP, or override)';
    document.getElementById('edit-this-offer-summary').textContent = thisOffer;

    var stock = (p['Quantity In Stock'] ?? p.quantity ?? p.stock ?? '').toString().trim();
    var mfr = (p.Manufacturer || '').trim();
    var cat = (p.Category || '').trim();
    var dropShip = (p['Drop Ship Flag'] || '').toString().trim();
    var allocated = (p['Allocated Item?'] || '').toString().trim();
    var keyHtml = '';
    keyHtml += '<div class="key-info-row"><strong>Stock:</strong> ' + escapeHtml(stock || '—') + '</div>';
    keyHtml += '<div class="key-info-row"><strong>Manufacturer:</strong> ' + escapeHtml(mfr || '—') + '</div>';
    keyHtml += '<div class="key-info-row"><strong>Drop ship:</strong> ' + escapeHtml(dropShip ? (dropShip === '1' || dropShip.toLowerCase() === 'yes' ? 'Yes' : dropShip) : 'No') + '</div>';
    keyHtml += '<div class="key-info-row"><strong>Allocated:</strong> ' + escapeHtml(allocated || 'No') + '</div>';
    document.getElementById('edit-key-info').innerHTML = keyHtml;

    document.getElementById('edit-hidden').checked = !!p.hidden;
    document.getElementById('edit-force-show').checked = !!p.forceShow;
    document.getElementById('edit-meta').innerHTML = buildMetaList(p);
    var rawEl = document.getElementById('edit-meta-raw');
    if (rawEl) rawEl.innerHTML = buildRawMetaList(p);
    modal.dataset.sku = sku;
    modal.classList.remove('hidden');
  }

  document.getElementById('edit-image-highres').addEventListener('click', function () {
    var url = getEditImageBaseUrl();
    if (!url) return;
    var fixed = url.replace(/\?w=\d+&h=\d+/, '?w=500&h=500');
    if (fixed === url) fixed = (url.indexOf('?') >= 0 ? url : url + '?w=500&h=500');
    document.getElementById('edit-image-override').value = fixed;
    setEditImagePreview(fixed);
  });

  document.getElementById('edit-image-fix-ext').addEventListener('click', function () {
    var url = getEditImageBaseUrl();
    if (!url) return;
    var fixed = url.replace(/-jpg\.jpg$/i, '.jpg').replace(/_1-1-jpg\.jpg$/i, '_1-1.jpg');
    if (fixed.indexOf('?') === -1) fixed += '?w=500&h=500';
    else fixed = fixed.replace(/\?w=\d+&h=\d+/, '?w=500&h=500');
    document.getElementById('edit-image-override').value = fixed;
    setEditImagePreview(fixed);
  });

  document.getElementById('edit-image-try-sku').addEventListener('click', function () {
    var sku = document.getElementById('edit-sku') && document.getElementById('edit-sku').textContent;
    if (!sku) return;
    var url = getEditImageBaseUrl();
    var base = (url && url.match(/^(https?:\/\/[^/]+\/images\/product\/)[^/]+\//)) ? url.match(/^(https?:\/\/[^/]+\/images\/product\/)[^/]+\//)[1] : (CDN_IMAGE_BASE + sku + '/');
    var fixed = base + sku + '.jpg?w=500&h=500';
    document.getElementById('edit-image-override').value = fixed;
    setEditImagePreview(fixed);
  });

  document.getElementById('edit-image-try-variant').addEventListener('click', function () {
    var sku = document.getElementById('edit-sku') && document.getElementById('edit-sku').textContent;
    if (!sku) return;
    var base = CDN_IMAGE_BASE + sku + '/';
    var variant = sku.slice(0, -1) + '_1-1-jpg.jpg?w=500&h=500';
    var fixed = base + variant;
    document.getElementById('edit-image-override').value = fixed;
    setEditImagePreview(fixed);
  });

  function closeEdit() {
    document.getElementById('edit-modal').classList.add('hidden');
  }

  document.querySelector('.modal-backdrop').addEventListener('click', closeEdit);
  document.querySelector('.modal-close').addEventListener('click', closeEdit);
  document.querySelector('.modal-cancel').addEventListener('click', closeEdit);

  document.getElementById('edit-save').addEventListener('click', function () {
    const sku = (document.getElementById('edit-modal').dataset.sku || '').trim();
    if (!sku) return;
    const priceVal = document.getElementById('edit-price').value.trim();
    const priceOverride = priceVal === '' ? null : parseFloat(priceVal);
    const hidden = document.getElementById('edit-hidden').checked;
    const forceShow = document.getElementById('edit-force-show').checked;
    var mapping = getMappingFromDropdown();
    var imageOverrideVal = (document.getElementById('edit-image-override') && document.getElementById('edit-image-override').value) || '';
    var imageUrl = imageOverrideVal.trim() || null;
    var btn = document.getElementById('edit-save');
    var origText = btn.textContent;
    btn.textContent = 'Saving…';
    btn.disabled = true;
    api('/api/overrides', {
      method: 'POST',
      body: JSON.stringify({ sku, priceOverride, hidden, forceShow, mapping: mapping, imageUrl: imageUrl })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || data.message || 'Save failed (' + r.status + ')');
          return data;
        });
      })
      .then(function (savedOverride) {
        closeEdit();
        btn.textContent = 'Saved';
        setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 1200);
        var skuKey = sku;
        var p = allProducts.find(function (x) { return ((x.SKU || x.sku) || '').toString().trim() === skuKey; });
        if (p && savedOverride) {
          if (savedOverride.mapping && savedOverride.mapping.top) {
            p.mappedCategory = { top: savedOverride.mapping.top, sub: savedOverride.mapping.sub || savedOverride.mapping.top };
          } else {
            p.mappedCategory = null;
          }
          if (savedOverride.priceOverride != null) p.priceOverride = savedOverride.priceOverride;
          else p.priceOverride = null;
          p.hidden = !!savedOverride.hidden;
          p.forceShow = !!savedOverride.forceShow;
          if (savedOverride.imageUrl != null) p.imageOverride = savedOverride.imageUrl;
          renderTable(allProducts);
        }
        var catSel = document.getElementById('category-filter');
        if (catSel && mapping) catSel.value = '';
        var mappingFilterEl = document.getElementById('mapping-filter');
        if (mappingFilterEl && mapping) mappingFilterEl.value = '';
        loadProducts(true);
      })
      .catch(function (err) {
        btn.textContent = origText;
        btn.disabled = false;
        alert('Save failed: ' + (err.message || 'unknown'));
      });
  });

  document.querySelectorAll('.view-tab').forEach(function (tab) {
    tab.addEventListener('click', function () { setView(tab.getAttribute('data-view') || 'listed'); });
  });
  document.getElementById('search').addEventListener('input', function () { loadProducts(); });
  document.getElementById('category-filter').addEventListener('change', function () { loadProducts(); });
  var mappingFilterEl = document.getElementById('mapping-filter');
  if (mappingFilterEl) mappingFilterEl.addEventListener('change', function () { loadProducts(); });
  document.getElementById('filter-hidden').addEventListener('change', function () { loadProducts(); });

  if (token) {
    api('/api/products?view=listed').then(r => {
      if (r.ok) { showApp(); loadCategories(); loadProducts(); return; }
      token = null;
      localStorage.removeItem(TOKEN_KEY);
    }).catch(() => { token = null; localStorage.removeItem(TOKEN_KEY); });
  }
})();
