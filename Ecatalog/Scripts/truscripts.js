/* DATA
   PRODUCTS ถูกเติมจาก loadSearchProductVio()*/
let PRODUCTS = [];
let BASE_PRODUCTS = [];
let GROUPS = [];

/* ═══════════════ STATE ═════════════════ */
let cart = [];
let cartCnt = 0;
let vfData = {};
let chkState = { pl: {}, br: {} };
let fitState = new Set();
let activeGroup = '0';
window.selectedGroupId = '0';
let currentSort = 'carModel';
let activeModes = new Set(['description']);
let activeGroups = [];
let activeProduct = null;
let PRODUCTS_FOR_COUNT = [];
let PRODUCTS_FOR_PL_COUNT = [];   // ← เพิ่ม
let PRODUCTS_FOR_BR_COUNT = [];
let _shipToList = [];
let acSelected = null;
let acFocusIdx = -1;
let acItems = [];
let acSbSelected = null;
let acSbFocusIdx = -1;
let acSbItems = [];
let _osSetQtyTimer = null;
let _isChangingQty = false;
let _lastSearchType = '';     // 'vehicle' | 'category' | 'part' | ''
const currentAllowed = {
    pl: [],
    br: []
};

/* ════════════════ HELPERS ═══════════════════ */
const gEl = id => document.getElementById(id);
const g = id => document.getElementById(id);
const isMobile = () => window.innerWidth <= 991;
const fmt = v => '฿' + v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const totalAddress = document.querySelectorAll('#osAddrList .os-addr-item').length;
document.getElementById('totalAddr').innerText = totalAddress + ' ที่อยู่';

const drawer = document.getElementById('specDrawer');
const overlay = document.getElementById('drawerOverlay');
//-----------กันคลิกขวา----------------//
document.addEventListener('contextmenu', function (e) {
    const target = e.target;
    if (
        target.tagName === 'IMG' ||
        target.closest('.pimg') ||
        target.closest('.spec-hero') ||
        target.closest('.dr-hero') ||
        target.closest('.os-thumb') ||
        target.closest('.pcard') ||
        target.closest('.img-ph') ||
        target.closest('.img-grid') ||
        target.closest('.cart-row') ||
        target.closest('.os-item')
    ) {
        e.preventDefault();
        return false;
    }
});
document.addEventListener("keydown", function (e) {

    // Ctrl + S
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return false;
    }
    // Ctrl + C
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
    }
    // Ctrl + U
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
    }
    // F12
    if (e.key === "F12") {
        e.preventDefault();
        return false;
    }
    // Ctrl + Shift + I
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        return false;
    }
    // Ctrl + Shift + J
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        return false;
    }
    // Ctrl + U
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return false;
    }
});
/* ═══════════════ INIT ═══════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    renderBottomBar();
    renderProducts(PRODUCTS);
    setTimeout(() => { gEl('guide').style.display = 'block'; }, 900);

    // ✅ โหลด cart จาก server เมื่อเปิดหน้า
    _fetchCartFromServer();
});

/* ══════════════ API: MAP RESPONSE → FLAT PRODUCTS ═══════════════ */
// function mapApiResponseToProducts(groups) {
//     const list = [];
//     let autoId = 1;
//     const seen = new Set();

//     (groups || []).forEach(group => {
//         if (!group.productGroupNameMain || group.productGroupNameMain.trim() === '') return;

//         (group.productList || []).forEach(item => {
//             if (!item.stkcode || seen.has(item.stkcode)) return;
//             seen.add(item.stkcode);

//             const qty = parseInt(item.qtyReady, 10);
//             const PLACEHOLDER = ['makername', 'modelname', 'makerName', 'modelName'];
//             const maker = (item.makerName || '').trim();
//             const model = (item.modelName || '').trim();
//             const carParts = [maker, model].filter(v =>
//                 v && !PLACEHOLDER.includes(v) &&
//                 !PLACEHOLDER.map(p => p.toLowerCase()).includes(v.toLowerCase())
//             );

//             list.push({
//                 id: autoId++,
//                 code: item.stkcode || '',
//                 name: item.stkcodeDescription || item.stkcode || '—',
//                 price: parseFloat(item.price) || 0,
//                 stock: isNaN(qty) ? 99 : qty,
//                 cat: item.productGroup || group.productGroupNameMain || 'อื่นๆ',
//                 brand: item.brand || '—',
//                 line: item.productLine || 'อื่นๆ',
//                 carModel: carParts.join(' ') || '',
//                 img: item.imagePath || item.imageUrl || '',
//                 fit: parseFittingDescription(item.fittingDescription)
//             });
//         });
//     });

//     return list;
// }

function mapApiResponseToProducts(groups) {
    const list = [];
    let autoId = 1;
    const seen = new Set();

    (groups || []).forEach(group => {
        // ✅ ลบ guard นี้ออก — อย่าทิ้ง group ที่ productGroupNameMain ว่าง
        // if (!group.productGroupNameMain || group.productGroupNameMain.trim() === '') return;

        const groupLabel = (group.productGroupNameMain || '').trim() || 'อื่นๆ';

        (group.productList || []).forEach(item => {
            if (!item.stkcode || seen.has(item.stkcode)) return;
            seen.add(item.stkcode);

            const qty = parseInt(item.qtyReady, 10);
            const PLACEHOLDER = ['makername', 'modelname', 'makerName', 'modelName'];
            const maker = (item.makerName || '').trim();
            const model = (item.modelName || '').trim();
            const carParts = [maker, model].filter(v =>
                v && !PLACEHOLDER.includes(v) &&
                !PLACEHOLDER.map(p => p.toLowerCase()).includes(v.toLowerCase())
            );

            list.push({
                id: autoId++,
                code: item.stkcode || '',
                name: item.stkcodeDescription || item.stkcode || '—',
                price: parseFloat(item.price) || 0,
                stock: isNaN(qty) ? 99 : qty,
                cat: item.productGroup || groupLabel,
                brand: item.brand || '—',
                line: item.productLine || 'อื่นๆ',
                carModel: carParts.join(' ') || '',
                img: item.imagePath || item.imageUrl || '',
                fit: parseFittingDescription(item.fittingDescription)
            });
        });
    });

    return list;
}

function parseFittingDescription(fittingDescription) {
    if (!fittingDescription) return [];

    // format: FR/BOTH/LOWER/-  (axis/side/level/direction)
    const parts = fittingDescription.split('/').map(p => p.trim().toLowerCase());
    const [axis, side, level, direction] = parts;
    const chips = [];

    // Axis (index 0)
    const axisMap = { 'fr': 'หน้า', 'rr': 'หลัง', 'mid': 'กลาง', 'engine': 'เครื่องยนต์' };
    if (axis && axis !== '-') {
        if (axis === 'both') { chips.push('หน้า'); chips.push('หลัง'); }
        else if (axisMap[axis]) chips.push(axisMap[axis]);
    }

    // Side (index 1)
    if (side && side !== '-') {
        if (side === 'both') { chips.push('ซ้าย'); chips.push('ขวา'); }
        else if (side === 'lh') chips.push('ซ้าย');
        else if (side === 'rh') chips.push('ขวา');
        else if (side === 'center') chips.push('กลาง');
    }

    // Level (index 2)
    if (level && level !== '-') {
        if (level === 'both') { chips.push('บน'); chips.push('ล่าง'); }
        else if (level === 'upper') chips.push('บน');
        else if (level === 'lower') chips.push('ล่าง');
    }

    // Direction (index 3)
    if (direction && direction !== '-') {
        if (direction === 'both') { chips.push('ใน'); chips.push('นอก'); }
        else if (direction === 'inner') chips.push('ใน');
        else if (direction === 'outer') chips.push('นอก');
    }

    return [...new Set(chips)];
}
/**
 * เซต Base ใหม่จาก API response
 * @param {Array}  groups      — grouped data จาก API
 * @param {string} searchType  — 'vehicle' | 'part' | 'category'
 */
// ── 2. _setBaseProducts — ส่ง keepSort=true เสมอ หรือดูจาก dropdown ──
function _setBaseProducts(groups, searchType, keepSort = false, skipRender = false) {
    
    _lastSearchType = searchType
    BASE_PRODUCTS = mapApiResponseToProducts(groups || []);

    if (searchType === 'vehicle' || searchType === 'part') {
        chkState = { pl: {}, br: {} };
        fitState = new Set();
        document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));
        document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

        const sel = gEl('sortSelect');
        if (!keepSort && sel) {
            currentSort = sel.value || 'carModel';
        }

        const af = gEl('activeFilters');
        if (af) af.innerHTML = '';
    }

    PRODUCTS_FOR_PL_COUNT = [...BASE_PRODUCTS];
    PRODUCTS_FOR_BR_COUNT = [...BASE_PRODUCTS];

    // ✅ caller บางตัว handle render เองหลัง set activeGroup — ไม่ render ซ้ำ
    if (!skipRender) {
        _applyFiltersAndRender();
    }
}

function _applyFiltersAndRender() {
    const q = (gEl('partQ')?.value || '').toLowerCase().trim();
    const plKeys = Object.keys(chkState.pl);
    const brKeys = Object.keys(chkState.br);
    const fitK = [...fitState];

    const activeGroupStr = String(activeGroup);
    const activeGroupObj = GROUPS.find(g => String(g.id) === activeGroupStr);
    const filterByCat = activeGroupStr !== '0' && activeGroupStr !== '99' && !!activeGroupObj;
    const filterUniversal = activeGroupStr === '99';

    const baseFiltered = BASE_PRODUCTS.filter(p => {
        if (filterUniversal && p.carModel !== 'Universal') return false;
        if (filterByCat && _lastSearchType !== 'category' && p.cat !== activeGroupObj.label) return false;
        if (_lastSearchType === 'vehicle' && !p.carModel && p.carModel !== 'Universal') return false;
        if (q) {
            let match = false;
            if (activeModes.has('description') && p.name.toLowerCase().includes(q)) match = true;
            if (activeModes.has('oe') && p.code.toLowerCase().includes(q)) match = true;
            if (activeModes.has('competitor') && p.brand.toLowerCase().includes(q)) match = true;
            if (!match) return false;
        }
        if (fitK.length && (p.fit.length === 0 || !fitK.every(f => p.fit.includes(f)))) return false;
        return true;
    });

    // แก้เป็น
    PRODUCTS_FOR_BR_COUNT = plKeys.length
        ? baseFiltered.filter(p => plKeys.includes(p.line))
        : [...baseFiltered];

    // ✅ ต้อง filter เฉพาะ br เท่านั้น ไม่รวม pl เพื่อให้ pl count สะท้อนจำนวนจริงหลัง untick
    PRODUCTS_FOR_PL_COUNT = brKeys.length
        ? baseFiltered.filter(p => brKeys.includes(p.brand))
        : [...baseFiltered];

    PRODUCTS = baseFiltered.filter(p => {
        if (plKeys.length && !plKeys.includes(p.line)) return false;
        if (brKeys.length && !brKeys.includes(p.brand)) return false;
        return true;
    });

    renderProducts(PRODUCTS);
    _updateSidebar();
    renderActiveFilterChips();

    // ✅ ปรับแก้สเตตการมองเห็นของรายการใน Sidebar หลัง Render
    _ensureSidebarVisibility();
}

// 🔧 ฟังก์ชันช่วยจัดการการโชว์/ซ่อน รายการ Sidebar ไม่ให้หุบหาย
function _ensureSidebarVisibility() {
    ['pl', 'br'].forEach(type => {
        const listEl = $(`#${type}List`);
        const items = listEl.find('.chk-item');
        const btn = gEl(`${type}SeeMore`);
        const isExpanded = btn?.classList.contains('expanded');

        if (items.length > 0) {
            // แสดง 5 รายการแรกเสมอ ถ้านิ้วกดกางขยายไว้ให้แสดงทั้งหมด
            items.each((idx, el) => {
                if (isExpanded || idx < 5) {
                    $(el).show();
                } else {
                    $(el).hide();
                }
            });
        }

        // ✅ บังคับให้ปุ่ม "ดูเพิ่มเติม" แสดงเสมอ (หรือแสดงเมื่อมีรายการมากกว่า 5 ตัวขึ้นไป)
        if (btn) {
            btn.style.display = 'block'; // บังคับโชว์ปุ่มไว้ตลอดเวลา
        }
    });
}
// function _applyFiltersAndRender() {
//     const q = (gEl('partQ')?.value || '').toLowerCase().trim();
//     const plKeys = Object.keys(chkState.pl);
//     const brKeys = Object.keys(chkState.br);
//     const fitK = [...fitState];

//     const activeGroupStr = String(activeGroup);
//     const activeGroupObj = GROUPS.find(g => String(g.id) === activeGroupStr);
//     const filterByCat = activeGroupStr !== '0' && activeGroupStr !== '99' && !!activeGroupObj;
//     const filterUniversal = activeGroupStr === '99';

//     const baseFiltered = BASE_PRODUCTS.filter(p => {
//         if (filterUniversal && p.carModel !== 'Universal') return false;
//         if (filterByCat && _lastSearchType !== 'category' && p.cat !== activeGroupObj.label) return false;
//         if (_lastSearchType === 'vehicle' && !p.carModel && p.carModel !== 'Universal') return false;
//         if (q) {
//             let match = false;
//             if (activeModes.has('description') && p.name.toLowerCase().includes(q)) match = true;
//             if (activeModes.has('oe') && p.code.toLowerCase().includes(q)) match = true;
//             if (activeModes.has('competitor') && p.brand.toLowerCase().includes(q)) match = true;
//             if (!match) return false;
//         }
//         if (fitK.length && (p.fit.length === 0 || !fitK.every(f => p.fit.includes(f)))) return false;
//         return true;
//     });

//     PRODUCTS_FOR_BR_COUNT = plKeys.length
//         ? baseFiltered.filter(p => plKeys.includes(p.line))
//         : [...baseFiltered];

//     PRODUCTS_FOR_PL_COUNT = brKeys.length
//         ? baseFiltered.filter(p => brKeys.includes(p.brand))
//         : [...baseFiltered];

//     PRODUCTS = baseFiltered.filter(p => {
//         if (plKeys.length && !plKeys.includes(p.line)) return false;
//         if (brKeys.length && !brKeys.includes(p.brand)) return false;
//         return true;
//     });

//     renderProducts(PRODUCTS);
//     _updateSidebar();
//     renderActiveFilterChips();
// }

/* SIDEBAR UPDATE
   - pl  : อัปเดต count เท่านั้น (show/hide ดูแลโดย FilterProductionLines)
   - brand: อัปเดต count + sort + show/hide*/
