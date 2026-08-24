// ============ product-detail.js · 产品详情页 ============
// 从 window.PRESET_PRODUCT（slug）读取产品标识，加载数据并渲染详情 + 相关产品

(function () {
    // 设置 meta 标签（name 或 property 属性）
    function setMeta(name, content, isProperty) {
        const attr = isProperty ? 'property' : 'name';
        let el = document.querySelector('meta[' + attr + '="' + name + '"]');
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    // 从页面预设变量获取 slug
    function getSlug() {
        return window.PRESET_PRODUCT || null;
    }

    // 根据品牌 + slug 生成 SKU
    function makeSku(p) {
        return 'FK-' + p.slug.toUpperCase().replace(/-/g, '').substring(0, 8);
    }

    async function init() {
        const slug = getSlug();
        if (!slug) {
            // 没有 slug，跳转到产品列表页
            window.location.href = '/shop/';
            return;
        }

        try {
            const [products, categories] = await Promise.all([
                ProductRenderer.load(),
                window.DataStore.categories()
            ]);

            // 根据 slug 查找产品
            const product = products.find(p => p.slug === slug);
            if (!product) {
                document.getElementById('product-detail').innerHTML = '<p class="products-empty">产品未找到。</p>';
                return;
            }

            // 查找分类信息，用于面包屑和链接
            const cat = categories.items.find(c => c.slug === product.catSlug);
            const catName = cat ? cat.name : product.catSlug;
            const catPath = cat
                ? (cat.parent ? '/product-category/' + cat.parent + '/' + cat.slug + '/' : '/product-category/' + cat.slug + '/')
                : '/shop/';

            // 动态设置页面标题和 meta（使 <head> 可在所有产品页通用）
            document.title = product.name + ' · Fish Keeper';
            const metaDesc = 'Premium Fish Keeper ' + catName.toLowerCase() + ' - ' + product.name + '. Quality aquarium equipment with 7-day satisfaction guarantee.';
            setMeta('description', metaDesc);
            setMeta('og:title', product.name + ' · Fish Keeper', true);
            setMeta('og:description', metaDesc, true);
            setMeta('og:image', product.image, true);

            // 面包屑
            document.getElementById('bc-cat').innerHTML = '<a href="' + catPath + '">' + catName + '</a>';
            document.getElementById('bc-product').textContent = product.name;

            // 产品图片
            const img = document.getElementById('product-image');
            img.src = product.image;
            img.alt = product.alt || product.name;

            // 产品信息
            document.getElementById('product-brand').textContent = product.brand;
            document.getElementById('product-title').textContent = product.name;

            // 评分
            const ratingEl = document.getElementById('product-rating');
            ratingEl.innerHTML = '<span class="stars">' + ProductRenderer.stars(product.rating) + '</span>' +
                '<span>' + product.score + ' · ' + product.reviews + '</span>';

            // 价格
            const price = ProductRenderer.parsePrice(product.price);
            let priceHtml = '<span class="price-now"><small>' + price.cur + '</small>' + price.num + '</span>';
            if (product.oldPrice) priceHtml += '<span class="price-old">' + product.oldPrice + '</span>';
            document.getElementById('product-price').innerHTML = priceHtml;

            // 描述（直接从 products.json 读取）
            document.getElementById('product-desc').textContent = product.description || '';

            // 元信息
            document.getElementById('meta-brand').textContent = product.brand;
            document.getElementById('meta-cat').innerHTML = '<a href="' + catPath + '">' + catName + '</a>';
            document.getElementById('meta-sku').textContent = makeSku(product);

            // 相关产品（同分类，排除当前产品，最多4个）
            const related = products.filter(p => p.catSlug === product.catSlug && p.slug !== product.slug).slice(0, 4);
            if (related.length) {
                ProductRenderer.renderGrid(document.getElementById('related-grid'), related);
            } else {
                // 兜底：取任意 featured 产品
                const featured = products.filter(p => p.featured && p.slug !== product.slug).slice(0, 4);
                ProductRenderer.renderGrid(document.getElementById('related-grid'), featured);
            }

            if (window.initReveal) window.initReveal();
        } catch (e) {
            console.error('[product-detail] 加载失败:', e);
            document.getElementById('product-detail').innerHTML = '<p class="products-empty">产品加载失败。</p>';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
