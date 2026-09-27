/* productTabLoader.js
   โหลดข้อมูล Tab จาก API โดยใช้ stkcode
   รองรับทั้ง mobile drawer (#dp-*) และ desktop modal (#mdp-*)
   Load order: truscripts.js -> productSearch.js -> productTabLoader.js*/

// const TAB_API_URLS = {
//     count: '/Product/GetTabItemCountProduct',
//     description: '/Product/GetTabDescription',
//     spec: '/Product/GetTabSpec',
//     image: '/Product/GetTabImage',
//     oem: '/Product/GetTabOem',
//     competitor: '/Product/GetTabCompetitor',
//     linkage: '/Product/GetTabLinkage'
// };

/* Cache: key = "stkcode::tabName" */
const _tabCache = {};

async function _fetchTabApi(stkcode, apiTabName) {
    const key = `${stkcode}::${apiTabName}`;
    if (_tabCache[key] !== undefined) return _tabCache[key];

    try {
        const url = TAB_API_URLS[apiTabName];
        const res = await fetch(`${url}?stkcode=${encodeURIComponent(stkcode)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        _tabCache[key] = json;
        return json;
    } catch (ex) {
        console.error(`[TabLoader] ${apiTabName} failed (${stkcode}):`, ex);
        _tabCache[key] = null;
        return null;
    }
}

/* TAB ID -> API NAME MAP */
const TAB_API_MAP = {
    desc: 'description',
    spec: 'spec',
    imgs: 'image',
    oem: 'oem',
    comp: 'competitor',
    veh: 'linkage'
};

/* PANE SELECTOR
   mode = 'drawer' -> #dp-{tabId}
   mode = 'modal'  -> #mdp-{tabId}
   mode = 'inline' -> #itab-{tabId}-{pid} (truscripts modal) */
function _getPaneEl(tabId, mode, pid) {
    if (mode === 'drawer') return document.getElementById('dp-' + tabId);
    if (mode === 'modal') return document.getElementById('mdp-' + tabId);
    if (mode === 'inline') return document.getElementById(`itab-${tabId}-${pid}`);
    return null;
}

/* LOADING / ERROR STATE */
function _setLoading(el) {
    if (!el) return;
    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    padding:32px;gap:10px;color:var(--text-3);font-size:13px">
            <span class="spinner-border spinner-border-sm" role="status"
                  style="width:16px;height:16px;border-width:2px"></span>
            Loading...
        </div>`;
}

function _setError(el, msg) {
    if (!el) return;
    el.innerHTML = `
        <div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">
            <i class="bi bi-exclamation-circle" style="font-size:1.4rem;display:block;margin-bottom:8px"></i>
            ${msg || 'Failed to load data.'}
        </div>`;
}

/* =========================GENERIC DATA HELPERS======================================== */
function _pick(row, ...keys) {
    if (!row || typeof row !== 'object') return undefined;
    const lower = {};
    Object.keys(row).forEach(k => { lower[k.toLowerCase()] = row[k]; });
    for (const k of keys) {
        const v = lower[k.toLowerCase()];
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
}

function _getRows(apiResponse) {
    let d = apiResponse?.Data ?? apiResponse?.data ?? apiResponse;
    if (d && !Array.isArray(d)) {
        d = d.result ?? d.Result ?? d.items ?? d.Items ?? d;
    }
    if (!d) return [];
    return Array.isArray(d) ? d : [d];
}

function _sortBy(rows, ...seqKeys) {
    return [...rows].sort((a, b) => (Number(_pick(a, ...seqKeys)) || 0) - (Number(_pick(b, ...seqKeys)) || 0));
}

/* ======================RENDER HELPERS API ทุกตัว (ยกเว้น count) คืน Data เป็น "array" ของแถวเสมอ =========================== */

// ResultProductTabDescription: stkcode, seqDescription, title, description
function _renderDesc(el, data) {
    const rows = _getRows(data);
    if (!rows.length) { _setError(el, 'No description available.'); return; }

    const sorted = _sortBy(rows, 'seqDescription', 'seq');

    const cards = sorted.map(d => {
        const title = _pick(d, 'title') ?? '—';
        const desc = _pick(d, 'description') ?? '—';
        return `
        <div class="col-6 col-sm-3">
            <div style="background:var(--surface-2);border-radius:var(--r);padding:10px;
                        text-align:center;border:1px solid var(--border)">
                <div style="font-size:10px;color:var(--text-3);font-weight:600;
                            text-transform:uppercase;letter-spacing:.5px">${title}</div>
                <div style="font-size:12.5px;font-weight:700;color:var(--text);margin-top:3px">${desc}</div>
            </div>
        </div>`;
    }).join('');

    el.innerHTML = `<div class="row g-2">${cards}</div>`;
}

// ResultProductTabSpec: stkcode, seqSpec, title, description
function _renderSpec(el, data) {
    const rows = _getRows(data);
    if (!rows.length) { _setError(el, 'No specification available.'); return; }

    const sorted = _sortBy(rows, 'seqSpec', 'seq');
    const trs = sorted.map(r => {
        const label = _pick(r, 'title', 'specName', 'label', 'name') ?? '—';
        let value = _pick(r, 'description', 'specValue', 'value') ?? '—';

        if (label === 'SVHC' && typeof value === 'string' && value.startsWith('ไม่มี')) {
            value = 'ไม่พบข้อมูล กรุณาติดต่อพนักงานขาย';
        }

        return `<tr><td>${label}</td><td>${value}</td></tr>`;
    }).join('');
    el.innerHTML = `<table class="spec-table">${trs}</table>`;
}

// ResultProductTabImageList: stkcode, seqImage, imagePath
function _renderImage(pane, data) {
    const rows = _getRows(data);
    if (!rows.length) {
        pane.innerHTML = `
            <div class="img-grid">
                <div class="img-ph"><i class="bi bi-image"></i><span>No image available.</span></div>
            </div>`;
        return;
    }

    const sorted = _sortBy(rows, 'seqImage', 'seq');
    const srcs = sorted.map(img => _pick(img, 'imagePath', 'url', 'filename') ?? '');

    const items = srcs.map((src, idx) => `
        <div class="img-ph img-clickable" data-idx="${idx}"
             style="padding:0;overflow:hidden;position:relative;
             background:var(--surface-2);cursor:zoom-in">
            <img src="${src}" alt=""
                 style="width:100%;height:100%;object-fit:contain;pointer-events:none"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:100%;align-items:center;
                        justify-content:center;font-size:28px;color:var(--text-3);pointer-events:none">
                <i class="bi bi-image"></i>
            </div>
            <div style="position:absolute;bottom:4px;right:4px;
                        background:rgba(0,0,0,.35);border-radius:4px;
                        padding:2px 5px;font-size:10px;color:#fff;pointer-events:none">
                <i class="bi bi-zoom-in"></i>
            </div>
        </div>`
    ).join('');

    pane.innerHTML = `<div class="img-grid">${items}</div>`;

    // ✅ ผูก event บน pane โดยใช้ event delegation
    pane.querySelectorAll('.img-clickable').forEach(div => {
        div.addEventListener('click', function (e) {
            e.stopPropagation();        // ✅ กัน bubble ขึ้น modal backdrop
            e.stopImmediatePropagation(); // ✅ กัน listener อื่นใน element เดียวกัน
            e.preventDefault();

            const idx = parseInt(this.dataset.idx);
            if (isNaN(idx) || !srcs[idx]) return;

            // ✅ delay เล็กน้อยเพื่อให้ event chain จบก่อน
            setTimeout(() => {
                _imgLightbox(idx, srcs);
            }, 10);
        });
    });
}
// ResultProductTabOemList: stkcode, seqOem, oem
function _renderOem(el, data) {
    const rows = _getRows(data);
    if (!rows.length) { _setError(el, 'No OEM available.'); return; }

    const sorted = _sortBy(rows, 'seqOem', 'seq');
    const chips = sorted.map(o => {
        const num = _pick(o, 'oem', 'oemNumber', 'number') ?? '—';
        return `
        <span class="oem-chip oem-a">
            <i class="bi bi-upc-scan"></i> ${num}
        </span>`;
    }).join('');

    el.innerHTML = `
        <p style="font-size:12px;color:var(--text-3);margin-bottom:10px">OEM cross-reference numbers:</p>
        <div class="oem-chips">${chips}</div>`;
}

// ResultProductTabCompetitorList: stkcode, seqCompetitor, competitor
function _renderCompetitor(el, data) {
    const rows = _getRows(data);
    if (!rows.length) { _setError(el, 'No competitor available.'); return; }

    const sorted = _sortBy(rows, 'seqCompetitor', 'seq');
    const trs = sorted.map(r => {
        const partNo = r.partNo ?? '-';
        const brandName = r.brandName ?? '-';

        return `
        <tr>
            <td>${partNo}</td>
            <td>${brandName}</td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <table class="spec-table">
            <thead>
                <tr style="border-bottom:1.5px solid var(--border)">
                    <td style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text)">Competitor</td>
                </tr>
            </thead>
            ${trs}
        </table>`;
}

// ResultProductTabLinkageList: stkcode, seqLinkage, kType, productId, truType,maker, model, body, engine, driveType, yearFrom, yearTo
function _renderLinkage(el, data) {
    const rows = _getRows(data);
    if (!rows.length) { _setError(el, 'No compatible vehicle data found.'); return; }

    const sorted = _sortBy(rows, 'seqLinkage', 'seq');

    const seen = new Set();
    const unique = sorted.filter(v => {
        const key = `${_pick(v, 'maker', 'makerName')}|${_pick(v, 'model', 'modelName')}`;
        console.log('key:', key); // ดูว่า key ออกมาเป็นอะไร
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log('unique count:', unique.length);

    const items = unique.map(v => {
        const maker = _pick(v, 'maker', 'makerName') ?? '';
        const model = _pick(v, 'model', 'modelName') ?? '';
        const body = _pick(v, 'body', 'bodyName') ?? '';
        const engine = _pick(v, 'engine', 'engineType') ?? '';
        const driveType = _pick(v, 'driveType') ?? '';
        const yearFrom = _pick(v, 'yearFrom');
        const yearTo = _pick(v, 'yearTo');
        const year = yearFrom ? `${yearFrom}${yearTo ? '-' + yearTo : ''}` : '';
        const detail = [body, engine, year, driveType].filter(Boolean).join(' - ');
        return `
            <div class="veh-item">
                <i class="bi bi-car-front-fill"></i>
                <div>
                    <strong>${maker} ${model}</strong>
                    ${detail ? `<div style="font-size:11px;color:var(--text-3);margin-top:1px">${detail}</div>` : ''}
                </div>
            </div>`;
    }).join('');

    el.innerHTML = `<div class="veh-list">${items}</div>`;
}

/* renderer map */
const _RENDERERS = {
    desc: _renderDesc,
    spec: _renderSpec,
    imgs: _renderImage,   // ← _renderImage รับ (pane, data) เหมือนเดิม
    oem: _renderOem,
    comp: _renderCompetitor,
    veh: _renderLinkage
};

/* TAB COUNT — อัปเดตตัวเลขบน Tab button
   ResultProductTabItemCountList: countProductDes, countProductSpec,
   countProductImage, countProductOem, countProductCom, countProductLinkage*/
async function _loadTabCounts(stkcode, mode) {
    const res = await _fetchTabApi(stkcode, 'count');
    if (!res?.IsSuccess) return;

    const rows = _getRows(res);
    const d = rows[0];
    if (!d) return;

    const countMap = {
        desc: _pick(d, 'countProductDes'),
        spec: _pick(d, 'countProductSpec'),
        imgs: _pick(d, 'countProductImage'),
        oem: _pick(d, 'countProductOem'),
        comp: _pick(d, 'countProductCom'),
        veh: _pick(d, 'countProductLinkage')
    };

    const prefix = mode === 'modal' ? '#specModalContent' :
        mode === 'drawer' ? '#specDrawer' : '';

    Object.entries(countMap).forEach(([tabId, cnt]) => {
        if (cnt === null || cnt === undefined) return;
        const sel = prefix
            ? `${prefix} .drtab[onclick*="'${tabId}'"] .tbnum`
            : `.drtab[onclick*="'${tabId}'"] .tbnum`;
        document.querySelectorAll(sel).forEach(el => { el.textContent = cnt > 0 ? cnt : ''; });
    });
}

/* =========================CORE: LOAD ONE TAB=========================================== */
const _loadedKeys = new Set(); // prevent duplicate loads

async function _loadOneTab(tabId, stkcode, mode, pid) {
    const uniqueKey = `${stkcode}::${tabId}::${mode}::${pid ?? ''}`;
    if (_loadedKeys.has(uniqueKey)) return;
    _loadedKeys.add(uniqueKey);

    const el = _getPaneEl(tabId, mode, pid);
    if (!el) return;

    _setLoading(el);

    const apiName = TAB_API_MAP[tabId];
    if (!apiName) { el.innerHTML = ''; return; }

    const data = await _fetchTabApi(stkcode, apiName);

    if (!data) {
        _setError(el, 'Failed to load data. Please try again.');
        return;
    }
    if (!data.IsSuccess) {
        _setError(el, data.Message || 'An error occurred.');
        return;
    }

    const renderer = _RENDERERS[tabId];
    if (renderer) renderer(el, data);
}

/* ===================== PUBLIC API================================ */

/**
 * initProductTabs
 * เรียกเมื่อเปิด drawer/modal product ใหม่
 * @param {string} stkcode
 * @param {string} mode  'drawer' | 'modal' | 'inline'
 * @param {string|null} pid  product id สำหรับ inline mode
 */
async function initProductTabs(stkcode, mode, pid) {
    if (!stkcode) return;
    mode = mode || 'drawer';

    // ✅ clear ALL keys ไม่ใช่แค่ของ stkcode นี้
    // เพราะ pane element เดิม (#dp-*) ถูก reuse ข้าม product
    _loadedKeys.clear();

    await Promise.all([
        _loadTabCounts(stkcode, mode),
        _loadOneTab('desc', stkcode, mode, pid)
    ]);
}

/*loadModalTab — เรียกจาก switchModalTab() ใน productSearch.js*/
async function loadModalTab(tabId, stkcode, pid) {
    if (!stkcode) return;
    await _loadOneTab(tabId, stkcode, 'modal', pid ?? 'modal');
}

/*loadDrawerTab — เรียกจาก switchDrTab() ด้านล่าง*/
async function loadDrawerTab(tabId, stkcode) {
    if (!stkcode) return;
    await _loadOneTab(tabId, stkcode, 'drawer', null);
}

/*loadInlineTab — เรียกจาก switchTabIn() ใน truscripts.js*/
async function loadInlineTab(tabId, stkcode, pid) {
    if (!stkcode) return;
    await _loadOneTab(tabId, stkcode, 'inline', pid);
}

window.switchDrTab = function (btn, tabId) {
    const drawer = document.getElementById('specDrawer');
    if (!drawer) return;

    drawer.querySelectorAll('.drtab').forEach(b => b.classList.remove('active'));
    drawer.querySelectorAll('.drpane').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('dp-' + tabId)?.classList.add('active');

    if (typeof badge === 'function') badge('rb4');

    const stkcode = window._currentStkcode;
    if (stkcode) loadDrawerTab(tabId, stkcode);
};

const _origSwitchTabIn = window.switchTabIn;
window.switchTabIn = function (btn, tabId, pid) {
    if (typeof _origSwitchTabIn === 'function') _origSwitchTabIn(btn, tabId, pid);

    const stkcode = window._currentStkcode;
    if (stkcode) loadInlineTab(tabId, stkcode, pid);
};


/* ═══════════ IMAGE LIGHTBOX ═══════════ */
window._imgLightbox = function (startIdx, srcs) {
    let idx = startIdx;

    // ลบ lightbox เก่าถ้ามี
    const old = document.getElementById('_imgLb');
    if (old) old.remove();
    if (document._lbKeyHandler) {
        document.removeEventListener('keydown', document._lbKeyHandler);
    }

    const lb = document.createElement('div');
    lb.id = '_imgLb';
    lb.style.cssText = `
        position:fixed;inset:0;z-index:2147483647;
        background:rgba(0,0,0,.92);
        display:flex;align-items:center;justify-content:center;
        flex-direction:column;gap:12px;cursor:zoom-out;
    `;

    // ✅ ไม่ใส่ role=dialog เพื่อเลี่ยง focus trap ของ browser
    lb.innerHTML = `
        <button id="_lbClose" style="position:absolute;top:14px;right:18px;
            background:none;border:none;color:#fff;font-size:24px;cursor:pointer;z-index:1"
            type="button">
            <i class="bi bi-x-lg"></i>
        </button>
        <button id="_lbPrev" type="button" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);
            background:rgba(255,255,255,.15);border:none;color:#fff;
            font-size:22px;border-radius:50%;width:42px;height:42px;cursor:pointer;z-index:1;
            display:${srcs.length > 1 ? 'flex' : 'none'};align-items:center;justify-content:center">
            <i class="bi bi-chevron-left"></i>
        </button>
        <img id="_lbImg" src="${srcs[idx]}" alt=""
            style="max-width:90vw;max-height:80vh;object-fit:contain;
                   border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.6);
                   transition:opacity .15s;pointer-events:none">
        <button id="_lbNext" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
            background:rgba(255,255,255,.15);border:none;color:#fff;
            font-size:22px;border-radius:50%;width:42px;height:42px;cursor:pointer;z-index:1;
            display:${srcs.length > 1 ? 'flex' : 'none'};align-items:center;justify-content:center">
            <i class="bi bi-chevron-right"></i>
        </button>
        <div id="_lbDots" style="display:flex;gap:6px;margin-top:4px"></div>
    `;

    // ✅ append ตรง body ก่อน
    document.body.appendChild(lb);

    // ✅ วิธีที่ได้ผล: หา modal ที่ active อยู่แล้ว temporarily remove aria-hidden/inert
    const toRestore = [];
    document.querySelectorAll('[aria-hidden="true"],[inert]').forEach(el => {
        if (lb.contains(el)) return; // ข้ามถ้าอยู่ใน lightbox
        const entry = { el, ariaHidden: el.getAttribute('aria-hidden'), inert: el.hasAttribute('inert') };
        el.removeAttribute('aria-hidden');
        el.removeAttribute('inert');
        toRestore.push(entry);
    });

    function _lbClose() {
        // ✅ คืนค่าเดิมให้ทุก element
        toRestore.forEach(({ el, ariaHidden, inert }) => {
            if (ariaHidden !== null) el.setAttribute('aria-hidden', ariaHidden);
            if (inert) el.setAttribute('inert', '');
        });
        lb.remove();
        document.removeEventListener('keydown', document._lbKeyHandler);
    }

    function _lbGo(newIdx) {
        idx = (newIdx + srcs.length) % srcs.length;
        const imgEl = document.getElementById('_lbImg');
        if (!imgEl) return;
        imgEl.style.opacity = '0';
        setTimeout(() => {
            imgEl.src = srcs[idx];
            imgEl.style.opacity = '1';
            _lbUpdateDots();
        }, 120);
    }

    function _lbUpdateDots() {
        const dots = document.getElementById('_lbDots');
        if (!dots || srcs.length <= 1) { if (dots) dots.innerHTML = ''; return; }
        dots.innerHTML = srcs.map((_, i) =>
            `<span data-i="${i}" style="width:7px;height:7px;border-radius:50%;cursor:pointer;
             background:${i === idx ? '#fff' : 'rgba(255,255,255,.35)'};
             transition:background .15s"></span>`
        ).join('');
        dots.querySelectorAll('span').forEach(span => {
            span.addEventListener('click', e => {
                e.stopPropagation();
                _lbGo(parseInt(span.dataset.i));
            });
        });
    }

    // ✅ ผูก event บน lightbox
    lb.addEventListener('click', e => {
        if (e.target === lb) _lbClose();
    });

    document.getElementById('_lbClose').addEventListener('click', e => {
        e.stopPropagation();
        _lbClose();
    });
    document.getElementById('_lbPrev').addEventListener('click', e => {
        e.stopPropagation();
        _lbGo(idx - 1);
    });
    document.getElementById('_lbNext').addEventListener('click', e => {
        e.stopPropagation();
        _lbGo(idx + 1);
    });

    document._lbKeyHandler = e => {
        if (e.key === 'Escape') { e.stopPropagation(); _lbClose(); }
        if (e.key === 'ArrowLeft') _lbGo(idx - 1);
        if (e.key === 'ArrowRight') _lbGo(idx + 1);
    };
    document.addEventListener('keydown', document._lbKeyHandler);

    _lbUpdateDots();
};