function _updateSidebar() {
    // ── Product Line (PL) ──
    const plCounts = {};
    (PRODUCTS_FOR_PL_COUNT || []).forEach(p => {
        if (p && p.line) {
            const name = p.line.trim();
            plCounts[name] = (plCounts[name] || 0) + 1;
        }
    });

    // อัปเดตตัวเลข
    $('#plList .chk-item').each(function () {
        const name = $(this).attr('data-name');
        const count = plCounts[name] ?? 0;  // ✅ ?? แทน || เพื่อให้ 0 แสดงจริงๆ
        $(this).find('.chk-count').text(count);
    });

    // แยกChecked นำขึ้นบนสุด แล้ว sort Unchecked ตาม Count
    const $plList = $('#plList');
    const $plChecked = $plList.find('.chk-item.checked').detach();
    const $plUnchecked = $plList.find('.chk-item').detach();

    $plUnchecked.sort((a, b) =>
        (parseInt($(b).find('.chk-count').text()) || 0) -
        (parseInt($(a).find('.chk-count').text()) || 0)
    );

    $plList.append($plChecked).append($plUnchecked);

    // แสดงรายการที่ checked + 5 รายการแรก
    let plVisible = 0;
    $plList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked');
        if (isChecked || plVisible < 5) {
            $(this).show();
            if (!isChecked) plVisible++;
        } else {
            $(this).hide();
        }
    });

    const plBtn = gEl('plSeeMore');
    if (plBtn) {
        plBtn.style.display = $plList.find('.chk-item').length > 5 ? 'block' : 'none';
    }

    // ── Brand (BR) ──
    const brCounts = {};
    (PRODUCTS_FOR_BR_COUNT || []).forEach(p => {
        if (p && p.brand) {
            const name = p.brand.trim();
            brCounts[name] = (brCounts[name] || 0) + 1;
        }
    });

    // อัปเดตตัวเลข
    $('#brList .chk-item').each(function () {
        const name = $(this).attr('data-name');
        const count = brCounts[name] ?? 0;  // ✅
        $(this).find('.chk-count').text(count);
    });

    // แยกChecked นำขึ้นบนสุด แล้ว sort Unchecked ตาม Count
    const $brList = $('#brList');
    const $brChecked = $brList.find('.chk-item.checked').detach();
    const $brUnchecked = $brList.find('.chk-item').detach();

    $brUnchecked.sort((a, b) =>
        (parseInt($(b).find('.chk-count').text()) || 0) -
        (parseInt($(a).find('.chk-count').text()) || 0)
    );

    $brList.append($brChecked).append($brUnchecked);

    // แสดงรายการที่ checked + 5 รายการแรก
    let brVisible = 0;
    $brList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked');
        if (isChecked || brVisible < 5) {
            $(this).show().removeClass('br-extra');
            if (!isChecked) brVisible++;
        } else {
            $(this).hide().addClass('br-extra');
        }
    });

    const brBtn = gEl('brSeeMore');
    if (brBtn) {
        brBtn.style.display = $brList.find('.chk-item').length > 5 ? 'block' : 'none';
    }
}
/* ═══════════════ §1 — SEARCH SYNC ════════════════ */
function syncSearch(source) {
    const headerQ = gEl('headerQ');
    const partQ = gEl('partQ');
    if (!headerQ || !partQ) return;   // ✅ guard
    if (source === 'header') {
        partQ.value = headerQ.value;
    } else {
        headerQ.value = partQ.value;
    }
    activateSec(2);
    applyAllFilters();
}

/* ════════  §2 — SEARCH MODE ══════════════════ */
function toggleMode(btn) {
    const mode = btn.dataset.mode;
    if (activeModes.has(mode)) {
        if (activeModes.size > 1) {
            activeModes.delete(mode);
            btn.classList.remove('active');
        }
    } else {
        activeModes.add(mode);
        btn.classList.add('active');
    }
    activateSec(2);
    applyAllFilters();
}

/* ════════════ §3 — CLEAR ALL FILTERS ═════════════ */
function clearAllFilters() {
    vfData = {};
    ['marketsegId', 'segmentId', 'makerId', 'rangeId', 'bodyId', 'engineId', 'driveId'].forEach(id => {
        const el = gEl(id); if (el) el.value = '';
    });
    const yrFrom = gEl('yearFrom'); if (yrFrom) yrFrom.value = '';
    const yrTo = gEl('yearTo'); if (yrTo) yrTo.value = '';
    gEl('vfTags').innerHTML = '';

    gEl('vehSummary').innerHTML = `
        <div class="veh-empty">
            <i class="bi bi-car-front" style="font-size:1.1rem"></i>
            <span>Select vehicle attributes in the left panel to filter parts</span>
        </div>`;

    chkState = { pl: {}, br: {} };
    document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));

    fitState = new Set();
    document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

    const pq = gEl('partQ'); if (pq) pq.value = '';
    const hq = gEl('headerQ'); if (hq) hq.value = '';

    currentSort = 'carModel';
    gEl('sortSelect').value = 'carModel';

    activeModes = new Set(['description']);
    document.querySelectorAll('.smode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === 'description');
    });

    activeGroup = '0';
    window.selectedGroupId = '0';
    document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
    document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

    gEl('activeFilters').innerHTML = '';

    closeSpecModal({ target: gEl('specModalBackdrop') });
    closeDrawer();

    // ✅ reset ข้อมูลทั้งหมด
    _lastSearchType = '';
    BASE_PRODUCTS = [];
    PRODUCTS = [];
    PRODUCTS_FOR_COUNT = [];
    PRODUCTS_FOR_PL_COUNT = [];
    PRODUCTS_FOR_BR_COUNT = [];
    currentAllowed.pl = [];
    currentAllowed.br = [];

    // ✅ reset count เป็น 0 และแสดง 5 รายการแรก
    $("#plList .chk-item .chk-count, #brList .chk-item .chk-count").text(0);
    $("#plList .chk-item").each((idx, el) => $(el).toggle(idx < 5));
    $("#brList .chk-item").each((idx, el) => $(el).toggle(idx < 5));

    const plBtn = gEl('plSeeMore');
    if (plBtn) {
        plBtn.classList.remove('expanded');
        plBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
        plBtn.style.display = 'block';
    }

    const brBtn = gEl('brSeeMore');
    if (brBtn) {
        brBtn.classList.remove('expanded');
        brBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
        brBtn.style.display = 'block';
    }

    [1, 2, 3, 4].forEach(i => {
        gEl('lb' + i)?.classList.remove('active-badge');
        gEl('rb' + i)?.classList.remove('active-badge');
    });
    gEl('rz1')?.classList.remove('g1', 'g2', 'g3', 'g4');
    gEl('rz2')?.classList.remove('g1', 'g2', 'g3', 'g4');

    hideSkel();
    renderProducts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    _vehiclePromptShown = false;
}

// function clearAllFilters() {
//     vfData = {};
//     ['marketsegId', 'segmentId', 'makerId', 'rangeId', 'bodyId', 'engineId', 'driveId'].forEach(id => {
//         const el = gEl(id); if (el) el.value = '';
//     });
//     const yrFrom = gEl('yearFrom'); if (yrFrom) yrFrom.value = '';
//     const yrTo = gEl('yearTo'); if (yrTo) yrTo.value = '';
//     gEl('vfTags').innerHTML = '';

//     gEl('vehSummary').innerHTML = `
//         <div class="veh-empty">
//             <i class="bi bi-car-front" style="font-size:1.1rem"></i>
//             <span>Select vehicle attributes in the left panel to filter parts</span>
//         </div>`;

//     chkState = { pl: {}, br: {} };
//     document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));

//     fitState = new Set();
//     document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

//     const pq = gEl('partQ'); if (pq) pq.value = '';
//     const hq = gEl('headerQ'); if (hq) hq.value = '';

//     currentSort = 'carModel';
//     gEl('sortSelect').value = 'carModel';

//     activeModes = new Set(['description']);
//     document.querySelectorAll('.smode-btn').forEach(btn => {
//         btn.classList.toggle('active', btn.dataset.mode === 'description');
//     });

//     activeGroup = '0';
//     window.selectedGroupId = '0';
//     document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
//     document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

//     gEl('activeFilters').innerHTML = '';

//     closeSpecModal({ target: gEl('specModalBackdrop') });
//     closeDrawer();

//     _lastSearchType = '';
//     BASE_PRODUCTS = [];
//     PRODUCTS_FOR_PL_COUNT = [];
//     PRODUCTS_FOR_BR_COUNT = [];
//     PRODUCTS = [];
//     renderProducts([]);
//     _rebuildSidebarFromProducts(); จะ set count = 0 และ hide ทั้งหมด — ถูกต้องเพราะยังไม่ search

//     PRODUCTS = [];
//     BASE_PRODUCTS = [];
//     PRODUCTS_FOR_COUNT = [];
//     PRODUCTS_FOR_PL_COUNT = [];
//     PRODUCTS_FOR_BR_COUNT = [];
//     currentAllowed.pl = [];
//     currentAllowed.br = [];

//     reset count + ซ่อนทุกตัว (count = 0 หมด)
//     $("#plList .chk-item .chk-count").text(0);
//     $("#brList .chk-item .chk-count").text(0);
//     $("#plList .chk-item, #brList .chk-item").hide();

//     const plBtn = gEl('plSeeMore');
//     if (plBtn) { plBtn.classList.remove('expanded'); plBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม'; }
//     const brBtn = gEl('brSeeMore');
//     if (brBtn) { brBtn.classList.remove('expanded'); brBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม'; }

//     [1, 2, 3, 4].forEach(i => {
//         gEl('lb' + i)?.classList.remove('active-badge');
//         gEl('rb' + i)?.classList.remove('active-badge');
//     });
//     gEl('rz1')?.classList.remove('g1', 'g2', 'g3', 'g4');
//     gEl('rz2')?.classList.remove('g1', 'g2', 'g3', 'g4');

//     hideSkel();
//     renderProducts(PRODUCTS); PRODUCTS = [] → render หน้าว่าง
//     _lastSearchType = '';
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//     _vehiclePromptShown = false;
// }
function _rebuildSidebarFromProducts() {
    if (!BASE_PRODUCTS) return;

    // ── 1. ประมวลผล Product Line (PL) ──
    const lineCount = {};
    BASE_PRODUCTS.forEach(p => {
        if (p.line) {
            const name = p.line.trim();
            lineCount[name] = (lineCount[name] || 0) + 1;
        }
    });

    const $plList = $('#plList');

    // สร้าง Element ใหม่ถ้ายังไม่มีใน DOM
    Object.keys(lineCount).forEach(name => {
        if ($plList.find(`.chk-item[data-name="${name}"]`).length === 0) {
            const isChecked = !!(chkState.pl && chkState.pl[name]);
            $plList.append(`
                <div class="chk-item ${isChecked ? 'checked' : ''}" data-name="${name}" onclick="toggleChk('pl', '${name.replace(/'/g, "\\'")}')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="chk-label">${name}</span>
                    <span class="chk-count">0</span>
                </div>
            `);
        }
    });

    // อัปเดต Count ให้รายการทั้งหมด
    $plList.find('.chk-item').each(function () {
        const name = $(this).attr('data-name');
        $(this).find('.chk-count').text(lineCount[name] || 0);
    });

    // แยกรายการที่ Checked ออกมาไว้ด้านบนสุด แล้วเรียงตัวเหลือตาม Count มากไปน้อย
    const $plChecked = $plList.find('.chk-item.checked').detach();
    const $plUnchecked = $plList.find('.chk-item').detach();

    $plUnchecked.sort((a, b) =>
        (parseInt($(b).find('.chk-count').text()) || 0) -
        (parseInt($(a).find('.chk-count').text()) || 0)
    );

    $plList.append($plChecked).append($plUnchecked);

    // แสดง 5 รายการแรกเสมอ (รายการที่ checked บังคับโชว์เสมอ)
    let plVisible = 0;
    $plList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked');
        if (isChecked || plVisible < 5) {
            $(this).show();
            if (!isChecked) plVisible++;
        } else {
            $(this).hide();
        }
    });

    const plBtn = gEl('plSeeMore');
    if (plBtn) {
        plBtn.classList.remove('expanded');
        plBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
        plBtn.style.display = $plList.find('.chk-item').length > 5 ? 'block' : 'none';
    }

    // ── 2. ประมวลผล Brand (BR) ──
    const brandCount = {};
    BASE_PRODUCTS.forEach(p => {
        if (p.brand && p.brand !== '—') {
            const name = p.brand.trim();
            brandCount[name] = (brandCount[name] || 0) + 1;
        }
    });

    const $brList = $('#brList');

    // สร้าง Element ใหม่ถ้ายังไม่มีใน DOM
    Object.keys(brandCount).forEach(name => {
        if ($brList.find(`.chk-item[data-name="${name}"]`).length === 0) {
            const isChecked = !!(chkState.br && chkState.br[name]);
            $brList.append(`
                <div class="chk-item ${isChecked ? 'checked' : ''}" data-name="${name}" onclick="toggleChk('br', '${name.replace(/'/g, "\\'")}')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="chk-label">${name}</span>
                    <span class="chk-count">0</span>
                </div>
            `);
        }
    });

    // อัปเดต Count
    $brList.find('.chk-item').each(function () {
        const name = $(this).attr('data-name');
        $(this).find('.chk-count').text(brandCount[name] || 0);
    });

    // จัดเรียง
    const $brChecked = $brList.find('.chk-item.checked').detach();
    const $brUnchecked = $brList.find('.chk-item').detach();

    $brUnchecked.sort((a, b) =>
        (parseInt($(b).find('.chk-count').text()) || 0) -
        (parseInt($(a).find('.chk-count').text()) || 0)
    );

    $brList.append($brChecked).append($brUnchecked);

    // แสดง 5 รายการแรก
    let brVisible = 0;
    $brList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked');
        if (isChecked || brVisible < 5) {
            $(this).show();
            if (!isChecked) brVisible++;
        } else {
            $(this).hide();
        }
    });

    const brBtn = gEl('brSeeMore');
    if (brBtn) {
        brBtn.classList.remove('expanded');
        brBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
        brBtn.style.display = $brList.find('.chk-item').length > 5 ? 'block' : 'none';
    }
}

