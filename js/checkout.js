/* Checkout & order placement */
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'checkout')
        return;
    const u = guard();
    if (!u)
        return;
    if (!Cart.lines().length) {
        toast('Your cart is empty', 'error');
        return go('cart.html');
    }
    const f = $('#f');
    $('#region').innerHTML = Object.keys(REGIONS).map(r => `<option>${r}</option>`).join('');
    $('#region').value = load(K.R, 'Metro Manila');
    $('#name').value = u.name;
    $('#email').value = u.email;
    $('#phone').value = u.phone;
    if (u.addresses.length) {
        $('#saved').hidden = false;
        $('#saved select').innerHTML = '<option value="">Use a saved address…</option>' + u.addresses.map((a, i) => `<option value="${i}">${esc(a.label)} – ${esc(a.address)}, ${esc(a.city)}</option>`).join('');
        $('#saved select').onchange = e => {
            const a = u.addresses[e.target.value];
            if (!a)
                return;
            $('#addr').value = a.address;
            $('#city').value = a.city;
            $('#zip').value = a.zip;
            $('#region').value = a.region;
            sum();
        };
    }
    const val = n => $$(`[name=${n}]`, f).find(r => r.checked).value;
    const sum = () => {
        const t = Cart.totals($('#region').value, val('ship'));
        save(K.R, $('#region').value);
        $('#sum').innerHTML = Cart.lines().map(l => `<div class="tr"><span>${l.qty}× ${esc(l.p.name)}</span><span>${peso(price(l.p) * l.qty)}</span></div>`).join('') + '<hr style="margin:10px 0;border:0;border-top:1px solid var(--line)">' + Cart.summary(t);
    };
    const pay = () => {
        const p = val('pay');
        $('#card').hidden = p !== 'Credit/Debit Card';
        $('#gc').hidden = p !== 'GCash';
        $('#bk').hidden = p !== 'Bank Transfer';
    };
    f.onchange = () => {
        sum();
        pay();
    };
    sum();
    pay();
    f.onsubmit = e => {
        e.preventDefault();
        if (!check(f))
            return;
        const P = getProducts(), L = Cart.lines();
        for (const l of L) {
            const p = P.find(x => x.id == l.id);
            if (!p || l.qty > p.stock)
                return toast(`${l.p.name}: only ${p ? p.stock : 0} left in stock`, 'error');
        }
        const t = Cart.totals($('#region').value, val('ship')), now = new Date().toISOString(), O = getOrders();
        let no;
        do {
            no = 'MK-' + now.slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        } while (O.some(o => o.no === no));
        const order = {
            no, uid: u.id, name: $('#name').value.trim(), email: $('#email').value.trim(), phone: normPH($('#phone').value), address: $('#addr').value.trim(), city: $('#city').value.trim(), zip: $('#zip').value.trim(), region: $('#region').value, method: val('ship'), pay: val('pay'),
            items: L.map(l => ({
                id: l.id, name: l.p.name, price: price(l.p), qty: l.qty, img: l.p.img
            })), sub: t.sub, discount: t.discount, code: t.code, shipFee: t.shipFee, total: t.total, status: 'Pending', date: now, history: [{ s: 'Pending', date: now }]
        };
        L.forEach(l => {
            const p = P.find(x => x.id == l.id);
            p.stock -= l.qty;
            p.sold += l.qty;
        });
        save(K.P, P);
        O.push(order);
        save(K.O, O);
        if ($('#sv').checked) {
            const U = users(), me2 = U.find(x => x.id === u.id);
            me2.addresses.push({
                label: 'Saved ' + (me2.addresses.length + 1), address: order.address, city: order.city, zip: order.zip, region: order.region
            });
            save(K.U, U);
        }
        Cart.set([]);
        localStorage.removeItem(K.X);
        toast('Order placed!');
        setTimeout(() => go(`orders.html?o=${no}&new=1`), 700);
    };
});
