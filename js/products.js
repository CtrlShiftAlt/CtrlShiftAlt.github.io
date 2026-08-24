// ============ products.js · 产品渲染公共模块 ============
// 首页和列表页共用的产品卡片渲染逻辑

window.ProductRenderer = (function () {

    // 生成星级字符串（如 ★★★★☆）
    function stars(n) {
        const count = Math.max(0, Math.min(5, n));
        return '\u2605'.repeat(count) + '\u2606'.repeat(5 - count);
    }

    // 拆分价格字符串为货币符号 + 数字部分
    function parsePrice(priceStr) {
        const s = String(priceStr == null ? '' : priceStr);
        return {
            num: s.replace(/[^\d.,]/g, ''),
            cur: s.replace(/[\d.,]/g, '')
        };
    }

    // 提取价格数值，用于排序/比较
    function priceValue(p) {
        return parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0;
    }

    // 构建单个产品卡片 HTML
    function card(p) {
        const tag = p.tag
            ? '<span class="tag ' + escapeHtml(p.tag) + '">' + escapeHtml(p.tagText) + '</span>'
            : '';
        const old = p.oldPrice
            ? '<span class="price-old">' + escapeHtml(p.oldPrice) + '</span>'
            : '';
        const price = parsePrice(p.price);
        return '<a class="product reveal" href="/product/' + escapeHtml(p.slug) + '/" data-cat-slug="' + escapeHtml(p.catSlug) + '" aria-label="' + escapeHtml(p.brand) + ' ' + escapeHtml(p.name) + '">' +
            '<div class="product-img">' +
                '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.alt) + '" loading="lazy" width="400" height="400">' +
                tag +
            '</div>' +
            '<div class="product-body">' +
                '<div class="product-brand">' + escapeHtml(p.brand) + '</div>' +
                '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
                '<div class="product-rating">' +
                    '<span class="stars">' + stars(p.rating) + '</span>' +
                    '<span>' + escapeHtml(p.score) + ' \u00b7 ' + escapeHtml(p.reviews) + '</span>' +
                '</div>' +
                '<div class="product-price"><div>' +
                    '<span class="price-now"><small>' + escapeHtml(price.cur) + '</small>' + escapeHtml(price.num) + '</span>' + old +
                '</div></div>' +
            '</div>' +
        '</a>';
    }

    // 渲染产品列表到网格容器
    function renderGrid(gridEl, list) {
        if (!gridEl) return;
        if (!Array.isArray(list) || !list.length) {
            gridEl.innerHTML = '<p class="products-empty">暂无产品。</p>';
            return;
        }
        gridEl.innerHTML = list.map(card).join('');
    }

    // 加载产品数据（通过 DataStore 缓存）
    async function load(url) {
        if (url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('数据格式错误');
            return data;
        }
        const data = await window.DataStore.products();
        if (!Array.isArray(data)) throw new Error('数据格式错误');
        return data;
    }

    // 加载所有 featured 产品（如果没有标记 featured 则返回全部）
    async function loadFeatured(url) {
        const all = await load(url);
        const featured = all.filter(p => p.featured);
        return featured.length ? featured : all;
    }

    return { stars, parsePrice, priceValue, card, renderGrid, load, loadFeatured };
})();
