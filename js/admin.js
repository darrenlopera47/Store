/* Admin dashboard: analytics, products, inventory, orders, customers, discounts */
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'admin')
        return;
    if (!guard('admin'))
        return;
    const el = $('#main'), TABS = [['dash', 'Dashboard'], ['prod', 'Products & inventory'], ['ord', 'Orders'], ['cust', 'Customers'], ['disc', 'Discounts']];
    let tab = location.hash.slice(1) || 'dash';
    const live = () => getOrders().filter(o => o.status !== 'Cancelled');
    const nav = () => `<div class="tabs">${TABS.map(([k, n]) => `<button class="chip ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    const V = {
        dash() {
            const O = live(), rev = O.reduce((a, o) => a + o.total, 0), m = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const k = d.getFullYear() + '-' + d.getMonth();
                m.push({ l: d.toLocaleString('en', { month: 'short' }), v: O.filter(o => {
                        const x = new Date(o.date);
                        return x.getFullYear() + '-' + x.getMonth() === k;
                    }).reduce((a, o) => a + o.total, 0) });
            }
            const mx = Math.max(...m.map(x => x.v), 1), top = [...getProducts()].sort((a, b) => b.sold - a.sold).slice(0, 5), st = {};
            getOrders().forEach(o => st[o.status] = (st[o.status] || 0) + 1);
            return `<div class="stats"><div class="stat"><b>${peso(rev)}</b><span>Total revenue</span></div><div class="stat"><b>${getOrders().length}</b><span>Total orders</span></div><div class="stat"><b>${users().filter(u => u.role === 'customer').length}</b><span>Customers</span></div><div class="stat"><b>${getProducts().length}</b><span>Products</span></div></div>
    <div class="lay"><div class="box"><h3>Sales – last 6 months</h3><div class="bars">${m.map(x => `<div><em>${x.v ? '₱' + Math.round(x.v).toLocaleString() : ''}</em><i style="height:${Math.round(x.v / mx * 150)}px"></i>${x.l}</div>`).join('')}</div></div>
    <div class="box"><h3>Best sellers</h3>${top.map(p => `<div class="tr"><span>${esc(p.img)} ${esc(p.name)}</span><b>${p.sold}</b></div>`).join('')}<h3 style="margin-top:18px">Orders by status</h3>${Object.entries(st).map(([s, n]) => `<div class="tr">${stTag(s)}<b>${n}</b></div>`).join('')}</div></div>
    <div class="box"><h3>Recent orders</h3>${V.otable([...getOrders()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), false)}</div>`;
        },
        otable(L, edit) {
            return `<div class="tw"><table><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>${edit ? '<th>Actions</th>' : ''}</tr>${L.map(o => `<tr><td>${o.no}</td><td>${esc(o.name)}</td><td>${fdate(o.date)}</td><td>${peso(o.total)}</td><td>${edit && o.status !== 'Cancelled' ? `<select data-st="${o.no}">${[...STATUSES, 'Cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>` : stTag(o.status)}</td>${edit ? `<td><button class="btn sm alt" data-vo="${o.no}">View</button></td>` : ''}</tr>`).join('')}</table></div>`;
        },
        prod() {
            return `<div class="box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0">Products</h3><button class="btn sm" data-pf="">+ Add product</button></div><div class="tw"><table><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Sale</th><th>Stock</th><th>Actions</th></tr>${getProducts().map(p => `<tr><td>${imgH(p).replace('<img', '<img width=32')}</td><td>${esc(p.name)}</td><td>${p.cat}</td><td>${peso(p.price)}</td><td>${p.sale ? peso(p.sale) : '—'}</td><td><input type="number" min="0" value="${p.stock}" data-stock="${p.id}" style="width:80px" aria-label="Stock"></td><td><button class="btn sm alt" data-pf="${p.id}">Edit</button> <button class="btn sm d" data-pd="${p.id}">Delete</button></td></tr>`).join('')}</table></div></div>`;
        },
        ord() {
            return `<div class="box"><h3>All orders</h3>${V.otable([...getOrders()].sort((a, b) => new Date(b.date) - new Date(a.date)), true)}</div>`;
        },
        cust() {
            const O = live();
            return `<div class="box"><h3>Customers</h3><div class="tw"><table><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Orders</th><th>Total spent</th></tr>${users().filter(u => u.role === 'customer').map(u => {
                const mine = O.filter(o => o.uid === u.id);
                return `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${mine.length}</td><td>${peso(mine.reduce((a, o) => a + o.total, 0))}</td></tr>`;
            }).join('')}</table></div></div>`;
        },
        disc() {
            return `<div class="box"><h3>Discount codes</h3><div class="tw"><table><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr>${load(K.D, []).map(d => `<tr><td><b>${d.code}</b></td><td>${{
                percent: 'Percent off', fixed: 'Fixed ₱ off', ship: 'Free shipping'
            }[d.type]}</td><td>${d.type === 'percent' ? d.value + '%' : d.type === 'fixed' ? peso(d.value) : '—'}</td><td>${d.active ? 'Active' : 'Paused'}</td><td><button class="btn sm alt" data-dt="${d.code}">${d.active ? 'Pause' : 'Activate'}</button> <button class="btn sm d" data-dd="${d.code}">Delete</button></td></tr>`).join('')}</table></div></div>
    <form class="box" id="df" novalidate style="max-width:520px"><h3>New code</h3><div class="fg"><label>Code</label><input id="dc" data-v="req" placeholder="SUMMER15"></div><div class="row2"><div class="fg"><label>Type</label><select id="dy"><option value="percent">Percent off</option><option value="fixed">Fixed ₱ off</option><option value="ship">Free shipping</option></select></div><div class="fg"><label>Value</label><input id="dv" type="number" min="0" value="10"></div></div><button class="btn">Add code</button><p class="sub" style="margin-top:10px">Tip: set a sale price on any product to run a promotion.</p></form>`;
        }
    };
    const draw = () => {
        el.innerHTML = nav() + V[tab]();
        const f = $('#df');
        if (f)
            f.onsubmit = e => {
                e.preventDefault();
                if (!check(f))
                    return;
                const D = load(K.D, []), c = $('#dc').value.trim().toUpperCase(), t = $('#dy').value, v = +$('#dv').value;
                if (D.some(d => d.code === c))
                    return toast('Code already exists', 'error');
                if (t !== 'ship' && (!(v > 0) || (t === 'percent' && v > 100)))
                    return toast('Enter a valid value (percent max 100)', 'error');
                D.push({
                    code: c, type: t, value: t === 'ship' ? 0 : v, active: true
                });
                save(K.D, D);
                toast('Code added');
                draw();
            };
    };
    const pform = id => {
        const p = id ? getProduct(id) : {
            name: '', desc: '', cat: 'Food', price: '', sale: '', stock: '', img: '📦'
        };
        const m = modal(`<h2 style="margin-bottom:14px">${id ? 'Edit' : 'Add'} product</h2><form id="pf" novalidate><div class="fg"><label>Name</label><input id="pn" data-v="req" value="${esc(p.name)}"></div><div class="fg"><label>Description</label><textarea id="pd" rows="2" data-v="req" style="font:inherit">${esc(p.desc)}</textarea></div><div class="row2"><div class="fg"><label>Category</label><select id="pc">${Object.keys(CATS).map(c => `<option ${c === p.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="fg"><label>Image (emoji or image URL)</label><input id="pi" data-v="req" value="${esc(p.img)}"></div></div><div class="row2"><div class="fg"><label>Price (₱)</label><input id="pp" type="number" step="0.01" data-v="pos" value="${p.price}"></div><div class="fg"><label>Sale price (optional)</label><input id="ps" type="number" step="0.01" value="${p.sale || ''}"></div></div><div class="fg"><label>Stock</label><input id="pk" type="number" data-v="int0" value="${p.stock}"></div><button class="btn full">Save product</button></form>`);
        $('#pf', m).onsubmit = e => {
            e.preventDefault();
            if (!check(e.target))
                return;
            const pr = +$('#pp').value, sl = $('#ps').value ? +$('#ps').value : null;
            if (sl !== null && (sl <= 0 || sl >= pr))
                return toast('Sale price must be lower than the regular price', 'error');
            const P = getProducts(), o = {
                name: $('#pn').value.trim(), desc: $('#pd').value.trim(), cat: $('#pc').value, img: $('#pi').value.trim(), price: pr, sale: sl, stock: +$('#pk').value
            };
            if (id)
                Object.assign(P.find(x => x.id == id), o);
            else
                P.push({
                    id: Math.max(0, ...P.map(x => x.id)) + 1, rating: 4.5, sold: 0, date: new Date().toISOString(), ...o
                });
            save(K.P, P);
            closeModal();
            toast(id ? 'Product updated' : 'Product added');
            draw();
        };
    };
    el.onclick = e => {
        const d = e.target.dataset;
        if (d.t) {
            tab = d.t;
            location.hash = tab;
            draw();
        }
        if (d.pf !== undefined)
            pform(d.pf);
        if (d.pd && confirm('Delete this product permanently?')) {
            save(K.P, getProducts().filter(p => p.id != d.pd));
            toast('Product deleted');
            draw();
        }
        if (d.vo)
            modal(orderDetail(getOrders().find(o => o.no === d.vo)));
        if (d.dt) {
            const D = load(K.D, []), x = D.find(c => c.code === d.dt);
            x.active = !x.active;
            save(K.D, D);
            draw();
        }
        if (d.dd && confirm('Delete this discount code?')) {
            save(K.D, load(K.D, []).filter(c => c.code !== d.dd));
            draw();
        }
    };
    el.onchange = e => {
        const d = e.target.dataset;
        if (d.stock) {
            const v = e.target.value;
            if (!VR.int0(v))
                return toast('Stock must be a whole number', 'error');
            const P = getProducts();
            P.find(p => p.id == d.stock).stock = +v;
            save(K.P, P);
            toast('Stock updated');
        }
        if (d.st) {
            if (e.target.value === 'Cancelled' && !confirm('Cancel this order? Stock will be returned.')) {
                return draw();
            }
            setStatus(d.st, e.target.value);
            toast('Order status updated');
            draw();
        }
    };
    draw();
});
