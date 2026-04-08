/**
 * MGW Shop Filters - AJAX (Ammo Depot style)
 * Fetches only products + sidebar via dedicated endpoint
 * Uses event delegation so filters work after sidebar HTML is replaced via AJAX
 */
(function() {
  var form = document.getElementById('mgw-filter-form');
  var productsWrap = document.getElementById('mgw-ajax-products-wrap');
  var sidebarWrap = document.getElementById('filters-sidebar');
  if (!form || !productsWrap) return;

  function collectHiddenInputs(f) {
    f = f || document.getElementById('mgw-filter-form');
    if (!f) return;
    var params = {};
    f.querySelectorAll('[data-filter-param]').forEach(function(cb) {
      if (cb.disabled) return;
      var param = cb.getAttribute('data-filter-param');
      if (!params[param]) params[param] = [];
      if (cb.checked) params[param].push(cb.value);
    });
    for (var p in params) {
      var hidden = f.querySelector('input[name="' + p + '"]');
      if (hidden) hidden.value = params[p].join(',');
    }
  }

  function triggerFormSubmit(f) {
    f = f || document.getElementById('mgw-filter-form');
    if (!f) return;
    collectHiddenInputs(f);
    if (typeof f.requestSubmit === 'function') {
      f.requestSubmit();
    } else {
      var ev = new Event('submit', { bubbles: true, cancelable: true });
      f.dispatchEvent(ev);
      if (!ev.defaultPrevented) f.submit();
    }
  }

  function buildAjaxUrl() {
    var f = document.getElementById('mgw-filter-form');
    if (!f) return '';
    collectHiddenInputs(f);
    var fd = new FormData(f);
    var params = new URLSearchParams();
    params.append('action', 'mgw_filter_content');
    params.append('mgw_filter', '1');
    params.append('base_url', window.location.href.split('?')[0]);
    var path = window.location.pathname || '';
    var m = path.match(/\/product-category\/([^\/]+)/);
    var mb = path.match(/\/brand\/([^\/]+)/i);
    fd.forEach(function(val, key) {
      if (key !== 's') params.append(key, val);
    });
    if (!params.has('product_cat') && m) params.append('product_cat', m[1]);
    if (!params.has('product_brand') && mb) params.append('product_brand', mb[1]);
    if (fd.get('s')) params.append('s', fd.get('s'));
    var base = (typeof mgwFilterVars !== 'undefined' && mgwFilterVars.ajaxUrl) ? mgwFilterVars.ajaxUrl : (window.location.origin + '/wp-admin/admin-ajax.php');
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    var url = base + sep + params.toString();
    console.log('[MGW Filters] AJAX URL:', url);
    return url;
  }

  function setLoading(loading) {
    productsWrap.classList.toggle('mgw-ajax-loading', loading);
    if (sidebarWrap) sidebarWrap.classList.toggle('mgw-sidebar-loading', loading);
  }

  function applyFilters(e) {
    e.preventDefault();
    var url = buildAjaxUrl();
    if (!url) return;
    setLoading(true);
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function(r) {
        console.log('[MGW Filters] Response status:', r.status, r.statusText);
        return r.text();
      })
      .then(function(text) {
        try {
          var data = JSON.parse(text);
          console.log('[MGW Filters] Full response:', data);
          console.log('[MGW Filters] data.success:', data.success, 'data.data:', !!data.data);
          if (data.data) {
            console.log('[MGW Filters] data.data.products length:', (data.data.products || '').length);
            console.log('[MGW Filters] data.data.sidebar length:', (data.data.sidebar || '').length);
          }
          return data;
        } catch (err) {
          console.error('[MGW Filters] JSON parse error:', err);
          console.error('[MGW Filters] Raw response (first 500 chars):', text ? text.substring(0, 500) : '(empty)');
          throw err;
        }
      })
      .then(function(data) {
        if (data.success && data.data) {
          if (data.data.products) {
            var tmp = document.createElement('div');
            tmp.innerHTML = data.data.products;
            var inner = tmp.querySelector('#mgw-ajax-products-wrap');
            if (inner) productsWrap.innerHTML = inner.innerHTML;
            else productsWrap.innerHTML = data.data.products;
          }
          if (data.data.sidebar && sidebarWrap) {
            sidebarWrap.outerHTML = data.data.sidebar;
            sidebarWrap = document.getElementById('filters-sidebar');
            var newForm = document.getElementById('mgw-filter-form');
            if (newForm) { form = newForm; form.addEventListener('submit', applyFilters); }
          }
          if (typeof history !== 'undefined' && history.pushState) {
            var f = document.getElementById('mgw-filter-form');
            if (f) {
              collectHiddenInputs(f);
              var fd = new FormData(f);
              var q = [];
              fd.forEach(function(v,k){ if(v) q.push(encodeURIComponent(k)+'='+encodeURIComponent(v)); });
              history.pushState({}, '', (f.getAttribute('action') || location.pathname) + (q.length ? '?' + q.join('&') : ''));
            }
          }
          if (typeof jQuery !== 'undefined') {
            jQuery(document.body).trigger('mgw_filters_updated');
          }
        }
      })
      .catch(function(err) { console.error('[MGW Filters] Fetch/parse error:', err); var f = document.getElementById('mgw-filter-form'); if (f) f.submit(); })
      .finally(function() { setLoading(false); });
  }

  form.addEventListener('submit', applyFilters);

  document.body.addEventListener('click', function(e) {
    var link = e.target.closest('.filter-option-cat');
    if (!link) return;
    e.preventDefault();
    var slug = link.getAttribute('data-product-cat');
    var f = document.getElementById('mgw-filter-form');
    if (!f) return;
    var hid = f.querySelector('input[name="product_cat"]');
    if (hid) hid.value = slug || '';
    triggerFormSubmit(f);
  });

  document.body.addEventListener('change', function(e) {
    var f = document.getElementById('mgw-filter-form');
    if (!f || !f.contains(e.target)) return;
    if (e.target.matches('input[type="checkbox"], select')) {
      triggerFormSubmit(f);
    }
  });

  var priceDebounce;
  document.body.addEventListener('input', function(e) {
    var f = document.getElementById('mgw-filter-form');
    if (!f || !f.contains(e.target)) return;
    if (e.target.id === 'price-min' || e.target.id === 'price-max') {
      clearTimeout(priceDebounce);
      priceDebounce = setTimeout(function() { triggerFormSubmit(f); }, 400);
    }
  });

  document.body.addEventListener('click', function(e) {
    if (!e.target.closest('.mgw-shop-filters .filter-toggle')) return;
    var btn = e.target.closest('.filter-toggle');
    var tid = btn.getAttribute('aria-controls');
    if (!tid) return;
    var t = document.getElementById(tid);
    if (!t) return;
    var exp = btn.getAttribute('aria-expanded') === 'true';
    t.classList.toggle('active', !exp);
    btn.classList.toggle('active', !exp);
    btn.setAttribute('aria-expanded', !exp);
    var i = btn.querySelector('i');
    if (i) { i.classList.toggle('fa-chevron-down', exp); i.classList.toggle('fa-chevron-up', !exp); }
  });

  document.body.addEventListener('input', function(e) {
    if (!e.target.matches('.mgw-shop-filters .filter-search-within')) return;
    var q = (e.target.value || '').toLowerCase();
    var tg = document.querySelector(e.target.getAttribute('data-filter-target'));
    if (tg) tg.querySelectorAll('.filter-option').forEach(function(o) { o.style.display = (o.textContent || '').toLowerCase().indexOf(q) >= 0 ? '' : 'none'; });
  });

  document.body.addEventListener('click', function(e) {
    var clr = e.target.closest('#clear-filters');
    if (clr && clr.href) {
      e.preventDefault();
      window.location.href = clr.href;
    }
  });


  window.addEventListener('popstate', function() { location.reload(); });
})();