/* ═══════════════ §4 — SORTING ════════════════ */
function switchSortbyPart() {
    // toggle ระหว่าง carModel (default) และ part
    if (currentSort === 'part') {
        currentSort = 'carModel';
    } else {
        currentSort = 'part';
    }

    // sync dropdown ให้ตรง
    const sel = gEl('sortSelect');
    if (sel) sel.value = currentSort;

    // update ปุ่มให้แสดง state ปัจจุบัน
    const btn = document.querySelector('[onclick*="switchSortbyPart"]');
    if (btn) {
        const isPartMode = currentSort === 'part';
        btn.innerHTML = isPartMode
            ? '<i class="bi bi-toggle-on" style="color:#fff"></i> Sort: Part'
            : '<i class="bi bi-toggle-off"></i> Sort: Car Model';
        btn.style.background = isPartMode ? 'var(--primary)' : '';
        btn.style.color = isPartMode ? '#fff' : '';
    }

    applyAllFilters();
}


// ── 3. sortProducts — ซิงก์ dropdown กลับด้วย (กันกรณี call จากที่อื่น) ──
function sortProducts(val) {
    currentSort = val;
    const sel = gEl('sortSelect');
    if (sel && sel.value !== val) sel.value = val;  // ✅ sync UI
    applyAllFilters();
}
function applySorting(list) {
    const arr = [...list];
    if (currentSort === 'price-asc') return arr.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-desc') return arr.sort((a, b) => b.price - a.price);
    if (currentSort === 'name') return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (currentSort === 'carModel') return arr.sort((a, b) => (a.carModel || '').localeCompare(b.carModel || '', 'th'));
    if (currentSort === 'part') return arr.sort((a, b) => a.code.localeCompare(b.code));
    if (currentSort === 'brand') return arr.sort((a, b) => a.brand.localeCompare(b.brand));
    return arr.sort((a, b) => (a.carModel || '').localeCompare(b.carModel || '', 'th'));
}


/* ═══════════════ §5 — BOTTOM BAR ═══════════════════ */
function renderBottomBar() {
    const activeStr = String(activeGroup || '0');

    gEl('bbScroll').innerHTML = GROUPS.map(g => {
        const gidStr = String(g.id);
        const isActive = gidStr === activeStr;
        return `
            <div class="bb-item ${isActive ? 'active' : ''} ${g.id === 'Universal' ? 'bb-universal' : ''}" 
                 data-id="${g.id}" 
                 onclick="selectGroup('${g.id}')">
                <i class="bi ${g.icon}"></i>
                <span class="bb-label">${g.label}</span>
            </div>`;
    }).join('');
}

function selectGroup(id) {
    if (window._isSearchingCategory) return;

    showVehiclePrompt(
        // Yes → ไปเลือกรถ ยังไม่ค้นหา
        function () {
            goToVehicleFilter();
        },
        // No → ค้นหาต่อปกติ
        function () {
            window._isSearchingCategory = true;

            const targetIdStr = String(id);
            activeGroup = targetIdStr;
            window.selectedGroupId = targetIdStr;

            // ✅ 1. ล้างค่า Filter ใน Sidebar เดิมออกก่อนสลับหมวดหมู่
            _resetSidebarFilters();

            // ✅ 2. อัปเดตคลาส active โดยแปลง id เป็น String ทั้งคู่
            document.querySelectorAll('.bb-item').forEach(b => {
                const bIdStr = String(b.getAttribute('data-id'));
                b.classList.toggle('active', bIdStr === targetIdStr);
            });

            document.querySelectorAll('.bb-item').forEach(b => b.style.pointerEvents = 'none');

            const activeNav = document.querySelector(`.pg-nav-btn[data-gid="${id}"]`);
            if (activeNav) activeNav.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            const activeBB = document.querySelector('.bb-item.active');
            if (activeBB) activeBB.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

            updateBreadcrumb(id, 'Parts Catalog');
            showSkel();
            ClickedMatchData();
        }
    );
}
function scrollBottom(dx) {
    gEl('bbScroll').scrollBy({ left: dx, behavior: 'smooth' });
}

// ── ใน selectGroup (truscripts.js) ──
// function selectGroup(id) {
//     if (window._isSearchingCategory) return;

//     showVehiclePrompt(
//         Yes → ไปเลือกรถ ยังไม่ค้นหา
//         function () {
//             goToVehicleFilter();
//         },
//         No → ค้นหาต่อปกติ
//         function () {
//             window._isSearchingCategory = true;

//             activeGroup = id;
//             window.selectedGroupId = id;

//             document.querySelectorAll('.bb-item').forEach((b, i) => {
//                 b.classList.toggle('active', GROUPS[i].id === id);
//             });

//             document.querySelectorAll('.bb-item').forEach(b => b.style.pointerEvents = 'none');

//             const activeNav = document.querySelector(`.pg-nav-btn[data-gid="${id}"]`);
//             if (activeNav) activeNav.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
//             const activeBB = document.querySelector('.bb-item.active');
//             if (activeBB) activeBB.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

//             updateBreadcrumb(id, 'Parts Catalog');
//             showSkel();
//             ClickedMatchData();
//         }
//     );
// }
function _clickedMatchDataAndRender() {
    const grpId = window.selectedGroupId || null;

    $.ajax({
        url: urls.getMatchProductionGroup,
        method: 'GET',
        data: { prodgrpid: grpId },
        success: function (result) {
            if (result.IsSuccess) {
                const allowedIds = (result.Data || []).map(x => x.prodlineid.toString());

                // 1. clean chkState.pl ที่ไม่อยู่ใน group นี้
                Object.keys(chkState.pl).forEach(lineName => {
                    const label = document.querySelector(`#plList .chk-item[data-name="${CSS.escape(lineName)}"]`);
                    if (!label) { delete chkState.pl[lineName]; return; }
                    const lineId = label.getAttribute('data-id');
                    if (allowedIds.length > 0 && !allowedIds.includes(lineId)) {
                        delete chkState.pl[lineName];
                        label.classList.remove('checked');
                    }
                });

                // 2. filter sidebar ให้แสดงเฉพาะ line ที่อยู่ใน group
                currentAllowed.pl = allowedIds;
                _filterSidebarLines(allowedIds);
            }

            // 3. render — เรียก API ค้นหาสินค้าใหม่ทุกครั้งที่เปลี่ยน category
            // hideSkel();
            searchProductByCategory().then(() => {
                PRODUCTS_FOR_COUNT = [...PRODUCTS];
                _updateSidebar();
                renderActiveFilterChips();
            });
        },
        error: function () {
            // API fail → ยังพยายามค้นหาด้วย category ที่เลือกอยู่ดี
            hideSkel();
            searchProductByCategory().then(() => {
                PRODUCTS_FOR_COUNT = [...PRODUCTS];
            });
        }
    });
}
// แยก UI logic ออกมาจาก ClickedMatchData เดิม
function _filterSidebarLines(allowedIds) {
    const SHOW_LIMIT = 5;
    let visibleCount = 0;

    $("#plList .chk-item").each(function () {
        const id = $(this).attr('data-id');
        const allowed = allowedIds.length === 0 || allowedIds.includes(id);
        if (!allowed) {
            $(this).hide();
        } else {
            visibleCount++;
            $(this).toggle(visibleCount <= SHOW_LIMIT);
        }
    });

    const btn = gEl('plSeeMore');
    if (btn) {
        btn.classList.remove('expanded');
        btn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
    }
}

/* PRODUCT DETAIL
   openDrawer → เปิด modal (desktop) หรือ drawer (mobile)
   แล้วเรียก initProductTabs(stkcode) เพื่อโหลด Tab จาก API*/
function selCard(id) {
    document.querySelectorAll('.pcard').forEach(c => c.classList.remove('active-card'));
    gEl('pc-' + id)?.classList.add('active-card');
}

function buildSpecHTML(p) {
    return `
    <div class="spec-hero">
        ${p.img
            ? `<img src="${p.img}" alt="${p.name}"
               onerror="this.parentElement.innerHTML='<div class=\'no-image\'>No images found.</div>'">`
            : `<div class="no-image">
               <i class="bi bi-image" style="font-size:28px;color:var(--text-3)"></i>
               <span style="font-size:10px;color:var(--text-3);margin-top:4px">No image</span>
           </div>`}
        <div class="spec-hero-meta flex-grow-1">
            <h5>${p.name}</h5>
            <p>${p.code}</p>
            <p style="font-size:12px;color:var(--text-3);margin-top:3px">${p.brand}</p>
            <div class="mt-2 d-flex align-items-center gap-3">
                <div class="spec-price">฿${p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                <input type="number" class="qty" value="1" min="1" max="99"
                       id="modalQty-${p.id}" onclick="event.stopPropagation()">
                <button class="acart ${(p.stock ?? 99) === 0 ? 'bo-btn' : ''}"
                        style="max-width:160px" onclick="addCartFromSpecModal(${p.id}, event)">
                    <i class="bi ${(p.stock ?? 99) === 0 ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i>
                    ${(p.stock ?? 99) === 0 ? 'จอง (BO)' : 'เพิ่ม'}
                </button>
            </div>
        </div>
    </div>
    <div class="stabs-nav">
        <button class="stab-btn active" onclick="switchTabIn(this,'desc','${p.id}')"><i class="bi bi-file-text"></i> Description</button>
        <button class="stab-btn" onclick="switchTabIn(this,'spec','${p.id}')"><i class="bi bi-rulers"></i> Spec</button>
        <button class="stab-btn" onclick="switchTabIn(this,'imgs','${p.id}')"><i class="bi bi-images"></i> Image</button>
        <button class="stab-btn" onclick="switchTabIn(this,'oem','${p.id}')"><i class="bi bi-upc"></i> OEM</button>
        <button class="stab-btn" onclick="switchTabIn(this,'comp','${p.id}')"><i class="bi bi-diagram-2"></i> Competitor</button>
        <button class="stab-btn" onclick="switchTabIn(this,'veh','${p.id}')"><i class="bi bi-car-front"></i> Vehicle</button>
    </div>
    <div class="stab-content">
        <div class="stab-pane active" id="itab-desc-${p.id}"></div>
        <div class="stab-pane" id="itab-spec-${p.id}"></div>
        <div class="stab-pane" id="itab-imgs-${p.id}"></div>
        <div class="stab-pane" id="itab-oem-${p.id}"></div>
        <div class="stab-pane" id="itab-comp-${p.id}"></div>
        <div class="stab-pane" id="itab-veh-${p.id}"></div>
    </div>`;
}

/* ── Add to cart จาก spec modal ที่เปิดผ่าน openDrawer (card click) ── */
async function addCartFromSpecModal(productId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();

    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    const qty = parseInt(gEl('modalQty-' + productId)?.value) || 1;
    const btn = clickEvent?.currentTarget instanceof HTMLElement
        ? clickEvent.currentTarget
        : document.querySelector('#specModalContent .acart');

    await _callAddToCartAPI(p, qty, btn);
}

const s = window.getComputedStyle(drawer);

async function openDrawer(productId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();
    selCard(productId);

    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    activeProduct = p;
    if (typeof _normalizeProduct === 'function') {
        currentSpecProduct = _normalizeProduct(p);
    } else {
        currentSpecProduct = p;
    }

    activateSec(4);
    updateBreadcrumb(activeGroup, p.name);
    window._currentStkcode = p.code;

    const drawerReady = !!gEl('specDrawer') && !!gEl('drTitle');
    if (isMobile() && drawerReady) {
        const set = (id, val) => { const el = gEl(id); if (el) el.textContent = val; };
        set('drTitle', p.name);
        set('drCode', p.code);
        set('drCode2', p.code);
        set('drBrand', p.brand);
        set('drName', p.name);
        set('drPrice', '฿' + p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 }));
        set('drDescFull', p.name);
        set('drCat', p.cat);
        set('drBrandCard', p.brand);
        set('drPN', p.code);

        const drImg = gEl('drImg');
        const drImgPh = gEl('drImgPh');

        if (p.img) {
            drImg.src = p.img;
            drImg.style.cssText = `
        display:block;
        width:120px;
        height:120px;
        object-fit:contain;
        background:var(--surface);
        border-radius:var(--r);
        padding:8px;
        flex-shrink:0;
        box-shadow:var(--sh-sm)
    `;
            if (drImgPh) drImgPh.style.display = 'none';
            drImg.onerror = () => {
                drImg.style.display = 'none';
                if (drImgPh) drImgPh.style.display = 'flex';
            };
        } else {
            if (drImg) drImg.style.display = 'none';
            if (drImgPh) drImgPh.style.display = 'flex';
        }

        const drBoRow = gEl('drBoRow');
        if (drBoRow) drBoRow.style.display = (p.stock ?? 99) === 0 ? '' : 'none';

        const drAddBtn = gEl('drAddBtn');
        if (drAddBtn) {
            const isBO = (p.stock ?? 99) === 0;
            drAddBtn.className = 'dr-add-btn' + (isBO ? ' bo-btn' : '');
            drAddBtn.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'Add to Cart'}`;
        }

        gEl('specDrawer').querySelectorAll('.drtab').forEach((b, i) => b.classList.toggle('active', i === 0));
        gEl('specDrawer').querySelectorAll('.drpane').forEach((pane, i) => pane.classList.toggle('active', i === 0));

        gEl('drawerOverlay').classList.add('show');
        gEl('specDrawer').classList.add('show');
        document.body.style.overflow = 'hidden';
        //console.log('AFTER ADD — drawer class:', gEl('specDrawer').className);
        //console.log('AFTER ADD — right:', window.getComputedStyle(gEl('specDrawer')).right);
        //console.log('AFTER ADD — display:', window.getComputedStyle(gEl('specDrawer')).display);
    } else {
        // desktop หรือ drawer elements ไม่พร้อม → ใช้ modal
        if (!drawerReady && isMobile()) {
            console.warn('drawer elements missing — check _SpecDrawer partial is included');
        }
        gEl('specModalContent').innerHTML = buildSpecHTML(p);
        gEl('specModalBackdrop').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    if (typeof initProductTabs === 'function') {
        await initProductTabs(p.code, isMobile() && drawerReady ? 'drawer' : 'inline', p.id);
    }
}

/* ── Desktop modal close ── */
function closeSpecModal(e) {
    if (e && e.target !== gEl('specModalBackdrop')) return;
    gEl('specModalBackdrop').classList.remove('open');
    document.body.style.overflow = '';
    document.querySelectorAll('.pcard').forEach(c => c.classList.remove('active-card'));
    gEl('rb4')?.classList.remove('active-badge');
    updateBreadcrumb(activeGroup, 'Parts Catalog');
}

/* ── Mobile drawer close ── */
function closeDrawer() {
    const dr = gEl('specDrawer');
    dr.classList.remove('show');
    gEl('drawerOverlay').classList.remove('show');
    document.body.style.overflow = '';
    document.querySelectorAll('.pcard').forEach(c => c.classList.remove('active-card'));
    gEl('rb4')?.classList.remove('active-badge');
    updateBreadcrumb(activeGroup, 'Parts Catalog');
}

/* ── Tab switching in MODAL ── */
function switchTabIn(btn, tabId, pid) {
    const container = btn.closest('.spec-modal-body') || btn.closest('.spec-wrap');
    if (!container) return;
    container.querySelectorAll('.stab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = container.querySelector(`#itab-${tabId}-${pid}`);
    if (pane) pane.classList.add('active');
    badge('rb4');

    // Lazy-load tab content ใน modal
    const stkcode = window._currentStkcode;
    if (stkcode && typeof loadModalTab === 'function') {
        loadModalTab(tabId, stkcode, pid);
    }
}

