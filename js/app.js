// ============ app.js · 应用启动入口 ============
// 公共工具函数 + 各模块初始化 + bootApp 入口

// 转义 HTML 特殊字符（全局函数，供 partial 内联脚本使用）
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 加载 HTML partial，注入到指定容器，并执行其中的内联 <script>
async function fetchPartial(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        mount.innerHTML = await res.text();
        // 浏览器不会执行 innerHTML 注入的 <script>，需要重新创建
        mount.querySelectorAll('script').forEach(old => {
            const s = document.createElement('script');
            if (old.src) s.src = old.src;
            else s.textContent = old.textContent;
            old.parentNode.replaceChild(s, old);
        });
    } catch (e) {
        console.error('[partial] 加载失败:', url, e);
    }
}

// 小时级版本号 — 绕过浏览器缓存，每小时自动获取最新数据
function _hourVersion() {
    const d = new Date();
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + String(d.getHours()).padStart(2, '0');
}
function _jsonUrl(path) {
    return path + '?v=' + _hourVersion();
}
// 全局数据访问层 — 各模块通过 DataStore 加载 JSON，URL 自动带版本号
window.DataStore = {
    announcement: function () { return fetch(_jsonUrl('data/announcement.json')).then(function (r) { return r.json(); }); },
    hero: function () { return fetch(_jsonUrl('data/hero.json')).then(function (r) { return r.json(); }); },
    services: function () { return fetch(_jsonUrl('data/services.json')).then(function (r) { return r.json(); }); },
    brand: function () { return fetch(_jsonUrl('data/brand.json')).then(function (r) { return r.json(); }); },
    homepageProducts: function () { return fetch(_jsonUrl('data/homepage-products.json')).then(function (r) { return r.json(); }); },
    footer: function () { return fetch(_jsonUrl('data/footer.json')).then(function (r) { return r.json(); }); },
    categories: function () { return fetch(_jsonUrl('data/categories.json')).then(function (r) { return r.json(); }); },
    products: function () { return fetch(_jsonUrl('data/products.json')).then(function (r) { return r.json(); }); }
};

(function () {

    // 滚动渐入动画（IntersectionObserver）
    function initReveal() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;
        if (!('IntersectionObserver' in window)) {
            reveals.forEach(el => el.classList.add('visible'));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(el => observer.observe(el));
    }

    // 回到顶部按钮
    function initScrollTop() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.setAttribute('aria-label', '回到顶部');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
        document.body.appendChild(btn);
        const toggle = () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        };
        window.addEventListener('scroll', toggle, { passive: true });
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        toggle();
    }

    // 标记当前页面对应的导航项高亮（PC + 移动端）
    function markActiveNav() {
        const path = window.location.pathname;
        // 根据 URL 路径判断哪个导航项应该高亮
        let activeHref = null;
        if (path.indexOf('/shop/') !== -1 || path.indexOf('/product-category/') !== -1 || path.indexOf('/product/') !== -1) {
            activeHref = '/shop/';
        } else if (path.indexOf('/about') !== -1) {
            activeHref = '/about.html';
        } else if (path.indexOf('/contact') !== -1) {
            activeHref = '/contact.html';
        } else {
            activeHref = '/';
        }
        document.querySelectorAll('.menu > a, .menu .has-sub > a, .mobile-nav > a, .mobile-nav .m-has-sub > .m-sub-toggle > span').forEach(a => {
            const href = a.getAttribute && a.getAttribute('href');
            let isActive = false;
            if (activeHref === '/shop/') {
                // Products 菜单：在 /shop/ 或任意 /product-category/*/ 页面高亮
                isActive = href === '/shop/' || (href && href.indexOf('/product-category/') === 0);
            } else {
                isActive = href === activeHref || (href && href.indexOf(activeHref + '#') === 0);
            }
            if (a.tagName === 'A') a.classList.toggle('active', isActive);
        });
        // 移动端：如果子菜单中有匹配当前页面的链接，标记父级展开按钮
        document.querySelectorAll('.mobile-nav .m-has-sub').forEach(wrap => {
            const subLinks = wrap.querySelectorAll('.m-submenu a');
            const match = Array.from(subLinks).some(a => {
                const h = a.getAttribute('href');
                if (activeHref === '/shop/') return h === '/shop/' || (h && h.indexOf('/product-category/') === 0);
                return h === activeHref || h.indexOf(activeHref + '?') === 0 || h.indexOf(activeHref + '#') === 0;
            });
            const toggleSpan = wrap.querySelector('.m-sub-toggle > span');
            if (toggleSpan) toggleSpan.style.color = match ? 'var(--accent)' : '';
        });
    }

    // 页面启动：加载 partial → 渲染产品（如存在）→ 初始化所有模块
    async function bootApp(partials) {
        await Promise.all(partials.map(p => fetchPartial(p.url, p.mountId)));
        if (typeof renderProducts === 'function') {
            await renderProducts();
        }
        if (typeof initHeaderScroll === 'function') initHeaderScroll();
        if (typeof initSearch === 'function') initSearch();
        if (typeof initMobileMenu === 'function') initMobileMenu();
        initReveal();
        if (typeof initTabs === 'function') initTabs();
        initScrollTop();
        markActiveNav();
    }

    // 只暴露启动入口
    window.bootApp = bootApp;
})();
