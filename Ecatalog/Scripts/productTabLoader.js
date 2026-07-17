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
        const value = _pick(r, 'description', 'specValue', 'value') ?? '—';
        return `<tr><td>${label}</td><td>${value}</td></tr>`;
    }).join('');
    el.innerHTML = `<table class="spec-table">${trs}</table>`;
}

// ResultProductTabImageList: stkcode, seqImage, imagePath
function _renderImage(el, data) {
    const rows = _getRows(data);
    if (!rows.length) {
        el.innerHTML = `
            <div class="img-grid">
                <div class="img-ph"><i class="bi bi-image"></i><span>No image available.</span></div>
            </div>`;
        return;
    }

    const sorted = _sortBy(rows, 'seqImage', 'seq');
    const items = sorted.map(img => {
        const src = _pick(img, 'imagePath', 'url', 'filename') ?? '';
        return `
        <div class="img-ph" style="padding:0;overflow:hidden;position:relative;background:var(--surface-2)">
            <img src="${src}" alt=""
                 style="width:100%;height:100%;object-fit:contain"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:100%;align-items:center;
                        justify-content:center;font-size:28px;color:var(--text-3)">
                <i class="bi bi-image"></i>
            </div>
        </div>`;
    }).join('');

    el.innerHTML = `<div class="img-grid">${items}</div>`;
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
    const items = sorted.map(v => {
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
    imgs: _renderImage,
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