/* ── Tab switching in DRAWER ── */
// NOTE: switchDrTab ถูก define ใน productTabLoader.js
// ฟังก์ชันนี้เป็น fallback กรณี productTabLoader ยังไม่โหลด
function switchDrTab(btn, tabId) {
    gEl('specDrawer').querySelectorAll('.drtab').forEach(b => b.classList.remove('active'));
    gEl('specDrawer').querySelectorAll('.drpane').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    gEl('dp-' + tabId)?.classList.add('active');
    badge('rb4');
}

/* ── Add to cart from drawer ── */
/* จาก Mobile Drawer — ใช้ currentSpecProduct (normalized) */
async function addCartFromDrawer(e) {
    if (e) e.stopPropagation();

    const p = currentSpecProduct;
    if (!p) return;

    const qty = parseInt($("#drQty").val()) || 1;
    const btn = document.getElementById('drAddBtn');

    await _callAddToCartAPI(p, qty, btn);
}

/* ── Escape key ── */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (gEl('specModalBackdrop')?.classList.contains('open'))
        closeSpecModal({ target: gEl('specModalBackdrop') });
    else if (gEl('specDrawer')?.classList.contains('open'))
        closeDrawer();
});

/* ── Orientation change ── */
window.addEventListener('resize', () => {
    if (!isMobile() && gEl('specDrawer')?.classList.contains('open')) {
        const p = activeProduct;
        closeDrawer();
        if (p) {
            gEl('specModalContent').innerHTML = buildSpecHTML(p);
            gEl('specModalBackdrop').classList.add('open');
            document.body.style.overflow = 'hidden';
            if (typeof initProductTabs === 'function') {
                initProductTabs(p.code, 'modal', p.id);
            }
        }
    }
});

/* ═════════════════ GROUP BY HELPER ══════════════════ */
function groupByLine(list, forceByLine) {
    if (!list || !list.length) return [];

    const keyFn = p => {
        if (forceByLine) return p.line || 'อื่นๆ';
        if (currentSort === 'carModel') return p.carModel && p.carModel.trim() ? p.carModel : 'ใช้ได้ทั่วไป';
        if (currentSort === 'brand') return p.brand || 'อื่นๆ';
        if (currentSort === 'part') return p.line || 'อื่นๆ';
        if (currentSort === 'name') return p.name?.charAt(0).toUpperCase() || 'อื่นๆ';
        if (currentSort === 'price-asc' || currentSort === 'price-desc') return 'ทั้งหมด';
        return p.line || 'อื่นๆ';
    };

    const map = {};
    list.forEach(p => {
        const key = keyFn(p);
        if (!map[key]) map[key] = [];
        map[key].push(p);
    });

    return Object.entries(map).sort((a, b) =>
        (a[0] || '').localeCompare(b[0] || '', 'th')
    );
}
function nfScroll(rowId, dir) {
    const el = gEl(rowId);
    if (el) el.scrollBy({ left: dir * 660, behavior: 'smooth' });
}

/* ═════════════════ RENDER PRODUCTS ═══════════════════ */
function renderProducts(list) {
    const sorted = applySorting(list);
    const pGrid = gEl('pGrid');
    const nfRows = gEl('nfRows');
    const hasFilter = Object.keys(chkState.pl).length || fitState.size || Object.keys(chkState.br).length;

    gEl('rcount').textContent = sorted.length + ' items';

    const stockLabel = s =>
        s === 0 ? `<span class="pstock out-stock"><i class="bi bi-exclamation-circle-fill"></i> หมดสต็อก</span>` :
            s <= 5 ? `<span class="pstock low-stock"><i class="bi bi-exclamation-circle-fill"></i> เหลือ ${s}</span>` :
                `<span class="pstock in-stock"><i class="bi bi-check-circle-fill"></i> ${s} ชิ้น</span>`;

    const pcardHTML = p => `
        <div class="pcard ${hasFilter ? 'highlight-filter' : ''}" id="pc-${p.id}"
             onclick="openDrawer(${p.id},event)" style="cursor:pointer">
            <div class="pimg">
                ${stockLabel(p.stock ?? 99)}
                ${p.img
            ? `<img src="${p.img}" alt="${p.name}"
                   onerror="this.parentElement.innerHTML='<div class=\'no-image\'>No images found.</div>'">`
            : `<div class="no-image">
               <i class="bi bi-image" style="font-size:28px;color:var(--text-3)"></i>
               <span style="font-size:10px;color:var(--text-3);margin-top:4px">No image</span>
           </div>`}
            </div>
            <div class="pbody">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:3px">
                    <div class="pcode">${p.code}</div>
                    <div class="pname" style="font-size:10.5px;font-weight:700;color:var(--primary);
                         background:var(--primary-light);border-radius:20px;padding:1px 8px;
                         white-space:nowrap;flex-shrink:0">${p.brand}</div>
                </div>
                <div class="pname">${p.name}</div>
                ${p.carModel ? `
                <div style="display:flex;align-items:center;gap:5px;margin-top:4px;margin-bottom:2px">
                    ${p.carModel === 'Universal'
                ? `<span style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#fef9c3,#fde68a);
                                       color:#92400e;border:1px solid #f59e0b;border-radius:20px;padding:1px 9px;
                                       display:inline-flex;align-items:center;gap:3px">
                                       <i class="bi bi-stars" style="font-size:9px"></i> Universal</span>`
                : `<i class="bi bi-car-front-fill" style="font-size:10px;color:var(--text-3)"></i>
                           <span style="font-size:11px;color:var(--text-2);font-weight:500">${p.carModel}</span>`
            }
                </div>` : ''}
                ${p.fit && p.fit.length
            ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px">
                           ${p.fit.map(f => `<span style="font-size:10px;border:1px solid var(--border);
                               border-radius:10px;padding:1px 7px;color:var(--text-3)">${f}</span>`).join('')}
                       </div>` : ''}
                <div class="pprice">฿${p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })} <span>/ unit</span></div>
            </div>
            <div class="pfooter">
                <input type="number" class="qty" value="1" min="1" max="99"
                       id="qty-${p.id}" onclick="event.stopPropagation()">
                <button class="acart ${(p.stock ?? 99) === 0 ? 'bo-btn' : ''}"
                        id="cb-${p.id}" onclick="addCart(${p.id},event)">
                    <i class="bi ${(p.stock ?? 99) === 0 ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i>
                    ${(p.stock ?? 99) === 0 ? 'จอง (BO)' : 'เพิ่ม'}
                </button>
            </div>
        </div>`;
    // const noHTML = `
    //     <div class="no-results">
    //         <i class="bi bi-search"></i>
    //         <p>ไม่พบสินค้าตามเงื่อนไขที่เลือก<br>กรุณาเลือกข้อมูลรถยนต์ในแถบด้านซ้าย หรือปรับตัวกรอง</p>
    //     </div>`;

    // ✅ เพิ่ม 2 บรรทัดนี้
    const forceByLine = currentSort === 'part';
    const groups = groupByLine(sorted, forceByLine);

    // if (!groups || !groups.length) {
    const noHTML = `
        <div class="no-results">
            <i class="bi bi-search"></i>
            <p>ไม่พบสินค้าตามเงื่อนไขที่เลือก<br>กรุณาเลือกข้อมูลรถยนต์ในแถบด้านซ้าย หรือปรับตัวกรอง</p>
        </div>`;

    if (!groups || !groups.length) {
        pGrid.style.display = 'none';
        nfRows.style.display = 'flex';
        nfRows.innerHTML = noHTML;
        return;
    }

    /* ── NETFLIX MODE ── */
    pGrid.style.display = 'none';
    nfRows.style.display = 'flex';

    const groupIcon =
        currentSort === 'carModel' ? 'bi-car-front-fill' :
            currentSort === 'brand' ? 'bi-award' :
                currentSort === 'name' ? 'bi-sort-alpha-down' :
                    (currentSort === 'price-asc' || currentSort === 'price-desc') ? 'bi-currency-exchange' :
                        'bi-tag';   // part / default

    nfRows.innerHTML = groups.map(([lineName, products], idx) => {
        const rowId = `nfstrip-${idx}`;
        return `
            <div class="nf-row">
                <div class="nf-row-hd">
                    <i class="bi ${groupIcon}" style="color:var(--primary);font-size:13px"></i>
                    <span class="nf-row-title">${lineName}</span>
                    <span class="nf-row-cnt">${products.length} รายการ</span>
                </div>
                <div class="nf-strip-wrap">
                    <button class="nf-arr l" onclick="nfScroll('${rowId}',-1)"><i class="bi bi-chevron-left"></i></button>
                    <div class="nf-strip" id="${rowId}">
                        ${products.map(p => pcardHTML(p)).join('')}
                    </div>
                    <button class="nf-arr r" onclick="nfScroll('${rowId}',1)"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>`;
    }).join('');
}

/* ══════════════ APPLY ALL FILTERS ══════════════════ */
function applyAllFilters() {
    _applyFiltersAndRender();
}

