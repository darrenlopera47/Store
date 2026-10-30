/* Product listing, filters, search, detail modal, homepage sections */
const skel = n => '<div class="sk"></div>'.repeat(n);
function fill(sel, list, n) {
    const el = $(sel);
    if (!el)
        return;
    el.innerHTML = skel(n);
    setTimeout(() => {
        el.innerHTML = list.length ? list.map(cardH).join('') : empty('🔍', 'No products found. Try a different search or category.');
    }, 550);
}
function openProduct(id) {
    const p = getProduct(id);
    if (!p)
        return;
    let q = 1;
    const m = modal(`<div class="pd"><div class="pimg">${imgH(p)}</div><div><small>${esc(p.cat)}</small><h2>${esc(p.name)}</h2><div class="stars">${stars(p.rating)} <small>${p.rating} · ${p.sold} sold</small></div><p style="margin:12px 0">${esc(p.desc)}</p><div class="price" style="font-size:1.6rem">${peso(price(p))}${p.sale ? `<s>${peso(p.price)}</s>` : ''}</div><p class="stock ${p.stock <= 5 ? 'low' : ''}" style="margin:8px 0 16px">${p.stock ? p.stock + ' available' : 'Out of stock'}</p>
  ${p.stock ? `<div class="qty"><button id="mm">−</button><span id="mq">1</span><button id="mp">+</button></div><button class="btn m full" id="ma" style="margin-top:16px">Add to cart</button>` : '<button class="btn full" disabled>Sold out</button>'}</div></div>`);
    if (!p.stock)
        return;
    const s = () => $('#mq', m).textContent = q;
    $('#mm', m).onclick = () => {
        q = Math.max(1, q - 1);
        s();
    };
    $('#mp', m).onclick = () => {
        if (q < p.stock)
            q++;
        else
            toast(`Only ${p.stock} in stock`, 'error');
        s();
    };
    $('#ma', m).onclick = () => {
        if (Cart.add(p.id, q))
            closeModal();
    };
}
document.addEventListener('click', e => {
    const a = e.target.closest('[data-add]'), v = e.target.closest('[data-view]');
    if (a)
        Cart.add(a.dataset.add);
    else if (v)
        openProduct(v.dataset.view);
});
document.addEventListener('DOMContentLoaded', () => {
    const pg = document.body.dataset.page, P = getProducts();
    if (pg === 'home') {
        fill('#feat', P.filter(p => p.rating >= 4.7).slice(0, 4), 4);
        fill('#best', [...P].sort((a, b) => b.sold - a.sold).slice(0, 4), 4);
        fill('#new', [...P].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4), 4);
        $('#cats').innerHTML = Object.entries(CATS).map(([c, i]) => `<a class="cat" href="products.html?cat=${c}"><span>${i}</span>${c}</a>`).join('');
        $('#nl').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            toast('Subscribed! Check your inbox for 10% off.');
            e.target.reset();
        };
    }
    if (pg === 'shop') {
        const qs = new URLSearchParams(location.search), st = {
            q: qs.get('q') || '', cat: qs.get('cat') || 'All', sort: 'feat'
        };
        $('#q').value = st.q;
        $('#chips').innerHTML = ['All', ...Object.keys(CATS)].map(c => `<button class="chip" data-c="${c}">${c}</button>`).join('');
        const run = () => {
            $$('.chip').forEach(c => c.classList.toggle('on', c.dataset.c === st.cat));
            let L = getProducts().filter(p => (st.cat === 'All' || p.cat === st.cat) && (p.name + ' ' + p.desc).toLowerCase().includes(st.q.toLowerCase()));
            const S = {
                'low': (a, b) => price(a) - price(b), 'high': (a, b) => price(b) - price(a), 'new': (a, b) => new Date(b.date) - new Date(a.date), 'best': (a, b) => b.sold - a.sold, 'feat': (a, b) => b.rating - a.rating
            };
            L.sort(S[st.sort]);
            $('#cnt').textContent = L.length + ' product' + (L.length === 1 ? '' : 's');
            $('#grid').innerHTML = L.length ? L.map(cardH).join('') : empty('🔍', 'No products match your search.');
        };
        $('#grid').innerHTML = skel(8);
        setTimeout(run, 550);
        $('#chips').onclick = e => {
            if (e.target.dataset.c) {
                st.cat = e.target.dataset.c;
                run();
            }
        };
        $('#q').oninput = e => {
            st.q = e.target.value;
            run();
        };
        $('#sort').onchange = e => {
            st.sort = e.target.value;
            run();
        };
    }
});
