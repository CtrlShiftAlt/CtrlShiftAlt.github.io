// ============ home.js · 首页模块脚本 ============
// 各模块通过 DataStore 独立加载自己的 JSON 数据
// renderProducts 和 initTabs 挂在 window 上，供 bootApp 检测调用

/* ----- Hero 区 ----- */
(async function renderHero() {
    const badge = document.getElementById('hero-badge');
    if (!badge) return;
    try {
        const h = await window.DataStore.hero();
        badge.textContent = h.badge.replace(/🐠\s*/g, '');
        document.getElementById('hero-title').innerHTML = h.title + '<br><span class="gradient-text">' + h.titleHighlight + '</span>';
        document.getElementById('hero-desc').textContent = h.description;
        document.getElementById('hero-cta').innerHTML =
            '<a href="' + h.primaryCta.href + '" class="btn-primary">' + h.primaryCta.text +
            ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
            '<a href="' + h.secondaryCta.href + '" class="btn-link">' + h.secondaryCta.text +
            ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
        const img = document.getElementById('hero-image');
        img.src = h.image;
        img.alt = h.imageAlt;
    } catch (e) {
        console.error('Hero 加载失败:', e);
    }
})();

/* ----- 服务卡片 ----- */
(async function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    try {
        const services = await window.DataStore.services();
        grid.innerHTML = services.map(s =>
            '<div class="service-card reveal">' +
                '<div class="service-icon"><img src="' + s.icon + '" alt="" width="28" height="28"></div>' +
                '<div class="service-content"><h3>' + s.title + '</h3><p>' + s.description + '</p></div>' +
            '</div>'
        ).join('');
        if (window.initReveal) window.initReveal();
    } catch (e) {
        console.error('服务卡片加载失败:', e);
    }
})();

/* ----- 分类展示 ----- */
(async function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    try {
        const data = await window.DataStore.categories();
        document.getElementById('cat-eyebrow').textContent = data.meta.eyebrow;
        document.getElementById('cat-title').textContent = data.meta.title;
        document.getElementById('cat-sub').textContent = data.meta.subtitle;
        grid.innerHTML = data.items.filter(c => !c.parent).map(cat =>
            '<a class="cat-card reveal" href="/product-category/' + cat.slug + '/" style="background-image: url(\'' + cat.image + '\');">' +
                '<div class="cat-overlay"></div>' +
                '<div class="cat-content">' +
                    '<h3>' + cat.name + '</h3>' +
                    '<p>' + cat.subtitle + ' — ' + cat.description + '</p>' +
                '</div></a>'
        ).join('');
        if (window.initReveal) window.initReveal();
    } catch (e) {
        console.error('分类加载失败:', e);
    }
})();

/* ----- Best Sellers：bootApp 加载 partial 后调用 ----- */
window.renderProducts = async function () {
    const grid = document.getElementById('products-grid');
    const tabsEl = document.getElementById('hp-tabs');
    if (!grid) return;
    try {
        const [hp, cats, list] = await Promise.all([
            window.DataStore.homepageProducts(),
            window.DataStore.categories(),
            ProductRenderer.loadFeatured()
        ]);
        document.getElementById('hp-eyebrow').textContent = hp.eyebrow;
        document.getElementById('hp-title').textContent = hp.title;
        document.getElementById('hp-sub').textContent = hp.subtitle;
        const viewAll = document.getElementById('hp-viewall');
        viewAll.href = hp.viewAllHref;
        viewAll.textContent = hp.viewAllText;
        viewAll.innerHTML += ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

        // 构建父分类 slug → 子分类 slug 数组的映射（用于 tab 过滤）
        const childrenMap = {};
        cats.items.forEach(c => {
            if (c.parent) {
                if (!childrenMap[c.parent]) childrenMap[c.parent] = [];
                childrenMap[c.parent].push(c.slug);
            }
        });
        window._hpChildrenMap = childrenMap;

        // 只渲染一级分类作为 tab，存储 slug 到 data-slug
        const topCats = cats.items.filter(c => !c.parent);
        tabsEl.innerHTML = '<button class="tab active" role="tab" aria-selected="true" tabindex="0" data-slug="all">All</button>' +
            topCats.map(c => '<button class="tab" role="tab" aria-selected="false" tabindex="-1" data-slug="' + c.slug + '">' + c.name + '</button>').join('');

        ProductRenderer.renderGrid(grid, list);
        if (window.initReveal) window.initReveal();
    } catch (e) {
        console.error('[products] 加载失败:', e);
        grid.innerHTML = '<p class="products-empty">产品加载失败。</p>';
    }
};

/* ----- Tab 切换（支持键盘操作）----- */
window.initTabs = function () {
    const tabs = Array.from(document.querySelectorAll('.home-tabs .tab'));
    if (!tabs.length) return;
    const childrenMap = window._hpChildrenMap || {};
    const activate = (tab) => {
        tabs.forEach(t => {
            const on = (t === tab);
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
        });
        const slug = tab.dataset.slug;
        let visibleCount = 0;
        document.querySelectorAll('.product').forEach(p => {
            let matched = false;
            if (slug === 'all') {
                matched = true;
            } else if (childrenMap[slug]) {
                matched = childrenMap[slug].indexOf(p.dataset.catSlug) !== -1;
            } else {
                matched = p.dataset.catSlug === slug;
            }
            // 每个 tab（包括 All）最多显示 8 个产品
            if (matched && visibleCount < 8) {
                p.style.display = '';
                p.classList.add('visible');
                visibleCount++;
            } else {
                p.style.display = 'none';
            }
        });
    };
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (e) => {
            let idx = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') idx = 0;
            else if (e.key === 'End') idx = tabs.length - 1;
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(tab); return; }
            else return;
            if (idx >= 0) { e.preventDefault(); tabs[idx].focus(); activate(tabs[idx]); }
        });
    });
    // 初始化时自动激活第一个 tab（All），强制执行 8 个限制
    if (tabs.length) activate(tabs[0]);
};

/* ----- 品牌故事 ----- */
(async function renderBrand() {
    const eyebrow = document.getElementById('brand-eyebrow');
    if (!eyebrow) return;
    try {
        const b = await window.DataStore.brand();
        eyebrow.textContent = b.eyebrow;
        document.getElementById('brand-title').textContent = b.title;
        document.getElementById('brand-lead').textContent = b.lead;
        document.getElementById('brand-desc').textContent = b.description;
        const img = document.getElementById('brand-image');
        img.src = b.image;
        img.alt = b.imageAlt;
        document.getElementById('brand-badge').innerHTML = '<strong>' + b.badge.value + '</strong><span>' + b.badge.label + '</span>';
        document.getElementById('brand-stats').innerHTML = b.stats.map(s =>
            '<div class="brand-stat"><strong>' + s.value + '</strong><span>' + s.label + '</span></div>'
        ).join('');
        const cta = document.getElementById('brand-cta');
        cta.href = b.cta.href;
        cta.textContent = b.cta.text;
        cta.innerHTML += ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    } catch (e) {
        console.error('品牌区加载失败:', e);
    }
})();
