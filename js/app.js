// ============ app.js 路 搴旂敤鍚姩鍏ュ彛 ============
// 鍏叡宸ュ叿鍑芥暟 + 鍚勬ā鍧楀垵濮嬪寲 + bootApp 鍏ュ彛

// 杞箟 HTML 鐗规畩瀛楃锛堝叏灞€鍑芥暟锛屼緵 partial 鍐呰仈鑴氭湰浣跨敤锛?
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 鍔犺浇 HTML partial锛屾敞鍏ュ埌鎸囧畾瀹瑰櫒锛屽苟鎵ц鍏朵腑鐨勫唴鑱?<script>
async function fetchPartial(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        mount.innerHTML = await res.text();
        // 娴忚鍣ㄤ笉浼氭墽琛?innerHTML 娉ㄥ叆鐨?<script>锛岄渶瑕侀噸鏂板垱寤?
        mount.querySelectorAll('script').forEach(old => {
            const s = document.createElement('script');
            if (old.src) s.src = old.src;
            else s.textContent = old.textContent;
            old.parentNode.replaceChild(s, old);
        });
    } catch (e) {
        console.error('[partial] 鍔犺浇澶辫触:', url, e);
    }
}

// 灏忔椂绾х増鏈彿 鈥?缁曡繃娴忚鍣ㄧ紦瀛橈紝姣忓皬鏃惰嚜鍔ㄨ幏鍙栨渶鏂版暟鎹?
function _hourVersion() {
    const d = new Date();
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + String(d.getHours()).padStart(2, '0');
}
function _jsonUrl(path) {
    return path + '?v=' + _hourVersion();
}
// 鍏ㄥ眬鏁版嵁璁块棶灞?鈥?鍚勬ā鍧楅€氳繃 DataStore 鍔犺浇 JSON锛孶RL 鑷姩甯︾増鏈彿
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

    // 婊氬姩娓愬叆鍔ㄧ敾锛圛ntersectionObserver锛?
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

    // 鍥炲埌椤堕儴鎸夐挳
    function initScrollTop() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.setAttribute('aria-label', '鍥炲埌椤堕儴');
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

    // 鏍囪褰撳墠椤甸潰瀵瑰簲鐨勫鑸」楂樹寒锛圥C + 绉诲姩绔級
    function markActiveNav() {
        const path = window.location.pathname;
        // 鏍规嵁 URL 璺緞鍒ゆ柇鍝釜瀵艰埅椤瑰簲璇ラ珮浜?
        let activeHref = null;
        if (path.indexOf('/shop/') !== -1 || path.indexOf('/product-category/') !== -1 || path.indexOf('/product/') !== -1) {
            activeHref = '/shop/';
        } else if (path.indexOf('/about') !== -1) {
            activeHref = '/about/';
        } else if (path.indexOf('/contact') !== -1) {
            activeHref = '/contact/';
        } else {
            activeHref = '/';
        }
        document.querySelectorAll('.menu > a, .menu .has-sub > a, .mobile-nav > a, .mobile-nav .m-has-sub > .m-sub-toggle > span').forEach(a => {
            const href = a.getAttribute && a.getAttribute('href');
            let isActive = false;
            if (activeHref === '/shop/') {
                // Products 鑿滃崟锛氬湪 /shop/ 鎴栦换鎰?/product-category/*/ 椤甸潰楂樹寒
                isActive = href === '/shop/' || (href && href.indexOf('/product-category/') === 0);
            } else {
                isActive = href === activeHref || (href && href.indexOf(activeHref + '#') === 0);
            }
            if (a.tagName === 'A') a.classList.toggle('active', isActive);
        });
        // 绉诲姩绔細濡傛灉瀛愯彍鍗曚腑鏈夊尮閰嶅綋鍓嶉〉闈㈢殑閾炬帴锛屾爣璁扮埗绾у睍寮€鎸夐挳
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

    // 椤甸潰鍚姩锛氬姞杞?partial 鈫?娓叉煋浜у搧锛堝瀛樺湪锛夆啋 鍒濆鍖栨墍鏈夋ā鍧?
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

    // 鍙毚闇插惎鍔ㄥ叆鍙?
    window.bootApp = bootApp;
})();