/* ══════════════ ACTIVE FILTER CHIPS ══════════════════ */
/* ══════════════ ACTIVE FILTER CHIPS (รวม group + line + brand) ══════════════════ */
function renderActiveFilterChips() {
    const chips = [];

    // group chip (ถ้าไม่ใช่ "สินค้าทุกประเภท")
    const activeGroupStr = String(activeGroup || '0');
    if (activeGroupStr !== '0') {
        // ✅ แปลง g.id เป็น String ก่อนเทียบ
        const groupObj = GROUPS.find(g => String(g.id) === activeGroupStr);
        if (groupObj) {
            chips.push({ t: 'group', v: groupObj.label || groupObj.name, id: groupObj.id, cls: 'af-group' });
        }
    }

    // product line chips
    Object.keys(chkState.pl).forEach(v => chips.push({ t: 'pl', v, cls: 'af-pl' }));

    // brand chips
    Object.keys(chkState.br).forEach(v => chips.push({ t: 'br', v, cls: 'af-br' }));

    // fitting chips
    [...fitState].forEach(v => chips.push({ t: 'fi', v, cls: 'af-fi' }));

    const container = gEl('activeFilters');
    if (!container) return;

    if (!chips.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = chips.map(c =>
        `<span class="af-chip ${c.cls}" onclick="removeActiveChip('${c.t}','${(c.v || '').replace(/'/g, "\\'")}')">${c.v} <i class="bi bi-x-circle"></i></span>`
    ).join('');
}
/* ── ลบ chip ตัวเดียว แล้ว re-fetch ── */
function removeActiveChip(t, v) {
    if (t === 'group') {
        // กลับไปกลุ่ม "สินค้าทุกประเภท"
        selectGroup('0');
        return;
    }
    if (t === 'pl') {
        delete chkState.pl[v];
        document.querySelectorAll('#plList .chk-item').forEach(l => {
            if (l.getAttribute('data-name') === v) l.classList.remove('checked');
        });
    } else if (t === 'br') {
        delete chkState.br[v];
        document.querySelectorAll('#brList .chk-item').forEach(l => {
            if (l.getAttribute('data-name') === v) l.classList.remove('checked');
        });
    } else if (t === 'fi') {
        fitState.delete(v);
        document.querySelectorAll('.fit-chip').forEach(c => {
            if (c.textContent.trim() === v) c.classList.remove('active');
        });
    }

    showSkel();
    setTimeout(() => {
        hideSkel();
        _applyFiltersAndRender();
        gEl('nfRows')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}

function _resetSidebarFilters() {
    if (typeof chkState !== 'undefined') {
        chkState.pl = {};
        chkState.br = {};
    }
    if (typeof fitState !== 'undefined') {
        fitState.clear();
    }

    // Uncheck Checkbox ใน Sidebar
    document.querySelectorAll('#plList .chk-item, #brList .chk-item').forEach(el => {
        el.classList.remove('checked');
        const chk = el.querySelector('input[type="checkbox"]');
        if (chk) chk.checked = false;
    });

    // Reset Fitting Chips
    document.querySelectorAll('.fit-chip').forEach(c => c.classList.remove('active'));
}
/* ═════════════ §1 — VEHICLE FILTER ═════════════════════ */
function vfChange(sel, key) {
    activateSec(1);
    if (sel.value) { vfData[key] = sel.value; } else { delete vfData[key]; }
    renderVfTags();
    updateVehSummary();
    loadSearchProductVio();
}

function updateVehSummary() {
    const s = gEl('vehSummary');
    if (!s) return;
    const fields = [
        { id: 'marketsegId', icon: 'bi-globe-asia-australia' },
        { id: 'segmentId', icon: 'bi-car-front' },
        { id: 'makerId', icon: 'bi-building' },
        { id: 'rangeId', icon: 'bi-layers' },
        { id: 'bodyId', icon: 'bi-truck' },
        { id: 'engineId', icon: 'bi-gear' },
        { id: 'driveId', icon: 'bi-lightning-charge' }
    ];
    const pills = fields.map(f => {
        const el = document.getElementById(f.id);
        if (!el || !el.value) return null;
        const label = el.options[el.selectedIndex]?.text?.trim() || el.value;
        return `<div class="veh-pill"><i class="bi ${f.icon}"></i><span>${label}</span></div>`;
    }).filter(Boolean);

    s.innerHTML = pills.length
        ? pills.join('')
        : `<div class="veh-empty">
               <i class="bi bi-car-front" style="font-size:1.1rem"></i>
               <span>Select vehicle attributes in the left panel to filter parts</span>
           </div>`;
}

function renderVfTags() {
    gEl('vfTags').innerHTML = Object.entries(vfData).slice(0, 3).map(([k, v]) =>
        `<span class="ftag ftag-v" onclick="removeVfTag('${k}')">${v} <i class="bi bi-x-circle"></i></span>`
    ).join('');
}

function removeVfTag(k) {
    delete vfData[k];
    renderVfTags();
    updateVehSummary();
    loadSearchProductVio();
}

/* ═════════════ §2 — SEARCH ════════════════════ */
// function runSearch() {
//     activateSec(2);
//     const keyword = (gEl('partQ')?.value || gEl('headerQ')?.value || '').trim();

//     if (keyword.length < 2) {
//         toast('กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร', 'warn');
//         return;
//     }

//     showSkel();

//     if (BASE_PRODUCTS.length > 0) {
//         มี BASE_PRODUCTS → ลอง filter local ก่อน
//         const kw = keyword.toLowerCase();
//         const tokens = kw.split(' ').filter(t => t.length > 0);

//         const matched = BASE_PRODUCTS.filter(p => {
//             const searchText = [p.code, p.name, p.brand, p.cat, p.line, p.carModel]
//                 .join(' ').toLowerCase();
//             return tokens.every(token => searchText.includes(token));
//         });

//         if (matched.length > 0) {
//             เจอใน local → render เลย
//             setTimeout(() => {
//                 hideSkel();
//                 _applyFiltersAndRender();
//                 gEl('rz2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }, 200);
//         } else {
//             ไม่เจอใน local → เรียก Global Search API
//             searchProductGlobal(keyword);
//         }
//     } else {
//         ไม่มี BASE_PRODUCTS → เรียก Global Search API
//         searchProductGlobal(keyword);
//     }
// }
function runSearch() {
    activateSec(2);
    const keyword = (gEl('partQ')?.value || gEl('headerQ')?.value || '').trim();

    if (keyword.length < 2) {
        toast('กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร', 'warn');
        return;
    }

    showSkel();

    if (BASE_PRODUCTS.length > 0) {
        const kw = keyword.toLowerCase();
        const tokens = kw.split(' ').filter(t => t.length > 0);

        const matched = BASE_PRODUCTS.filter(p => {
            const searchText = [p.code, p.name, p.brand, p.cat, p.line, p.carModel]
                .join(' ').toLowerCase();
            return tokens.every(token => searchText.includes(token));
        });

        if (matched.length > 0) {
            // ✅ render matched โดยตรง ไม่ใช่ _applyFiltersAndRender() ที่ re-filter ใหม่
            setTimeout(() => {
                hideSkel();
                PRODUCTS = matched;
                renderProducts(PRODUCTS);
                _updateSidebar();
                renderActiveFilterChips();
                gEl('rz2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        } else {
            searchProductGlobal(keyword);
        }
    } else {
        searchProductGlobal(keyword);
    }
}

/* ══════════════ §3 — CHECKBOX FILTERS ══════════════════ */
// ── 1. toggleChk — อย่า override currentSort โดยไม่จำเป็น ──
// ── 1. toggleChk — อย่า override currentSort โดยไม่จำเป็น ──
// ── 1. toggleChk — อย่า override currentSort โดยไม่จำเป็น ──
// แก้เป็น — reset count ก่อน render เพื่อกัน count ค้าง
// แก้
function toggleChk(label, type, val) {
    label.classList.toggle('checked');
    if (label.classList.contains('checked')) {
        chkState[type][val] = true;
    } else {
        delete chkState[type][val];
    }
    activateSec(3);

    const hasFilter = Object.keys(chkState.pl).length > 0 || Object.keys(chkState.br).length > 0;

    if (!hasFilter) {
        BASE_PRODUCTS = [];
        PRODUCTS = [];
        PRODUCTS_FOR_COUNT = [];
        PRODUCTS_FOR_PL_COUNT = [];
        PRODUCTS_FOR_BR_COUNT = [];
        $("#plList .chk-item .chk-count, #brList .chk-item .chk-count").text(0);
        renderProducts([]);
        removeActiveChip('pl', val); // ✅
        return;
    }

    if (BASE_PRODUCTS.length > 0) {
        showSkel();
        setTimeout(() => {
            _applyFiltersAndRender();
            hideSkel();
            gEl('nfRows')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    } else {
        showSkel();
        searchProductByCategory().finally(() => {
            hideSkel();
            gEl('nfRows')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}
function toggleFit(chip, val) {
    chip.classList.toggle('active');
    if (chip.classList.contains('active')) { fitState.add(val); }
    else { fitState.delete(val); }
    activateSec(3);
    showSkel();

    if (BASE_PRODUCTS.length > 0) {
        setTimeout(() => {
            _applyFiltersAndRender();
            hideSkel();
        }, 200);
    } else {
        searchProductByCategory().finally(() => {
            hideSkel();
            renderActiveFilterChips();
        });
    }
}
/* ════════════════ CART ══════════════════ */
/* จาก Product Card — ใช้ PRODUCTS[] + id integer */
// ✅ แก้แล้ว
async function addCart(productId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    const qty = parseInt(gEl('qty-' + productId)?.value) || 1;
    const btn = gEl('cb-' + productId);
    await _callAddToCartAPI(p, qty, btn);
}
/* ══════════════════ SKELETON ══════════════════ */
function showSkel() {
    gEl('skelWrap').style.display = 'block';
    gEl('pGrid').style.display = 'none';
    gEl('nfRows').style.display = 'none';
}
function hideSkel() {
    gEl('skelWrap').style.display = 'none';
}

/* ═══════════════ BREADCRUMB ════════════════ */
function updateBreadcrumb(group, page) {
    gEl('bc3').textContent = page || 'Parts Catalog';
}

/* ════════════════ SECTION ACTIVATION ═════════════════ */
function activateSec(n) {
    [1, 2, 3, 4].forEach(i => {
        gEl('lb' + i)?.classList.remove('active-badge');
        gEl('rb' + i)?.classList.remove('active-badge');
    });
    gEl('rz1')?.classList.remove('g1', 'g2', 'g3', 'g4');
    gEl('rz2')?.classList.remove('g1', 'g2', 'g3', 'g4');

    if (n === 1) { glow('lb1', 'rb1', 'rz1', 'g1'); }
    else if (n === 2) { glow('lb2', 'rb2', 'rz2', 'g2'); }
    else if (n === 3) { badge('lb3'); badge('rb3'); gEl('rz2')?.classList.add('g3'); pulseEl('rz2'); }
    else if (n === 4) { badge('rb4'); }
}

function glow(lb, rb, zone, gc) {
    badge(lb); badge(rb);
    gEl(zone)?.classList.add(gc); pulseEl(zone);
}
function badge(id) { gEl(id)?.classList.add('active-badge'); }
function pulseEl(id) {
    const e = gEl(id); if (!e) return;
    e.classList.add('pulse');
    setTimeout(() => e.classList.remove('pulse'), 350);
}

/* ════════════════ CART PANEL ═════════════════ */
function openCart() {
    document.getElementById('cartPanel').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    // sync ล่าสุดจาก server ทุกครั้งที่เปิด
    _fetchCartFromServer();
}

function closeCart() {
    document.getElementById('cartPanel').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
}

/* removeFromCart — เรียก API delete แล้ว re-fetch */
function removeFromCart(ordId) {
    _deleteCartItem(ordId);
}

async function clearCart() {
    if (!cart.length) return;
    const ids = cart.map(c => c.id);
    for (const ordId of ids) {
        try {
            await fetch(urlsPro.delProductToCart, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ ordId })
            });
        } catch (e) {
            console.warn('clearCart delete error:', e);
        }
    }
    await _fetchCartFromServer();
    toast('🗑️ ล้างตะกร้าแล้ว', 'warn');
}

function updateCart() {
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const count = cart.reduce((s, c) => s + c.qty, 0);

    const cartCountEl = g('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;
    const cpCountEl = g('cpCount');
    if (cpCountEl) cpCountEl.textContent = `${cart.length} ชิ้น`;
    const cpTotalEl = g('cpTotal');
    if (cpTotalEl) cpTotalEl.textContent = fmt(total);
    const qsCartEl = g('qs-cart');
    if (qsCartEl) qsCartEl.textContent = cart.length;

    const cpBody = g('cpBody');
    if (!cpBody) return;

    if (!cart.length) {
        cpBody.innerHTML = `
            <div class="cp-empty">
                <i class="bi bi-cart-x"></i>
                <p>ยังไม่มีสินค้าในตะกร้า</p>
            </div>`;
        return;
    }

    cpBody.innerHTML = cart.map(c => `
        <div class="cart-row" id="cr-${c.id}">
            ${c.img
            ? `<img src="${c.img}" alt="${c.name}"
                        onerror="this.outerHTML='<div class=\\'no-imagecart\\'><i class=\\'bi bi-image\\'></i></div>'">`
            : `<div class="no-imagecart"><i class="bi bi-image"></i></div>`}
            <div class="cr-info">
                <div class="cr-name">
                    ${c.name}
                    ${c.isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> BO</span>' : ''}
                </div>
                <div class="cr-code">${c.code}</div>
                <div class="cr-price">${fmt(c.price)}</div>
            </div>
            <div class="cr-qty-ctrl">
                <button class="qty-btn" onclick="changeQty('${c.id}',-1)">
                    <i class="bi bi-dash"></i>
                </button>
                <span class="cr-qval">${c.qty}</span>
                <button class="qty-btn" onclick="changeQty('${c.id}',1)">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
            <button class="cr-del" onclick="removeFromCart('${c.id}')">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>`).join('');

    // ✅ ไม่ re-render osProductList ถ้ากำลัง changeQty อยู่
    const osOverlay = g('osOverlay');
    if (osOverlay && osOverlay.classList.contains('open') && !_isChangingQty) {
        renderOrderSummary();
        updateOsSelection();
    }
}


/* ═════════════ TOAST ═══════════════ */
function toast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'toast-item' + (type === 'warn' ? ' warn' : '');
    el.innerHTML = msg;
    g('toastRack').appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

/* ══════════════ AUTOCOMPLETE ════════════════ */
function buildSuggestions(q) {
    if (!q || q.length < 1) return [];
    const qLow = q.toLowerCase().trim();
    const results = [];
    const seen = new Set();

    PRODUCTS.forEach(p => {
        if (p.name.toLowerCase().includes(qLow) || p.code.toLowerCase().includes(qLow) ||
            (p.brand || '').toLowerCase().includes(qLow) || (p.cat || '').toLowerCase().includes(qLow)) {
            if (!seen.has(p.id)) {
                seen.add(p.id);
                results.push({ type: 'product', id: p.id, name: p.name, code: p.code, brand: p.brand || '', cat: p.cat || '', price: p.price });
            }
        }
    });

    const cats = [...new Set(PRODUCTS.map(p => p.cat || '').filter(Boolean))];
    cats.forEach(c => {
        if (c.toLowerCase().includes(qLow) && !seen.has('cat:' + c)) {
            seen.add('cat:' + c);
            results.push({ type: 'category', name: c, code: '', brand: '', cat: '', price: 0 });
        }
    });
    return results.slice(0, 8);
}

function highlightMatch(text, q) {
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
}

function renderAcDropdown(q) {
    const dd = gEl('acDropdown');
    const headerQ = gEl('headerQ');
    if (!dd || !headerQ) return;

    if (!acItems.length) {
        dd.classList.add('open');
        dd.innerHTML = `<div class="ac-header">ไม่พบสินค้าที่ค้นหา</div>`;
        return;
    }

    const products = acItems.filter(i => i.type === 'product');
    const cats = acItems.filter(i => i.type === 'category');
    let html = '';

    if (products.length) {
        html += `<div class="ac-header"><i class="bi bi-box-seam me-1"></i>สินค้า</div>`;
        products.forEach(item => {
            html += `
                <div class="ac-item" role="option"
                     data-val="${item.name}"
                     data-code="${item.code}"
                     onmousedown="acSelect(event,'${item.name.replace(/'/g, "\\'")}','${item.code.replace(/'/g, "\\'")}')">
                    <div class="ac-text">
                        <div class="ac-name">${highlightMatch(item.name, q)}</div>
                        <div class="ac-meta">
                            ${highlightMatch(item.code, q)}
                            ${item.brand ? ' · ' + item.brand : ''}
                            ${item.cat ? ' · ' + item.cat : ''}
                        </div>
                    </div>
                </div>`;
        });
    }

    if (cats.length) {
        html += `<div class="ac-header"><i class="bi bi-tag me-1"></i>หมวดหมู่</div>`;
        cats.forEach(item => {
            html += `
                <div class="ac-item" role="option"
                     data-val="${item.name}"
                     onmousedown="acSelect(event,'${item.name.replace(/'/g, "\\'")}','')">
                    <div class="ac-text">
                        <div class="ac-name">${highlightMatch(item.name, q)}</div>
                        <div class="ac-meta">ดูสินค้าในหมวด "${item.name}"</div>
                    </div>
                </div>`;
        });
    }

    dd.innerHTML = html;
    dd.classList.add('open');
    headerQ.setAttribute('aria-expanded', 'true');
}

function acInput(inp) {
    const q = inp.value.trim();
    acSelected = null; acFocusIdx = -1;
    updateMobSearchBtn(false);
    if (!q) { acClose(); return; }
    acItems = buildSuggestions(q);
    renderAcDropdown(q);
}

function acSelect(event, val, code) {
    if (event) event.preventDefault();
    gEl('headerQ').value = val;
    syncSearch('header');
    acSelected = val;
    acClose();
    updateMobSearchBtn(true);
    if (window.innerWidth > 575) runSearch();
}

function acClose() {
    const dd = gEl('acDropdown');
    dd.classList.remove('open');
    gEl('headerQ').setAttribute('aria-expanded', 'false');
    acFocusIdx = -1;
    acUpdateFocus();
}

function acKeyNav(event) {
    const dd = gEl('acDropdown');
    const items = dd.querySelectorAll('.ac-item');
    if (!dd.classList.contains('open')) {
        if (event.key === 'ArrowDown') acInput(gEl('headerQ'));
        return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); acFocusIdx = Math.min(acFocusIdx + 1, items.length - 1); acUpdateFocus(items); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); acFocusIdx = Math.max(acFocusIdx - 1, -1); acUpdateFocus(items); }
    else if (event.key === 'Enter') {
        event.preventDefault();
        if (acFocusIdx >= 0 && items[acFocusIdx]) {
            acSelect(null, items[acFocusIdx].getAttribute('data-val'), items[acFocusIdx].getAttribute('data-code') || '');
        } else if (acSelected) {
            runSearch();
        } else if (window.innerWidth > 575) {
            acClose(); runSearch();
        }
    } else if (event.key === 'Escape') { acClose(); }
}

function acUpdateFocus(items) {
    const dd = gEl('acDropdown');
    const allItems = items || dd.querySelectorAll('.ac-item');
    allItems.forEach((el, i) => el.classList.toggle('ac-focused', i === acFocusIdx));
    if (acFocusIdx >= 0 && allItems[acFocusIdx]) {
        const val = allItems[acFocusIdx].getAttribute('data-val');
        gEl('headerQ').value = val;
        acSelected = val;
        updateMobSearchBtn(true);
        allItems[acFocusIdx].scrollIntoView({ block: 'nearest' });
    }
}

function updateMobSearchBtn(enabled) {
    const btn = gEl('mobSearchBtn');
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.background = enabled ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.15)';
}

function doMobSearch() { if (acSelected) runSearch(); }

document.addEventListener('click', e => {
    const wrap = gEl('hSearchWrap');
    if (wrap && !wrap.contains(e.target)) acClose();
    const swrap = gEl('sidebarSearchWrap');
    if (swrap && !swrap.contains(e.target)) {
        const dd = gEl('acDropdownSidebar');
        if (dd) acCloseSidebar();   // ✅ guard ก่อนเรียก
    }
});

/* ── Sidebar AC ── */


function acInputSidebar(inp) {
    const q = inp.value.trim();
    acSbSelected = null; acSbFocusIdx = -1;
    if (!q) { acCloseSidebar(); return; }
    acSbItems = buildSuggestions(q);
    renderAcDropdownSidebar(q);
}

// ── ตัวที่ 2 (เก็บตัวนี้ไว้) แก้เป็น ──
function renderAcDropdownSidebar(q) {
    const dd = gEl('acDropdownSidebar');
    const partQ = gEl('partQ');
    if (!dd || !partQ) return;   // ✅ guard
    if (!acSbItems.length) {
        dd.classList.add('open'); return;
    }
    const products = acSbItems.filter(i => i.type === 'product');
    const cats = acSbItems.filter(i => i.type === 'category');
    let html = '';
    products.forEach(item => {
        html += `<div class="ac-item" role="option" data-val="${item.name}"
                      onmousedown="acSelectSidebar(event,'${item.name.replace(/'/g, "\\'")}')">
                     <div class="ac-text">
                         <div class="ac-name">${highlightMatch(item.name, q)}</div>
                         <div class="ac-meta">${highlightMatch(item.code, q)}${item.brand ? ' · ' + item.brand : ''}${item.cat ? ' · ' + item.cat : ''}</div>
                     </div>
                 </div>`;
    });
    if (cats.length) {
        html += `<div class="ac-header"><i class="bi bi-tag me-1"></i>หมวดหมู่</div>`;
        cats.forEach(item => {
            html += `<div class="ac-item" role="option" data-val="${item.name}"
                          onmousedown="acSelectSidebar(event,'${item.name.replace(/'/g, "\\'")}')">
                         <div class="ac-text">
                             <div class="ac-name">${highlightMatch(item.name, q)}</div>
                             <div class="ac-meta">ดูสินค้าในหมวด "${item.name}"</div>
                         </div>
                     </div>`;
        });
    }
    dd.innerHTML = html;
    dd.classList.add('open');
    partQ.setAttribute('aria-expanded', 'true');   // ✅ ใช้ partQ ที่ guard แล้ว
}

function acSelectSidebar(event, val) {
    if (event) event.preventDefault();
    const partQ = gEl('partQ');
    if (!partQ) return;   // ✅ guard
    partQ.value = val;
    syncSearch('sidebar');
    acSbSelected = val;
    acCloseSidebar();
    runSearch();
}

function acCloseSidebar() {
    const dd = gEl('acDropdownSidebar');
    const partQ = gEl('partQ');
    if (!dd || !partQ) return;   // ✅ guard
    dd.classList.remove('open');
    partQ.setAttribute('aria-expanded', 'false');
    acSbFocusIdx = -1;
    acUpdateFocusSidebar();
}

function acKeyNavSidebar(event) {
    const dd = gEl('acDropdownSidebar');
    const items = dd.querySelectorAll('.ac-item');
    if (!dd.classList.contains('open')) {
        if (event.key === 'ArrowDown') acInputSidebar(gEl('partQ'));
        return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); acSbFocusIdx = Math.min(acSbFocusIdx + 1, items.length - 1); acUpdateFocusSidebar(items); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); acSbFocusIdx = Math.max(acSbFocusIdx - 1, -1); acUpdateFocusSidebar(items); }
    else if (event.key === 'Enter') {
        event.preventDefault();
        if (acSbFocusIdx >= 0 && items[acSbFocusIdx]) acSelectSidebar(null, items[acSbFocusIdx].getAttribute('data-val'));
        else { acCloseSidebar(); runSearch(); }
    } else if (event.key === 'Escape') { acCloseSidebar(); }
}

function acUpdateFocusSidebar(items) {
    const dd = gEl('acDropdownSidebar');
    const partQ = gEl('partQ');
    if (!dd || !partQ) return;   // ✅ guard
    const all = items || dd.querySelectorAll('.ac-item');
    all.forEach((el, i) => el.classList.toggle('ac-focused', i === acSbFocusIdx));
    if (acSbFocusIdx >= 0 && all[acSbFocusIdx]) {
        partQ.value = all[acSbFocusIdx].getAttribute('data-val');
        all[acSbFocusIdx].scrollIntoView({ block: 'nearest' });
    }
}

/* ═════════════ MOBILE SIDEBAR ═══════════════ */
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const btn = document.getElementById('mobHamburger');
    const ov = document.getElementById('mobOverlay');

    const open = sb.classList.toggle('mob-open');

    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    ov.classList.toggle('visible', open);
}
gEl('mobOverlay').addEventListener('click', toggleSidebar);

/* ═════════════ COLLAPSE SYNC ═════════════════ */
document.querySelectorAll('.sec-hd').forEach(hd => {
    const t = hd.getAttribute('data-bs-target');
    const el = document.querySelector(t);
    if (el) {
        el.addEventListener('show.bs.collapse', () => hd.setAttribute('aria-expanded', 'true'));
        el.addEventListener('hide.bs.collapse', () => hd.setAttribute('aria-expanded', 'false'));
    }
});

// ── หลังแก้ ──
const _partQ = gEl('partQ');
const _headerQ = gEl('headerQ');
if (_partQ) _partQ.addEventListener('focus', () => { if (_partQ.value.trim()) acInputSidebar(_partQ); });
if (_headerQ) _headerQ.addEventListener('focus', () => { if (_headerQ.value.trim()) acInput(_headerQ); });

/* ══════════════ ORDER SUMMARY ═══════════════ */
const DISCOUNT_RATE = 0.075;
const VAT_RATE = 0.07;

/* ORDER SUMMARY — ต้องใช้ข้อมูลเดียวกับ cart[]*/
async function openOrderSummary(clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();
    if (!cart.length) {
        await _fetchCartFromServer();
        if (!cart.length) {
            toast('🛒 ยังไม่มีสินค้าในตะกร้า', 'warn');
            return;
        }
    } else {
        await _fetchCartFromServer();
    }

    renderOrderSummary();

    // ✅ โหลด ship-to list ทุกครั้งที่เปิด (ใช้ cache ถ้ามีแล้ว)
    if (!_shipToList.length) {
        await loadShipToList();
    } else {
        _renderShipToList(_shipToList);
        const firstItem = gEl('osAddrList')?.querySelector('.os-addr-item');
        if (firstItem) _selectAddrItem(firstItem);
    }

    closeCart();
    g('osOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

/* _loadCartFromServer — เก็บ backward compat ชื่อเดิม
   ทุกที่ที่เคยเรียก _loadCartFromServer() ยังใช้ได้ */
async function _loadCartFromServer() {
    await _fetchCartFromServer();
}


function closeOrderSummary() {
    gEl('osOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function osOverlayClick(e) {
    if (e.target === gEl('osOverlay')) closeOrderSummary();
}

/*renderOrderSummary — ใช้ cart[] ที่ sync มาจาก server*/
function renderOrderSummary() {
    const list = g('osProductList');
    if (!list) return;

    list.innerHTML = cart.map(c => `
        <div class="os-item" id="osItem-${c.id}">
            <label class="os-chk-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" class="os-item-chk" data-id="${c.id}" checked
                       onchange="updateOsSelection()">
                <span class="os-chk-box"></span>
            </label>
            <img class="os-thumb" src="${c.img}" alt="${c.name}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="os-thumb-ph" style="display:none">🔧</div>
            <div class="os-info">
                <div class="os-name">
                    ${c.name}
                    ${c.isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> BO</span>' : ''}
                </div>
                <div class="os-sku">${c.code}</div>
                <div class="os-price">${fmt(c.price)}</div>
            </div>
            <div class="os-stepper">
                <button class="os-step-btn" onclick="osChangeQty('${c.id}',-1)">−</button>
                <input class="os-step-input" type="number" value="${c.qty}" min="1"
                       onchange="osSetQty('${c.id}',this.value)"
                       oninput="osSetQty('${c.id}',this.value)">
                <button class="os-step-btn" onclick="osChangeQty('${c.id}',1)">+</button>
            </div>
            <button class="os-del-btn" onclick="osRemoveItem('${c.id}')">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>`).join('');

    updateOsSelection();
}
function osChangeQty(ordId, delta) {
    changeQty(ordId, delta);
}
function updateOsSelection() {
    const chks = document.querySelectorAll('.os-item-chk');
    const allChecked = [...chks].every(c => c.checked);
    const selectAllChk = g('osSelectAll');
    if (selectAllChk) selectAllChk.checked = allChecked;

    // ✅ ใช้ string เปรียบเทียบ ไม่ใช้ parseInt
    const selectedIds = [...chks]
        .filter(c => c.checked)
        .map(c => c.dataset.id);  // string เหมือน ordId

    const selectedItems = cart.filter(c => selectedIds.includes(String(c.id)));

    const totalQty = selectedItems.reduce((s, c) => s + c.qty, 0);
    const skuCount = selectedItems.length;
    const subtotal = selectedItems.reduce((s, c) => s + c.price * c.qty, 0);
    const net = subtotal;
    const vat = net * VAT_RATE;
    const total = net + vat;

    g('osItemBadge').textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''}`;
    g('osQtyCount').textContent = totalQty;
    g('osSkuCount').textContent = skuCount;
    g('osNet').textContent = fmt(net);
    g('osVat').textContent = fmt(vat);
    g('osTotal').textContent = fmt(total);
}

function osToggleSelectAll(chk) {
    document.querySelectorAll('.os-item-chk').forEach(c => c.checked = chk.checked);
    updateOsSelection();
}
/* changeQty — อัปเดตใน local แล้ว re-add ผ่าน API
   หมายเหตุ: ถ้า backend มี UpdateQty endpoint ให้เปลี่ยนตรงนี้ */


async function changeQty(ordId, delta) {
    _isChangingQty = true;
    const item = cart.find(c => c.id === ordId);
    if (!item) { _isChangingQty = false; return; }

    const newQty = Math.max(1, item.qty + delta);
    if (newQty === item.qty) { _isChangingQty = false; return; }

    // optimistic update UI ก่อน เพื่อความลื่นไหล
    const prevQty = item.qty;
    item.qty = newQty;
    _updateQtyUI(ordId, newQty, item.price);

    try {
        const res = await fetch(urlsPro.editProductToCart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                ordid: ordId,
                cuscod: window.APP_SESSION?.cuscode || '',   // ✅ เพิ่มบรรทัดนี้
                qty: newQty.toString(),
                price: item.price.toString()
            })
        });

        const json = await res.json().catch(() => null);

        if (!json || !json.IsSuccess) {
            // rollback UI ถ้า API ล้มเหลว
            item.qty = prevQty;
            _updateQtyUI(ordId, prevQty, item.price);
            toast(`❌ แก้ไขจำนวนไม่สำเร็จ: ${json?.Message || ''}`, 'warn');
            return;
        }

        toast(`✅ อัปเดตจำนวนเป็น ${newQty} แล้ว`);

    } catch (err) {
        console.error('changeQty error:', err);
        item.qty = prevQty;
        _updateQtyUI(ordId, prevQty, item.price);
        toast('❌ เกิดข้อผิดพลาด', 'warn');
        return;
    } finally {
        _isChangingQty = false;
    }

    // sync ค่าจริงจาก DB กลับมาอีกที เพื่อความชัวร์ (bust cache)
    await _fetchCartFromServer(true);
}

/* ── อัปเดตเฉพาะตัวเลข qty และ price ใน UI ── */
function _updateQtyUI(ordId, newQty, price) {
    // cpBody
    const crQval = document.querySelector(`#cr-${ordId} .cr-qval`);
    if (crQval) crQval.textContent = newQty;
    const crPrice = document.querySelector(`#cr-${ordId} .cr-price`);
    if (crPrice) crPrice.textContent = fmt(price * newQty);

    // osProductList
    const osInput = document.querySelector(`#osItem-${ordId} .os-step-input`);
    if (osInput) osInput.value = newQty;

    // อัปเดต total/badge
    updateOsSelection();
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const cartCountEl = g('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;
    const cpTotalEl = g('cpTotal');
    if (cpTotalEl) cpTotalEl.textContent = fmt(total);
}
/* osSetQty — set ค่า qty โดยตรง */


async function osSetQty(ordId, val) {
    const item = cart.find(c => c.id === ordId);
    if (!item) return;
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    const delta = n - item.qty;
    if (delta === 0) return;

    // ✅ debounce 600ms ป้องกันยิง API ทุก keystroke
    clearTimeout(_osSetQtyTimer);
    _osSetQtyTimer = setTimeout(async () => {
        await changeQty(ordId, delta);
    }, 600);
}
/* osRemoveItem — animate แล้วเรียก delete API */
function osRemoveItem(ordId) {
    const row = g('osItem-' + ordId);
    if (row) {
        row.style.transition = 'opacity .18s, transform .18s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(10px)';
        setTimeout(async () => {
            await _deleteCartItem(ordId);
            if (!cart.length) {
                closeOrderSummary();
                toast('🗑️ ตะกร้าว่างแล้ว', 'warn');
            }
        }, 200);
    } else {
        _deleteCartItem(ordId);
    }
}

function osSelectAddr(el) {
    gEl('osAddrList').querySelectorAll('.os-addr-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    const name = el.querySelector('.os-addr-name').textContent;
    const lines = [];
    el.childNodes.forEach(n => {
        if (n.nodeType === 3 || (n.nodeType === 1 && !n.classList.contains('os-addr-name') && !n.classList.contains('os-addr-phone'))) {
            const t = (n.textContent || '').trim(); if (t) lines.push(t);
        }
    });
    gEl('osAddrDisplay').innerHTML = `<strong>${name}</strong><br>${lines.join('<br>')}`;
    const addrLine = el.querySelector('div:not(.os-addr-name):not(.os-addr-phone)');
    const shortAddr = addrLine ? addrLine.textContent.trim() : lines[0] || '';
    const shortEl = gEl('osCurrentAddrShort');
    if (shortEl) shortEl.textContent = shortAddr;
    osCloseAddrPicker();
}
function osFilterAddr(q) {
    gEl('osAddrList').querySelectorAll('.os-addr-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
    });
}
function osToggleAddrPicker() {
    const picker = gEl('osAddrPicker');
    const isOpen = picker.style.display === 'flex';
    if (isOpen) { osCloseAddrPicker(); return; }
    picker.style.display = 'flex';
    picker.style.animation = 'osItemIn .2s ease both';
    gEl('osChangAddrBtn').innerHTML = '<i class="bi bi-x-circle"></i> ปิด';
    gEl('osChangAddrBtn').style.borderColor = '#fca5a5';
    gEl('osChangAddrBtn').style.color = '#9b0008';
    gEl('osChangAddrBtn').style.background = 'var(--red-light)';
    const inp = picker.querySelector('.os-addr-search');
    if (inp) { inp.value = ''; osFilterAddr(''); }
}
function osCloseAddrPicker() {
    gEl('osAddrPicker').style.display = 'none';
    const btn = gEl('osChangAddrBtn');
    btn.innerHTML = '<i class="bi bi-house-door"></i> เปลี่ยนที่อยู่ในการจัดส่ง';
    btn.style.borderColor = ''; btn.style.color = ''; btn.style.background = '';
}

function toggleSeeMore(type) {
    const btn = gEl(type + 'SeeMore');
    const isOpen = btn.classList.toggle('expanded');

    if (type === 'pl') {
        if (isOpen) {
            const allowed = currentAllowed.pl || [];
            document.querySelectorAll('.pl-extra').forEach(function (el) {
                const id = el.getAttribute('data-id');
                const show = allowed.length === 0 || allowed.includes(id);
                el.style.display = show ? '' : 'none';
            });
        } else {
            const SHOW_LIMIT = 5;
            const allowed = currentAllowed.pl || [];
            let visibleCount = 0;

            $("#plList .chk-item").each(function () {
                const id = $(this).attr('data-id');
                const inFilter = allowed.length === 0 || allowed.includes(id);
                if (!inFilter) return;

                visibleCount++;
                if (visibleCount > SHOW_LIMIT) {
                    $(this).hide();
                }
            });
        }
    } else {

        document.querySelectorAll('.' + type + '-extra').forEach(function (el) {
            el.style.display = isOpen ? '' : 'none';
        });
    }

    btn.innerHTML = isOpen
        ? '<i class="bi bi-chevron-up"></i> ดูน้อยลง'
        : '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
}

function osCheckout() {
    const btn = gEl('osCheckoutBtn');
    btn.classList.add('success');
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> กำลังดำเนินการ...';
    setTimeout(() => {
        btn.classList.remove('success');
        btn.innerHTML = '<i class="bi bi-credit-card-2-front me-2"></i> CHECKOUT';
        closeOrderSummary();
        cart = []; updateCart();
        toast('✅ สั่งซื้อสำเร็จแล้ว!');
    }, 2000);
}

function setupDropdown(triggerId, dropdownId) {
    const trigger = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);
    let open = trigger.classList.contains('open');

    function toggle(e) {
        e.stopPropagation();
        open = !open;
        trigger.classList.toggle('open', open);
        dropdown.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', open);
    }
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    document.addEventListener('click', () => {
        if (open) { open = false; trigger.classList.remove('open'); dropdown.classList.remove('open'); trigger.setAttribute('aria-expanded', false); }
    });
}
setupDropdown('trigger1', 'dropdown1');

/* ══════════════ API HELPER ══════════════════ */
async function ajaxCallApiService(url, params) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
        if (Array.isArray(value)) {
            value.forEach(v => qs.append(key, v));
        } else if (value !== undefined && value !== null) {
            qs.append(key, value);
        }
    }
    const response = await fetch(`${url}?${qs}`, { method: 'GET' });
    return await response.json();
}

/* ═══════════LOADING FILTER SELECTOR ═══════════════════ */
$(document).ready(function () {
    GetProductGroup();
    GetBrandS();
    GetProductionLine();
});
//----------- BrandS ----------------//
function GetBrandS() {
    $.ajax({
        url: urls.getBrands,
        method: 'GET',
        success: function (result) {
            if (result.IsSuccess) {
                RenderBrands(result.Data || []);
            } else {
                console.error("API Error:", result.Message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}
function RenderBrands(brands) {
    const $container = $("#brList");
    $container.empty();

    if (!brands || brands.length === 0) {
        $container.append('<span class="chk-empty">ไม่มีข้อมูล</span>');
        return;
    }

    const SHOW_LIMIT = 5;

    $.each(brands, function (index, brand) {
        const isExtra = index >= SHOW_LIMIT;
        const $label = $('<label>')
            .addClass('chk-item')
            .attr('data-id', brand.id)
            .attr('data-name', brand.name)
            .attr('data-filter', 'filterProductBrandId')
            .toggleClass('br-extra', isExtra)
            .css('display', isExtra ? 'none' : '')
            .attr('onclick', `toggleChk(this,'br','${brand.name}');`);

        $label.append(
            $('<div>').addClass('chk-box'),
            $('<span>').addClass('chk-label').text(brand.name),
            $('<span>').addClass('chk-count').text(brand.count ?? 0)
        );

        $container.append($label);
    });
}
//----------- ProductGroup ----------------//
const FIXED_GROUPS = [
    { id: '0', icon: 'bi-grid-3x3-gap', label: 'สินค้าทุกประเภท', isClear: true },
    { id: '99', icon: 'bi-stars', label: 'Universal' },
];

function GetProductGroup() {
    $.ajax({
        url: urls.getProductGroups,
        method: 'GET',
        // ✅ ไม่ส่ง prodgrpid เลย ให้ API ตัดสินใจเอง
        success: function (result) {
            if (result.IsSuccess) {
                const apiGroups = (result.Data || []).map(function (g) {
                    return {
                        id: g.prodgrpid,
                        icon: 'bi-tag',
                        label: g.prodgrpname
                    };
                });
                GROUPS = [...FIXED_GROUPS, ...apiGroups];
                renderBottomBar();
            } else {
                console.error("API Error:", result.Message);
                renderBottomBar();
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
            renderBottomBar();
        }
    });
}

//----------- ProductLine ----------------//
function GetProductionLine() {
    $.ajax({
        url: urls.getProductline,
        method: 'GET',
        success: function (res) {
            // ✅ รองรับทั้ง { IsSuccess, Data } และ { statusCode, result }
            const ok = res.IsSuccess === true || res.statusCode === 200;
            const data = res.Data || res.result || [];
            if (ok) {
                RenderProductionLines(data);
            } else {
                console.error("GetProductionLine Error:", res.Message || res.errorMessage);
            }
        },
        error: function (xhr, status, error) {
            console.error("GetProductionLine Ajax Error:", error);
        }
    });
}
function RenderProductionLines(lines) {
    const $container = $("#plList");
    $container.empty();

    if (!lines || lines.length === 0) {
        $container.append('<span class="chk-empty">ไม่มีข้อมูล</span>');
        return;
    }

    const SHOW_LIMIT = 5; // แสดงก่อน 5 รายการ

    $.each(lines, function (index, line) {
        const isExtra = index >= SHOW_LIMIT;
        //console.log(line);
        const $label = $('<label>')
            .addClass('chk-item')
            .attr('data-id', line.prodlineid)
            .attr('data-name', line.prodlinename)
            .attr('data-filter', 'filterProductLineId')
            .toggleClass('pl-extra', isExtra)
            .css('display', isExtra ? 'none' : '')
            .attr('onclick', `toggleChk(this,'pl','${line.prodlinename}');`);

        $label.append(
            $('<div>').addClass('chk-box'),
            $('<span>').addClass('chk-label').text(line.prodlinename),
            $('<span>').addClass('chk-count').text(line.count ?? 0)
        );
        $container.append($label);
    });
}
function ClickedMatchData() {
    const grpId = window.selectedGroupId || null;

    $.ajax({
        url: urls.getMatchProductionGroup,
        method: 'GET',
        data: { prodgrpid: grpId },
        success: function (result) {
            if (result.IsSuccess) {
                const allowedIds = (result.Data || []).map(x => x.prodlineid.toString());
                FilterProductionLines(allowedIds);
            } else {
                console.error('ClickedMatchData API Error:', result.Message);
            }
            _renderAfterGroupChange();
        },
        error: function (xhr, status, error) {
            console.error('ClickedMatchData error:', error);
            _renderAfterGroupChange();
        }
    });
}

function _renderAfterGroupChange() {
    // ✅ ถ้ามี BASE_PRODUCTS อยู่แล้ว (จาก vehicle/field search) → filter local ไม่ต้อง API ใหม่
    if (BASE_PRODUCTS.length > 0) {
        _applyFiltersAndRender();
        window._isSearchingCategory = false;
        document.querySelectorAll('.bb-item').forEach(b => b.style.pointerEvents = '');
        PRODUCTS_FOR_COUNT = [...PRODUCTS];
        _updateSidebar();
        renderActiveFilterChips();
        hideSkel();
    } else {
        // ✅ ดักจับ Error ด้วย .catch() ป้องกัน Error หลุดไป Console
        searchProductByCategory()
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Group change search failed:", err);
                }
            })
            .finally(() => {
                window._isSearchingCategory = false;
                document.querySelectorAll('.bb-item').forEach(b => b.style.pointerEvents = '');
                PRODUCTS_FOR_COUNT = [...PRODUCTS];
                _updateSidebar();
                renderActiveFilterChips();
            });
    }
}
// function _renderAfterGroupChange() {
//     hideSkel();
//     searchProductByCategory().finally(() => {
//         window._isSearchingCategory = false;
//         document.querySelectorAll('.bb-item').forEach(b => b.style.pointerEvents = '');
//         PRODUCTS_FOR_COUNT = [...PRODUCTS];
//         _updateSidebar();
//         renderActiveFilterChips();
//     });
// }

function FilterProductionLines(allowedIds) {
    currentAllowed.pl = allowedIds;

    // ล้าง chkState.pl ที่ไม่อยู่ใน group ใหม่
    Object.keys(chkState.pl).forEach(lineName => {
        const label = document.querySelector(`#plList .chk-item[data-name="${lineName}"]`);
        if (!label) { delete chkState.pl[lineName]; return; }
        const lineId = label.getAttribute('data-id');
        if (allowedIds.length > 0 && !allowedIds.includes(lineId)) {
            delete chkState.pl[lineName];
            label.classList.remove('checked');
        }
    });

    // ── sort pl ตาม count ก่อน แล้วค่อย show/hide ──
    const $plList = $('#plList');
    const $plChecked = $plList.find('.chk-item.checked').detach();

    $plList.find('.chk-item').sort((a, b) =>
        (parseInt($(b).find('.chk-count').text()) || 0) -
        (parseInt($(a).find('.chk-count').text()) || 0)
    ).appendTo($plList);

    $plList.prepend($plChecked);

    // show/hide ตาม allowedIds + top 5
    const SHOW_LIMIT = 5;
    let visibleCount = 0;
    $plList.find('.chk-item').each(function () {
        const id = $(this).attr('data-id');
        const allowed = allowedIds.length === 0 || allowedIds.includes(id);
        if (!allowed) {
            $(this).hide();
        } else {
            visibleCount++;
            $(this).toggle(visibleCount <= SHOW_LIMIT);
        }
    });

    const btn = gEl('plSeeMore');
    if (btn) {
        btn.classList.remove('expanded');
        btn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
    }
}
function toggleSec(hd, targetId) {
    const body = document.getElementById(targetId);
    if (!body) return;

    const isOpen = hd.getAttribute('aria-expanded') === 'true';
    hd.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

    if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => {
            body.style.transition = 'max-height .25s ease';
            body.style.maxHeight = '0';
            body.style.overflow = 'hidden';
        });
    } else {
        body.style.maxHeight = body.scrollHeight + 'px';
        body.style.overflow = '';
        setTimeout(() => { body.style.maxHeight = ''; }, 260);
    }
}

/* Extend the existing keydown listener to also close sidebar */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('open')) toggleSidebar();
});

/* CART — SINGLE SOURCE OF TRUTH
   cart[] ถูก populate จาก server เท่านั้น
   Primary key = ordId (string จาก API)*/

/* ── Map API response row → cart item ── */
function _mapCartItem(item) {
    return {
        id: item.ordId || '',          // PK ใช้ ordId ตลอด
        code: item.stkcod || '—',
        name: item.stkdes || '—',
        price: parseFloat(item.price) || 0,
        qty: parseInt(item.qty) || 1,
        img: item.imagePath || '',
        brand: item.stkgrp || '—',
        isBO: item.backOrder === '1',
        uom: item.uom || '',
        amt: parseFloat(item.amt) || 0
    };
}

/* ── Fetch cart จาก server แล้ว render ทุก view ── */
async function _fetchCartFromServer(forceRefresh = false) {
    try {
        const cuscode = window.APP_SESSION?.cuscode || '';
        // const url = forceRefresh
        //     ? `/Product/GetProductToCart?cuscode=${encodeURIComponent(cuscode)}&t=${Date.now()}`
        //     : `/Product/GetProductToCart?cuscode=${encodeURIComponent(cuscode)}`;

        const url = forceRefresh
            ? `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}&t=${Date.now()}`
            : `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}`;
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();

        if (json.IsSuccess && Array.isArray(json.Data) && json.Data.length > 0) {
            cart = json.Data.map(_mapCartItem);
        } else {
            cart = [];
        }
    } catch (err) {
        console.warn('_fetchCartFromServer failed:', err);
    }

    updateCart();
}
/* ── Delete สินค้าจาก server แล้ว re-fetch ── */
async function _deleteCartItem(ordId) {
    if (!ordId) {
        console.warn('_deleteCartItem: ordId is empty');
        return;
    }
    console.log('Deleting ordId:', ordId);   // ✅ debug ก่อน ดูว่าค่าถูกไหม
    try {
        const res = await fetch(urlsPro.delProductToCart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                ordId,
                username: window.APP_SESSION?.username || ''
            })
        });
        const json = await res.json();
        if (!json.IsSuccess) {
            toast(`❌ ลบไม่สำเร็จ: ${json.Message || ''}`, 'warn');
            await _fetchCartFromServer();
            return;
        }
        await _fetchCartFromServer(true);
    } catch (err) {
        console.error('_deleteCartItem error:', err);
        toast('❌ เกิดข้อผิดพลาดในการลบสินค้า', 'warn');
        await _fetchCartFromServer();
    }
}

