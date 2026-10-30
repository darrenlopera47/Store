/* Cart logic (localStorage) + cart page */
const Cart = {
    get: () => load(K.C, []),
    set(c) {
        save(K.C, c);
        Cart.badge();
    },
    badge() {
        const e = $('#cc');
        if (e)
            e.textContent = cartCount();
    },
    add(id, q = 1) {
        const p = getProduct(id);
        if (!p || !p.stock)
            return toast('This item is out of stock', 'error'), false;
        const c = Cart.get(), i = c.find(x => x.id == id), n = (i ? i.qty : 0) + q;
        if (n > p.stock)
            return toast(`Only ${p.stock} available – you already have ${i ? i.qty : 0} in your cart`, 'error'), false;
        i ? i.qty = n : c.push({ id: p.id, qty: q });
        Cart.set(c);
        toast(`${p.name} added to cart`);
        return true;
    },
    setQty(id, q) {
        const p = getProduct(id), c = Cart.get(), i = c.find(x => x.id == id);
        if (!i)
            return;
        if (q < 1)
            return Cart.remove(id);
        if (q > p.stock)
            return toast(`Only ${p.stock} in stock`, 'error');
        i.qty = q;
        Cart.set(c);
    },
    remove(id) {
        Cart.set(Cart.get().filter(i => i.id != id));
    },
    lines: () => Cart.get().map(i => ({ ...i, p: getProduct(i.id) })).filter(l => l.p),
    code() {
        const c = load(K.X);
        return c && load(K.D, []).find(d => d.active && d.code === c) || null;
    },
    apply(v) {
        const d = load(K.D, []).find(x => x.active && x.code === v.trim().toUpperCase());
        if (!d)
            return toast('Invalid or expired discount code', 'error'), false;
        save(K.X, d.code);
        toast(`Code ${d.code} applied`);
        return true;
    },
    totals(region = load(K.R, 'Metro Manila'), method = 'Standard') {
        const sub = Cart.lines().reduce((a, l) => a + price(l.p) * l.qty, 0), d = Cart.code();
        let discount = 0;
        if (d && d.type === 'percent')
            discount = +(sub * d.value / 100).toFixed(2);
        if (d && d.type === 'fixed')
            discount = Math.min(d.value, sub);
        let shipFee = !sub || sub >= FREE_OVER || (d && d.type === 'ship') ? 0 : REGIONS[region] || 80;
        if (sub && method === 'Express')
            shipFee += EXPRESS;
        return {
            sub, discount, shipFee, total: sub - discount + shipFee, code: d ? d.code : ''
        };
    },
    summary(t) {
        return `<div class="tr"><span>Subtotal</span><span>${peso(t.sub)}</span></div>${t.discount ? `<div class="tr" style="color:var(--ok)"><span>Discount (${t.code})</span><span>-${peso(t.discount)}</span></div>` : ''}<div class="tr"><span>Shipping</span><span>${t.shipFee ? peso(t.shipFee) : 'Free'}</span></div><div class="tr t"><span>Total</span><span>${peso(t.total)}</span></div>`;
    }
};
function renderCart() {
    const el = $('#cart');
    Cart.set(Cart.get().filter(i => getProduct(i.id)).map(i => ({ ...i, qty: Math.min(i.qty, getProduct(i.id).stock) })).filter(i => i.qty > 0));
    const L = Cart.lines();
    if (!L.length) {
        el.innerHTML = empty('🛒', 'Your cart is empty. <br><br><a class="btn" href="products.html">Start shopping</a>');
        return;
    }
    const region = load(K.R, 'Metro Manila'), t = Cart.totals(region);
    el.innerHTML = `<div class="lay"><div class="box">${L.map(l => `<div class="ci"><div class="pimg">${imgH(l.p)}</div><div><b>${esc(l.p.name)}</b><div class="price">${peso(price(l.p))}</div><small>${l.p.stock} available</small></div><div><div class="qty"><button data-q="${l.id}:-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="${l.id}:1" aria-label="Increase">+</button></div> <button class="btn sm d" data-rm="${l.id}">Remove</button></div></div>`).join('')}</div>
  <div class="box"><h3>Order summary</h3><div class="fg"><label>Ship to</label><select id="reg">${Object.keys(REGIONS).map(r => `<option ${r === region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
  <div class="fg"><label>Discount code</label><div style="display:flex;gap:8px"><input id="code" placeholder="e.g. WELCOME10" value="${esc(t.code)}"><button class="btn alt" id="ap">Apply</button></div></div>${Cart.summary(t)}<p class="sub" style="margin:8px 0">Free shipping on orders ₱${FREE_OVER.toLocaleString()}+</p><a class="btn m full" href="checkout.html">Proceed to checkout</a></div></div>`;
}
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'cart')
        return;
    renderCart();
    const el = $('#cart');
    el.onclick = e => {
        const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
        if (q) {
            const [id, d] = q.dataset.q.split(':');
            Cart.setQty(id, Cart.get().find(i => i.id == id).qty + +d);
            renderCart();
        }
        if (r && confirm('Remove this item from your cart?')) {
            Cart.remove(r.dataset.rm);
            renderCart();
        }
        if (e.target.id === 'ap') {
            if (!$('#code').value.trim())
                return toast('Enter a discount code', 'error');
            Cart.apply($('#code').value);
            renderCart();
        }
    };
    el.onchange = e => {
        if (e.target.id === 'reg') {
            save(K.R, e.target.value);
            renderCart();
        }
    };
});
