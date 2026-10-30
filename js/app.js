/* Mangga Market – shared core: storage, seed data, layout, validation, auth */
const K = {
    P: 'mg_products', O: 'mg_orders', U: 'mg_users', C: 'mg_cart', S: 'mg_session', D: 'mg_codes', X: 'mg_applied', R: 'mg_region'
};
const REGIONS = {
    'Metro Manila': 80, 'Luzon (outside NCR)': 120, 'Visayas': 150, 'Mindanao': 170
}; // local shipping fee config (₱)
const EXPRESS = 100, FREE_OVER = 3000;
const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
const CATS = {
    Fashion: '👕', Electronics: '🎧', Home: '🪴', Beauty: '🧴', Food: '🥭'
};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => {
    try {
        const v = JSON.parse(localStorage.getItem(k));
        return v == null ? d : v;
    }
    catch {
        return d;
    }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const peso = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const fdate = d => new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
});
const go = u => {
    document.body.classList.add('leaving');
    setTimeout(() => location.href = u, 200);
};
const getProducts = () => load(K.P, []), getProduct = id => getProducts().find(p => p.id == id);
const getOrders = () => load(K.O, []), users = () => load(K.U, []), me = () => users().find(u => u.id === load(K.S)) || null;
const price = p => p.sale || p.price;
const imgH = p => /^(https?:|data:|assets)/.test(p.img) ? `<img src="${esc(p.img)}" alt="${esc(p.name)}">` : esc(p.img);
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const cartCount = () => load(K.C, []).reduce((a, i) => a + i.qty, 0);
/* ---------- Seed data ---------- */
function seed() {
    if (load(K.P))
        return;
    const d = n => new Date(Date.now() - n * 864e5).toISOString();
    const P = [[1, 'Barong Tagalog Shirt', 'Lightweight piña-blend barong, hand-finished embroidery.', 'Fashion', '👔', 1899, 1499, 14, 4.8, 120, 40],
        [2, 'Wireless Earbuds Pro', 'Noise cancelling, 28-hour battery, USB-C charging case.', 'Electronics', '🎧', 2499, 1999, 25, 4.6, 210, 20],
        [3, 'Dried Mangoes 1kg', 'Cebu sun-ripened mangoes, no added preservatives.', 'Food', '🥭', 450, null, 80, 4.9, 530, 90],
        [4, 'Abaca Tote Bag', 'Handwoven abaca tote made by Bicol artisans.', 'Fashion', '👜', 650, null, 40, 4.5, 85, 5],
        [5, 'Smart Watch S2', 'Heart-rate, sleep tracking and GPS. 7-day battery.', 'Electronics', '⌚', 3299, 2799, 3, 4.4, 140, 60],
        [6, 'Scented Candle Set', 'Three soy candles: calamansi, sampaguita, coffee.', 'Home', '🕯️', 520, null, 30, 4.7, 95, 3],
        [7, 'Snake Plant', 'Low-maintenance air-purifying plant in a clay pot.', 'Home', '🪴', 380, 299, 22, 4.6, 160, 15],
        [8, 'Coconut Body Oil', 'Cold-pressed virgin coconut oil, 250ml.', 'Beauty', '🥥', 320, null, 50, 4.8, 300, 70],
        [9, 'Kapeng Barako 500g', 'Batangas ground coffee, bold and earthy.', 'Food', '☕', 390, null, 60, 4.9, 410, 120],
        [10, 'Rattan Lounge Chair', 'Handcrafted rattan with a solid wood frame.', 'Home', '🪑', 4200, 3600, 6, 4.7, 40, 2],
        [11, 'Sunscreen SPF50', 'Lightweight, reef-safe, no white cast. 100ml.', 'Beauty', '🧴', 450, 380, 0, 4.5, 270, 30],
        [12, 'Everyday Sneakers', 'Breathable knit upper with cushioned sole.', 'Fashion', '👟', 2800, null, 18, 4.5, 110, 1]]
        .map(([id, name, desc, cat, img, price, sale, stock, rating, sold, age]) => ({
        id, name, desc, cat, img, price, sale, stock, rating, sold, date: d(age)
    }));
    save(K.P, P);
    const U = [{
            id: 'u1', name: 'Admin', email: 'admin@mangga.ph', phone: '+639170000000', pass: 'admin123', role: 'admin', addresses: []
        },
        {
            id: 'u2', name: 'Juan Dela Cruz', email: 'juan@email.com', phone: '+639171234567', pass: 'juan123', role: 'customer', addresses: [{
                    label: 'Home', address: '123 Rizal St., Brgy. San Antonio', city: 'Quezon City', zip: '1105', region: 'Metro Manila'
                }]
        },
        {
            id: 'u3', name: 'Maria Santos', email: 'maria@email.com', phone: '+639189876543', pass: 'maria123', role: 'customer', addresses: [{
                    label: 'Home', address: '45 Mabini Ave., Brgy. Poblacion', city: 'Cebu City', zip: '6000', region: 'Visayas'
                }]
        }];
    save(K.U, U);
    save(K.D, [{
            code: 'WELCOME10', type: 'percent', value: 10, active: true
        }, {
            code: 'PISO50', type: 'fixed', value: 50, active: true
        }, {
            code: 'FREESHIP', type: 'ship', value: 0, active: true
        }]);
    const mk = (i, u, its, pay, st, ago) => {
        const items = its.map(([id, q]) => {
            const p = P.find(x => x.id === id);
            return {
                id, name: p.name, price: price(p), qty: q, img: p.img
            };
        });
        const sub = items.reduce((a, x) => a + x.price * x.qty, 0), shipFee = sub >= FREE_OVER ? 0 : REGIONS[u.addresses[0].region], a = u.addresses[0];
        const hist = [{ s: 'Pending', date: d(ago) }];
        if (st !== 'Pending')
            hist.push({ s: st, date: d(Math.max(ago - 2, 0)) });
        return {
            no: 'MK-' + d(ago).slice(2, 10).replace(/-/g, '') + '-' + (1000 + i), uid: u.id, name: u.name, email: u.email, phone: u.phone, address: a.address, city: a.city, zip: a.zip, region: a.region, method: 'Standard', pay, items, sub, discount: 0, code: '', shipFee, total: sub + shipFee, status: st, date: d(ago), history: hist
        };
    };
    save(K.O, [mk(1, U[1], [[3, 2], [9, 1]], 'Cash on Delivery', 'Delivered', 150), mk(2, U[2], [[2, 1]], 'GCash', 'Delivered', 110), mk(3, U[1], [[1, 1], [4, 1]], 'Bank Transfer', 'Delivered', 75),
        mk(4, U[2], [[7, 2], [6, 1]], 'Cash on Delivery', 'Shipped', 40), mk(5, U[1], [[5, 1]], 'Credit/Debit Card', 'Processing', 12), mk(6, U[2], [[8, 2], [12, 1]], 'GCash', 'Pending', 2)]);
}
/* ---------- UI helpers ---------- */
function toast(m, t = '') {
    const c = $('.toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toasts' }));
    const e = document.createElement('div');
    e.className = 'toast ' + t;
    e.textContent = m;
    c.append(e);
    setTimeout(() => {
        e.classList.add('out');
        setTimeout(() => e.remove(), 300);
    }, 2600);
}
function modal(html) {
    let m = $('#modal');
    if (!m) {
        m = document.createElement('div');
        m.id = 'modal';
        m.className = 'modal';
        m.onclick = e => {
            if (e.target === m || e.target.classList.contains('mx'))
                m.classList.remove('open');
        };
        document.body.append(m);
    }
    m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><button class="mx" aria-label="Close">×</button>${html}</div>`;
    m.classList.add('open');
    return m;
}
const closeModal = () => $('#modal')?.classList.remove('open');
document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
        closeModal();
});
function cardH(p) {
    const off = p.sale ? Math.round((1 - p.sale / p.price) * 100) : 0, nw = Date.now() - new Date(p.date) < 30 * 864e5;
    return `<article class="card">${off ? `<span class="badge">-${off}%</span>` : nw ? '<span class="badge n">New</span>' : ''}<div class="pimg" data-view="${p.id}">${imgH(p)}</div><div class="pb"><small>${esc(p.cat)}</small><h3 data-view="${p.id}">${esc(p.name)}</h3><div class="stars">${stars(p.rating)} <small>${p.rating}</small></div><div class="price">${peso(price(p))}${p.sale ? `<s>${peso(p.price)}</s>` : ''}</div><div class="stock ${p.stock <= 5 ? 'low' : ''}">${p.stock ? p.stock + ' in stock' : 'Out of stock'}</div><button class="btn" data-add="${p.id}" ${p.stock ? '' : 'disabled'}>${p.stock ? 'Add to cart' : 'Sold out'}</button></div></article>`;
}
const empty = (i, t) => `<div class="empty"><span>${i}</span>${t}</div>`;
/* ---------- Validation ---------- */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isPH = v => /^(\+63|0)9\d{9}$/.test(v.replace(/[\s-]/g, ''));
const normPH = v => {
    v = v.replace(/[\s-]/g, '');
    return v.startsWith('0') ? '+63' + v.slice(1) : v;
};
const VR = {
    req: v => v.trim() !== '', email: isEmail, phone: isPH, zip: v => /^\d{4}$/.test(v.trim()), min6: v => v.length >= 6, card: v => /^\d{16}$/.test(v.replace(/\s/g, '')), exp: v => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v), cvv: v => /^\d{3,4}$/.test(v), pos: v => +v > 0, int0: v => /^\d+$/.test(v)
};
const VM = {
    req: 'This field is required.', email: 'Enter a valid email address.', phone: 'Use +63 9XX XXX XXXX or 09XX XXX XXXX.', zip: 'Enter a 4-digit postal code.', min6: 'Use at least 6 characters.', card: 'Enter 16 digits.', exp: 'Use MM/YY.', cvv: 'Enter 3–4 digits.', pos: 'Enter an amount above 0.', int0: 'Enter a whole number, 0 or more.'
};
function check(form) {
    let ok = true;
    $$('[data-v]', form).forEach(el => {
        const g = el.closest('.fg');
        if (!g || el.closest('[hidden]'))
            return;
        g.classList.remove('err');
        $('.em', g)?.remove();
        const bad = el.dataset.v.split(' ').find(r => !VR[r](el.value));
        if (bad) {
            ok = false;
            g.classList.add('err');
            g.insertAdjacentHTML('beforeend', `<div class="em">${VM[bad]}</div>`);
        }
    });
    if (!ok)
        toast('Please fix the highlighted fields', 'error');
    return ok;
}
/* ---------- Auth & orders ---------- */
function guard(role) {
    const u = me();
    if (!u) {
        go('login.html?next=' + location.pathname.split('/').pop());
        return null;
    }
    if (role && u.role !== role) {
        toast('Admins only', 'error');
        go('index.html');
        return null;
    }
    return u;
}
function setStatus(no, s) {
    const O = getOrders(), o = O.find(x => x.no === no);
    if (!o || o.status === s)
        return;
    if (s === 'Cancelled') {
        const P = getProducts();
        o.items.forEach(i => {
            const p = P.find(x => x.id == i.id);
            if (p)
                p.stock += i.qty;
        });
        save(K.P, P);
    }
    o.status = s;
    o.history.push({ s, date: new Date().toISOString() });
    save(K.O, O);
}
function initAuth() {
    const pg = document.body.dataset.page, nx = new URLSearchParams(location.search).get('next');
    if (pg === 'login')
        $('#f').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            const u = users().find(x => x.email === $('#email').value.trim().toLowerCase() && x.pass === $('#pw').value);
            if (!u)
                return toast('Wrong email or password', 'error');
            save(K.S, u.id);
            toast('Welcome back, ' + u.name.split(' ')[0] + '!');
            setTimeout(() => go(u.role === 'admin' ? 'admin.html' : /^[\w-]+\.html$/.test(nx || '') ? nx : 'index.html'), 600);
        };
    if (pg === 'register')
        $('#f').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            const U = users(), em = $('#email').value.trim().toLowerCase();
            if (U.some(x => x.email === em))
                return toast('That email is already registered', 'error');
            if ($('#pw').value !== $('#pw2').value)
                return toast('Passwords do not match', 'error');
            const u = {
                id: 'u' + Date.now(), name: $('#name').value.trim(), email: em, phone: normPH($('#phone').value), pass: $('#pw').value, role: 'customer', addresses: []
            };
            U.push(u);
            save(K.U, U);
            save(K.S, u.id);
            toast('Account created!');
            setTimeout(() => go('index.html'), 600);
        };
}
/* ---------- Layout ---------- */
function layout() {
    const u = me(), pg = document.body.dataset.page, l = (h, t, k) => `<a href="${h}" class="${pg === k ? 'on' : ''}">${t}</a>`;
    $('#hdr').innerHTML = `<header class="top"><div class="wrap nav"><a class="logo" href="index.html"><i></i>Mangga</a><button class="burger" id="bg" aria-label="Menu">☰</button><nav class="links" id="lk">${l('index.html', 'Home', 'home')}${l('products.html', 'Shop', 'shop')}${u ? l('orders.html', 'My account', 'orders') : ''}${u && u.role === 'admin' ? l('admin.html', 'Admin', 'admin') : ''}${l('cart.html', 'Cart <span class="cnt" id="cc">' + cartCount() + '</span>', 'cart')}${u ? `<button class="lk" id="lo">Logout (${esc(u.name.split(' ')[0])})</button>` : l('login.html', 'Login', 'login') + l('register.html', 'Register', 'register')}</nav></div></header>`;
    $('#bg').onclick = () => $('#lk').classList.toggle('open');
    if ($('#lo'))
        $('#lo').onclick = () => {
            localStorage.removeItem(K.S);
            toast('Logged out');
            setTimeout(() => go('index.html'), 500);
        };
    if ($('#ftr'))
        $('#ftr').innerHTML = `<footer><div class="wrap"><div><h4>Mangga Market</h4><p>Filipino-made goods, delivered nationwide. Pay with GCash, bank transfer, card or cash on delivery.</p></div><div><h4>Shop</h4><a href="products.html">All products</a><a href="products.html?cat=Food">Food</a><a href="products.html?cat=Home">Home</a></div><div><h4>Contact</h4><a href="mailto:hello@mangga.ph">hello@mangga.ph</a><a href="tel:+639111111111">+63 911 111 1111</a><span> Dasmarinas City</span></div><div><h4>Follow us</h4><a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a><a href="https://tiktok.com" target="_blank" rel="noopener">TikTok</a></div></div><p class="copy">© 2026 Mangga Market. Demo store – no real payments are processed.</p></footer>`;
}
document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a && !a.target && /^[\w-]+\.html/.test(a.getAttribute('href')) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        go(a.getAttribute('href'));
    }
});
document.addEventListener('DOMContentLoaded', () => {
    seed();
    layout();
    initAuth();
});

/* ============================================================
   DEBUG HELPERS
   Open the browser console (F12) and type MG.help()
   Set DEBUG = true to show a toast for every uncaught error.
   ============================================================ */
const DEBUG = false;
window.MG = {
    help() {
        console.log('MG.dump()        – show products, orders, users, cart in tables\n' +
            'MG.reset()       – wipe all demo data and reload fresh sample data\n' +
            'MG.loginAs(email) – log in as any user without a password\n' +
            'MG.get(key)      – read one storage key, e.g. MG.get(K.O)');
    },
    dump() {
        console.table(getProducts());
        console.table(getOrders().map(o => ({ no: o.no, customer: o.name, status: o.status, total: o.total })));
        console.table(users().map(u => ({ id: u.id, email: u.email, role: u.role })));
        console.table(load(K.C, []));
    },
    reset() { localStorage.clear(); location.href = 'index.html'; },
    loginAs(email) {
        const u = users().find(x => x.email === email);
        if (!u) return console.warn('No such user');
        save(K.S, u.id);
        location.reload();
    },
    get: k => load(k)
};
window.addEventListener('error', e => {
    console.error('[Mangga]', e.message, e.filename + ':' + e.lineno);
    if (DEBUG) toast('JS error: ' + e.message, 'error');
});
