/* Customer account: orders, tracking, profile, addresses, settings */
const stepsOf = o => o.status === 'Cancelled' ? '' : `<div class="track">${STATUSES.map((s, i) => {
    const k = STATUSES.indexOf(o.status);
    return `<div class="${i < k || o.status === 'Delivered' ? 'done' : i === k ? 'cur' : ''}"><b>${i < k || o.status === 'Delivered' ? '✓' : i + 1}</b>${s}</div>`;
}).join('')}</div>`;
const stTag = s => `<span class="st ${s.split(' ')[0]}">${s}</span>`;
function orderDetail(o, admin) {
    return `<div class="box"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><h3>${o.no}</h3>${stTag(o.status)}</div><p class="sub">Placed ${fdate(o.date)} · ${esc(o.pay)} · ${esc(o.method)} shipping</p>${stepsOf(o)}
  <div class="tw"><table><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr>${o.items.map(i => `<tr><td>${esc(i.img)} ${esc(i.name)}</td><td>${peso(i.price)}</td><td>${i.qty}</td><td>${peso(i.price * i.qty)}</td></tr>`).join('')}</table></div>
  <div style="max-width:340px;margin:14px 0 0 auto">${Cart.summary({
        sub: o.sub, discount: o.discount, shipFee: o.shipFee, total: o.total, code: o.code
    })}</div>
  <p style="margin-top:14px"><b>Deliver to:</b> ${esc(o.name)}, ${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.city)} ${esc(o.zip)}, ${esc(o.region)}</p>
  <p class="sub" style="margin-top:10px">${o.history.map(h => `${h.s} – ${fdate(h.date)}`).join(' → ')}</p></div>`;
}
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'orders')
        return;
    const u = guard();
    if (!u)
        return;
    const qs = new URLSearchParams(location.search), el = $('#acct'), no = qs.get('o');
    if (no) {
        const o = getOrders().find(x => x.no === no && (x.uid === u.id || u.role === 'admin'));
        if (!o) {
            el.innerHTML = empty('📭', 'Order not found.<br><br><a class="btn" href="orders.html">Back to orders</a>');
            return;
        }
        el.innerHTML = (qs.get('new') ? `<div class="box" style="background:#d6f5e3;border-color:#9bdcb8"><h3>🎉 Thank you, ${esc(o.name.split(' ')[0])}! Your order is confirmed.</h3><p>${o.pay === 'GCash' ? 'Send payment to GCash 0917 123 4567 and use your order number as reference.' : o.pay === 'Bank Transfer' ? 'Transfer to Mangga Market · BDO 0012-3456-7890 and use your order number as reference.' : o.pay === 'Cash on Delivery' ? 'Please prepare the exact amount for the rider.' : 'Card payment is demo only – no charge was made.'}</p></div>` : '') + orderDetail(o) +
            (['Pending', 'Confirmed'].includes(o.status) ? '<button class="btn d" id="cx">Cancel order</button> ' : '') + '<a class="btn alt" href="orders.html">All orders</a>';
        if ($('#cx'))
            $('#cx').onclick = () => {
                if (confirm('Cancel this order? This cannot be undone.')) {
                    setStatus(o.no, 'Cancelled');
                    toast('Order cancelled');
                    setTimeout(() => location.reload(), 500);
                }
            };
        return;
    }
    const t = qs.get('t') || 'orders', tabs = [['orders', 'Order history'], ['profile', 'Profile'], ['addr', 'Saved addresses'], ['set', 'Settings']];
    const head = `<div class="tabs">${tabs.map(([k, n]) => `<a class="chip ${k === t ? 'on' : ''}" href="orders.html?t=${k}">${n}</a>`).join('')}</div>`;
    const U = users(), me2 = U.find(x => x.id === u.id), persist = () => save(K.U, U);
    if (t === 'orders') {
        const O = getOrders().filter(o => o.uid === u.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        el.innerHTML = head + (O.length ? O.map(o => `<div class="box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><b>${o.no}</b><br><small>${fdate(o.date)} · ${o.items.reduce((a, i) => a + i.qty, 0)} item(s)</small></div>${stTag(o.status)}<b>${peso(o.total)}</b><a class="btn sm alt" href="orders.html?o=${o.no}">View & track</a></div>`).join('') : empty('📦', 'No orders yet.<br><br><a class="btn" href="products.html">Browse products</a>'));
    }
    if (t === 'profile') {
        el.innerHTML = head + `<form class="box" id="pf" novalidate style="max-width:520px"><h3>Profile</h3><div class="fg"><label>Full name</label><input id="n" data-v="req" value="${esc(me2.name)}"></div><div class="fg"><label>Email</label><input value="${esc(me2.email)}" disabled></div><div class="fg"><label>Mobile (+63)</label><input id="p" data-v="phone" value="${esc(me2.phone)}"></div><button class="btn">Save changes</button></form>`;
        $('#pf').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            me2.name = $('#n').value.trim();
            me2.phone = normPH($('#p').value);
            persist();
            toast('Profile saved');
        };
    }
    if (t === 'addr') {
        el.innerHTML = head + `<div class="box"><h3>Saved addresses</h3>${me2.addresses.length ? me2.addresses.map((a, i) => `<div class="ci" style="grid-template-columns:1fr auto"><div><b>${esc(a.label)}</b><br>${esc(a.address)}, ${esc(a.city)} ${esc(a.zip)}, ${esc(a.region)}</div><button class="btn sm d" data-del="${i}">Delete</button></div>`).join('') : '<p class="sub">No saved addresses yet.</p>'}</div>
    <form class="box" id="af" novalidate style="max-width:520px"><h3>Add address</h3><div class="fg"><label>Label</label><input id="l" data-v="req" placeholder="Home, Office…"></div><div class="fg"><label>Street, barangay</label><input id="a" data-v="req"></div><div class="row2"><div class="fg"><label>City</label><input id="c" data-v="req"></div><div class="fg"><label>Postal code</label><input id="z" data-v="zip" inputmode="numeric"></div></div><div class="fg"><label>Region</label><select id="r">${Object.keys(REGIONS).map(r => `<option>${r}</option>`).join('')}</select></div><button class="btn">Save address</button></form>`;
        el.onclick = e => {
            const d = e.target.dataset.del;
            if (d !== undefined && confirm('Delete this address?')) {
                me2.addresses.splice(d, 1);
                persist();
                toast('Address deleted');
                setTimeout(() => location.reload(), 400);
            }
        };
        $('#af').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            me2.addresses.push({
                label: $('#l').value.trim(), address: $('#a').value.trim(), city: $('#c').value.trim(), zip: $('#z').value.trim(), region: $('#r').value
            });
            persist();
            toast('Address saved');
            setTimeout(() => location.reload(), 400);
        };
    }
    if (t === 'set') {
        el.innerHTML = head + `<form class="box" id="sf" novalidate style="max-width:520px"><h3>Change password</h3><div class="fg"><label>Current password</label><input type="password" id="o" data-v="req"></div><div class="fg"><label>New password</label><input type="password" id="n" data-v="min6"></div><button class="btn">Update password</button></form>`;
        $('#sf').onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            if ($('#o').value !== me2.pass)
                return toast('Current password is incorrect', 'error');
            me2.pass = $('#n').value;
            persist();
            e.target.reset();
            toast('Password updated');
        };
    }
});