/* ════════════════SHIP-TO LIST — fetch from API, render dynamically
   Called once when OS modal opens═══════════════ */

// cache so we don't re-fetch every open

async function loadShipToList() {
    try {
        const cuscode = window.APP_SESSION?.cuscode || '';
        const res = await fetch(`${urls.getShiptoByCuscode}?cuscode=${encodeURIComponent(cuscode)}`, {
            method: 'GET'
        });
        const json = await res.json();

        if (!json.IsSuccess || !Array.isArray(json.Data) || !json.Data.length) {
            const firstItem = gEl('osAddrList')?.querySelector('.os-addr-item');
            if (firstItem) _selectAddrItem(firstItem);
            return;
        }

        _shipToList = json.Data;
        _renderShipToList(_shipToList);

    } catch (err) {
        console.error('loadShipToList error:', err);
    }
}

function _renderShipToList(list) {
    const container = gEl('osAddrList');
    if (!container) return;

    container.innerHTML = list.map((s, idx) => {
        const fullAddr = [s.address, s.address2, s.city, s.postCode]
            .filter(Boolean).join(' ');
        const isMain = idx === 0;
        const phone = s.phone || s.contact || '—';

        return `
        <div class="os-addr-item${isMain ? ' selected' : ''}"
             data-shipto="${s.shipCode}"
             onclick="osSelectAddr(this)">
            <div class="os-addr-name">
                ${s.name}
                ${isMain ? `<span style="font-size:9px;background:#fd152f;color:#fff;
                    border-radius:4px;padding:1px 6px;margin-left:4px;
                    vertical-align:middle">ที่อยู่หลัก</span>` : ''}
            </div>
            <div>${fullAddr}</div>
            <div class="os-addr-phone">${phone}</div>
        </div>`;
    }).join('');

    // ✅ update badge จำนวน
    const totalEl = gEl('totalAddr');
    if (totalEl) totalEl.innerText = list.length + ' ที่อยู่';

    // ✅ default เลือก item แรกเสมอ
    const firstItem = container.querySelector('.os-addr-item');
    if (firstItem) _selectAddrItem(firstItem);
}
/* ── Select an address item (shared logic) ── */
function _selectAddrItem(el) {
    gEl('osAddrList')?.querySelectorAll('.os-addr-item')
        .forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');

    const name = el.querySelector('.os-addr-name')?.textContent?.trim() || '';
    const lines = [...el.children]
        .filter(n => !n.classList.contains('os-addr-name') && !n.classList.contains('os-addr-phone'))
        .map(n => n.textContent.trim())
        .filter(Boolean);
    const phone = el.querySelector('.os-addr-phone')?.textContent?.trim() || '';

    const display = gEl('osAddrDisplay');
    if (display) {
        display.innerHTML = `<strong>${name}</strong><br>${lines.join('<br>')}${phone && phone !== '—' ? '<br>' + phone : ''}`;
    }

    const shortEl = gEl('osCurrentAddrShort');
    if (shortEl) shortEl.textContent = lines[0] || '';
}

/* ── Override osSelectAddr to use shared logic ── */
function osSelectAddr(el) {
    _selectAddrItem(el);
    osCloseAddrPicker();
}

/* ── osUseInvoiceAddr → always default to first item ── */
function osUseInvoiceAddr() {
    const firstItem = gEl('osAddrList')?.querySelector('.os-addr-item');
    if (firstItem) _selectAddrItem(firstItem);
    osCloseAddrPicker();
    toast('✅ ใช้ที่อยู่ในใบกำกับภาษี');
}

// =================  INIT ===========================
document.addEventListener('DOMContentLoaded', function () {
    const config = document.getElementById('appConfig');
    const userType = config?.dataset.usertype ?? '';
    const sessionSlm = config?.dataset.slmcode ?? '';
    const sessionCus = config?.dataset.cuscode ?? '';

    // console.log('Session →', { userType, sessionSlm, sessionCus });

    if (userType === '1') {
        // admin → ดึง salesman ทั้งหมดมาให้เลือกเสมอ (ไม่ว่าจะมี sessionSlm หรือไม่)
        getSalesmanAll(sessionSlm, sessionCus);
    } else if (sessionCus) {
        getInfomantionCustomer(sessionCus);
    } else if (sessionSlm) {
        getCustomerbySalesman(sessionSlm, '');
    } else {
        // ไม่มีทั้ง slmcode/cuscode ผูกมากับ user นี้ → โหลด customer ทั้งหมด
        getCustomerbySalesman('', '');
    }
});

// ================ 1. GET SALESMAN ALL ========================
function getSalesmanAll(sessionSlm, sessionCus) {
    $.ajax({
        url: urls.getSalesmanAll,
        method: 'GET',
        success: function (data) {
            if (!data.IsSuccess) return;

            const select = $('#salesmanId');
            select.empty().append('<option value="">-- เลือก Salesman --</option>');

            $.each(data.Data, function (i, slm) {
                const fullText = `${slm.slmCode} - ${slm.slmName}`;
                select.append(
                    $('<option>', {
                        value: slm.slmCode,
                        text: fullText,
                        'data-full': fullText,
                        'data-name': slm.slmName
                    })
                );
            });

            if (sessionSlm) {
                select.val(sessionSlm);
            }
            _shortenSelected('salesmanId');   // ✅ ตอน init ให้เหลือแค่ชื่อทันทีถ้ามีค่าอยู่แล้ว
            getCustomerbySalesman(sessionSlm || '', sessionCus);

            select.off('change').on('change', function () {
                _shortenSelected('salesmanId');
                if ($(this).val()) {
                    getCustomerbySalesman($(this).val(), '');
                } else {
                    clearCustomerSelect();
                    clearCustomerCard();
                    getCustomerbySalesman('', '');
                }
            });

            _bindSelectToggle('salesmanId');   // ✅ bind mousedown/focus/blur ครั้งเดียวพอ
        },
        error: function (xhr, status, error) {
            console.error('getSalesmanAll error:', error);
        }
    });
}

function getCustomerbySalesman(slmcode, sessionCus) {
    $.ajax({
        url: urls.getCustomerbySalesman,
        method: 'GET',
        data: { slmcode: slmcode },
        success: function (data) {
            if (!data.IsSuccess) return;

            const select = $('#customerId');   // ← ตรงนี้มี select ประกาศจริง
            if (!select.length) return;

            const activeCompanies = getActiveCompanies();
            select.empty().append('<option value="">-- เลือก Customer --</option>');

            $.each(data.Data, function (i, cus) {
                if (cus.inactive === 'Y' || cus.block === 1) return;
                if (activeCompanies.length > 0 && !activeCompanies.includes(cus.company)) return;

                const fullText = `${cus.cuscode} - ${cus.cusname}`;
                select.append(
                    $('<option>', {
                        value: cus.cuscode,
                        text: fullText,
                        'data-full': fullText,
                        'data-name': cus.cusname,
                        'data-company': cus.company
                    })
                );
            });

            if (sessionCus) {
                select.val(sessionCus);
                if (window.APP_SESSION) window.APP_SESSION.cuscode = sessionCus;
                getInfomantionCustomer(sessionCus);
                _fetchCartFromServer();   // ✅ ดึง cart ของลูกค้านี้ตั้งแต่โหลดหน้า
            }
            _shortenSelected('customerId');

            select.off('change').on('change', function () {
                _shortenSelected('customerId');
                const selectedCus = $(this).val();

                if (window.APP_SESSION) window.APP_SESSION.cuscode = selectedCus || '';

                if (selectedCus) {
                    getInfomantionCustomer(selectedCus);
                    _fetchCartFromServer(true);   // ✅ ดึง cart เดิมของลูกค้าคนนี้ขึ้นมาทันที (bust cache)
                } else {
                    clearCustomerCard();
                    cart = [];                    // ✅ ยกเลิกเลือกลูกค้า → เคลียร์ cart ที่แสดงด้วย
                    updateCart();
                }
            });

            _bindSelectToggle('customerId');
        },
        error: function (xhr, status, error) {
            console.error('getCustomerbySalesman error:', error);
        }
    });
}
/* ── คืนค่าเต็ม (code - name) ให้ทุก option ก่อนเปิด list ── */
function _restoreFullText(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    Array.from(select.options).forEach(opt => {
        const full = opt.getAttribute('data-full');
        if (full) opt.textContent = full;
    });
}

/* ── ย่อ text ของ option ที่ถูกเลือกอยู่ ให้เหลือแค่ชื่อ (ใช้ตอนปิด/เลือกเสร็จ) ── */
function _shortenSelected(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const opt = select.options[select.selectedIndex];
    if (opt && opt.value) {
        const name = opt.getAttribute('data-name');
        if (name) opt.textContent = name;
    }
}

/* ── bind event ครั้งเดียวต่อ select: เปิด → คืน full, ปิด/blur → ย่อกลับ ── */
function _bindSelectToggle(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.toggleBound) return;   // กัน bind ซ้ำ
    select.dataset.toggleBound = '1';

    select.addEventListener('mousedown', () => _restoreFullText(selectId));
    select.addEventListener('focus', () => _restoreFullText(selectId));
    select.addEventListener('blur', () => _shortenSelected(selectId));
}
// ================ 3. GET INFORMATION CUSTOMER ==========================
function getInfomantionCustomer(cuscode) {
    $.ajax({
        //url: '/Master/GetInfomantionCustomer',
        url: urls.getInfomantionCustomer,
        method: 'GET',
        data: { cuscode: cuscode },
        success: function (data) {
            if (!data.IsSuccess || !data.Data || data.Data.length === 0) {
                console.warn('No customer data found for →', cuscode);
                return;
            }
            const cus = data.Data[0];

            if (window.APP_SESSION) window.APP_SESSION.cuscode = cus.cuscode || cuscode;

            renderCustomerCard(cus);
        },
        error: function (xhr, status, error) {
            console.error('getInfomantionCustomer error:', error);
        }
    });
}
// ================RENDER: Customer Card (ขนาดไม่ยุบ)=================
function renderCustomerCard(cus) {
    const info = document.querySelector('#customerCard .customer-info');
    if (!info) return;

    info.innerHTML = `
        <div class="mb-2"><strong>${cus.cusname ?? '-'}</strong></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0px 10px; font-size:10px;">
            <div><span class="text-muted">Salesman: </span><strong>${cus.slmcode ?? '-'}</strong></div>
            <div><span class="text-muted">Customer Code: </span><strong>${cus.cuscode ?? '-'}</strong></div>
            <div><span class="text-muted">Tel: </span><strong>${cus.phone ?? '-'}</strong></div>
            <div><span class="text-muted">Payment term: </span><strong>${cus.rating ?? '-'}</strong></div>
        </div>
    `;
}

function clearCustomerCard() {
    const info = document.querySelector('#customerCard .customer-info');
    if (!info) return;

    info.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; height:100%; padding:20px; background-color:#fff0f0; border-radius:10px;">
            <strong>ไม่พบข้อมูลลูกค้า</strong>
        </div>
    `;
}

function clearCustomerSelect() {
    const select = document.getElementById('customerId');
    if (select) select.innerHTML = '<option value="">-- เลือก Customer --</option>';
}

// ==========HELPER: Company Toggle================
function getActiveCompanies() {
    return [...document.querySelectorAll('.company-btn[aria-pressed="true"]')]
        .map(btn => btn.dataset.company);
}

// ฟังก์ชันบันทึกและจัดการการคลิก
function toggleCompany(btn) {
    const container = btn.closest('.company-group');
    const isCurrentlyPressed = btn.getAttribute('aria-pressed') === 'true';

    // 1. ปิดสถานะของทุกปุ่มในกลุ่มก่อน
    if (container) {
        container.querySelectorAll('.company-btn').forEach(b => {
            b.setAttribute('aria-pressed', 'false');
        });
    }

    // 2. ถ้าปุ่มที่กดไม่ได้เปิดอยู่ ให้เปิดใช้งาน (ถ้าเปิดอยู่แล้วกดซ้ำ จะเป็นการยกเลิกเลือก)
    let selectedCompany = '';
    if (!isCurrentlyPressed) {
        btn.setAttribute('aria-pressed', 'true');
        selectedCompany = btn.getAttribute('data-company');
    }

    // 3. บันทึกลง window.APP_SESSION
    if (!window.APP_SESSION) window.APP_SESSION = {};
    window.APP_SESSION.company = selectedCompany || 'TAC';

    // 4. ✅ เซฟลง sessionStorage (หรือ localStorage) เพื่อให้ค่าไม่หายตอนรีเฟรช
    sessionStorage.setItem('selected_company', window.APP_SESSION.company);

    // 5. โหลดข้อมูลลูกค้าใหม่
    const selectedSlm = document.getElementById('salesmanId')?.value;
    if (selectedSlm) {
        getCustomerbySalesman(selectedSlm, '');
    }
}

// ✅ ฟังก์ชันดึงค่าที่เคยเลือกไว้กลับมาแสดง (เรียกใช้ตอนโหลดหน้าเว็บ)
function initCompanySelection() {
    if (!window.APP_SESSION) window.APP_SESSION = {};

    // อ่านค่าจาก sessionStorage (ถ้าไม่มีให้ใช้ 'TAC' เป็นค่าเริ่มต้น)
    const savedCompany = sessionStorage.getItem('selected_company') || window.APP_SESSION.company || 'TAC';
    window.APP_SESSION.company = savedCompany;

    // ค้นหาปุ่มที่ตรงกับค่าที่บันทึกไว้ แล้วตั้งค่า aria-pressed="true"
    const targetBtn = document.querySelector(`.company-btn[data-company="${savedCompany}"]`);
    if (targetBtn) {
        const container = targetBtn.closest('.company-group');
        if (container) {
            container.querySelectorAll('.company-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
        }
        targetBtn.setAttribute('aria-pressed', 'true');
    }
}

// เรียกทำงานทันทีเมื่อโหลด DOM เสร็จสิ้น
document.addEventListener('DOMContentLoaded', initCompanySelection);

/* ════════════ THEME SWITCH (ลบฟังก์ชันนี้ + เรียก initTheme() ทิ้งได้ถ้าเลิกใช้)════════════ */
const THEME_KEY = 'truTheme';

function toggleTheme() {
    const isBlue = document.body.classList.toggle('theme-blue');
    localStorage.setItem(THEME_KEY, isBlue ? 'blue' : 'default');
}
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'blue') {
        document.body.classList.add('theme-blue');
    }
}
initTheme();
//-----------------กันคลิกขวา คัดลอกรูป save img และคีย์ลัด------------------//