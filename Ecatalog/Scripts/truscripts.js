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
let _searchRequestVersion = 0;
let MASTER_BRANDS = [];
let MASTER_PRODUCT_LINES = [];
let _sidebarForcedReset = false;
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
        target.closest('.os-item') ||
        target.closest('#_imgLb')  // ✅ เพิ่มบรรทัดนี้
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
    initBottomBar();
    renderBottomBar();
    renderProducts(PRODUCTS);

    // ✅ โหลด cart จาก server เมื่อเปิดหน้า
    _fetchCartFromServer();
});

/* ══════════════ API: MAP RESPONSE → FLAT PRODUCTS ═══════════════ */

function mapApiResponseToProducts(groups) {
    const list = [];
    let autoId = 1;

    (groups || []).forEach(group => {
        const groupLabel = (group.productGroupNameMain || '').trim() || 'อื่นๆ';

        (group.productList || []).forEach(item => {
            if (!item.stkcode) return;

            const qty = parseInt(item.qtyReady, 10);
            const maker = (item.makerName || '').trim();
            const model = (item.modelName || '').trim();
            const PLACEHOLDER = ['makername', 'modelname', 'makerName', 'modelName'];

            const carParts = [maker, model].filter(v =>
                v && !PLACEHOLDER.map(p => p.toLowerCase()).includes(v.toLowerCase())
            );
            const carModel = carParts.join(' ') || '';

            list.push({
                id: autoId++,
                code: item.stkcode || '',
                name: item.stkcodeDescription || item.stkcode || '—',
                price: parseFloat(item.price) || 0,
                priceTiers: item.priceTiers || [],
                stock: isNaN(qty) ? 99 : qty,
                cat: item.productGroup || groupLabel,
                catId: String(item.productGroupId || group.productGroupId || ''),
                brand: item.brand || '—',
                line: item.productLine || 'อื่นๆ',
                carModel,
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
    window._lastApiGroups = groups; // ✅ เก็บ raw ไว้ re-map ภายหลัง
    BASE_PRODUCTS = mapApiResponseToProducts(groups || []);

    // Auto check stock filters ตามข้อมูลที่โหลดมา
    const inStockEl = document.getElementById('inStock');
    const outStockEl = document.getElementById('outStock');

    if (inStockEl) {
        inStockEl.checked = BASE_PRODUCTS.some(p => (p.stock ?? 99) > 0);
    }

    if (outStockEl) {
        outStockEl.checked = BASE_PRODUCTS.some(p => (p.stock ?? 99) === 0);
    }

    if (searchType === 'vehicle' || searchType === 'part') {
        chkState = { pl: {}, br: {} };
        if (typeof pgmResetSaved === 'function') pgmResetSaved();   // ✅ เพิ่ม
        fitState = new Set();
        document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));
        document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

        // ✅ reset กลุ่มสินค้าที่ค้างจาก category search
        activeGroup = '0';
        window.selectedGroupId = '0';
        document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
        document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

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
    // console.log('_lastSearchType:', _lastSearchType); ✅ เพิ่มบรรทัดนี้
    const q = _lastSearchType === 'part' ? '' : (gEl('partQ')?.value || '').toLowerCase().trim();
    const plKeys = Object.keys(chkState.pl);
    const brKeys = Object.keys(chkState.br);
    const fitK = [...fitState];

    const activeGroupStr = String(activeGroup);
    const activeGroupObj = GROUPS.find(g => String(g.id) === activeGroupStr);
    const skipGroup = _lastSearchType === 'part';
    const filterByCat = !skipGroup && activeGroupStr !== '0' && activeGroupStr !== '99' && !!activeGroupObj;
    const filterUniversal = !skipGroup && activeGroupStr === '99';

    const baseFiltered = BASE_PRODUCTS.filter(p => {
        if (!filterUniversal && gEl('makerId')?.value && !p.carModel) return false;
        if (filterUniversal && p.carModel !== 'Universal') return false;
        if (filterByCat && p.carModel !== 'Universal' && p.catId !== activeGroupStr && p.cat !== activeGroupObj.label) return false;
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

    PRODUCTS_FOR_BR_COUNT = plKeys.length
        ? baseFiltered.filter(p => plKeys.includes(p.line))
        : [...baseFiltered];

    PRODUCTS_FOR_PL_COUNT = plKeys.length
        ? baseFiltered.filter(p => plKeys.includes(p.line))
        : brKeys.length
            ? baseFiltered.filter(p => brKeys.includes(p.brand))
            : [...baseFiltered];

    // ✅ ถ้ามาจาก category search (API กรองมาให้แล้ว) ไม่ต้องกรอง pl/br ซ้ำ
    if (_lastSearchType === 'category' || _lastSearchType === 'part') {
        // console.log('baseFiltered.length:', baseFiltered.length); ✅ เพิ่มบรรทัดนี้
        PRODUCTS = [...baseFiltered];
    } else {
        PRODUCTS = baseFiltered.filter(p => {
            if (plKeys.length && !plKeys.includes(p.line)) return false;
            if (brKeys.length && !brKeys.includes(p.brand)) return false;
            return true;
        });
    }

    const inStockChecked = document.getElementById('inStock')?.checked;
    const outStockChecked = document.getElementById('outStock')?.checked;

    if (inStockChecked || outStockChecked) {
        PRODUCTS = PRODUCTS.filter(p => {
            const hasStock = (p.stock ?? 99) > 0;
            const noStock = (p.stock ?? 99) === 0;
            return (inStockChecked && hasStock) || (outStockChecked && noStock);
        });
    }

    _updateStockFilterLabel();
    renderProducts(PRODUCTS);
    _updateSidebar();
    renderActiveFilterChips();
    _ensureSidebarVisibility();
    updateVehSummary();
}

function _updateStockFilterLabel() {
    const inStock = document.getElementById('inStock')?.checked;
    const outStock = document.getElementById('outStock')?.checked;
    const btn = document.getElementById('sortDropdownBtn');
    if (!btn) return;

    const sortLabels = {
        'carModel': 'รุ่นรถ',
        'part': 'หมวดหมู่',
        'brand': 'ยี่ห้อสินค้า',
        'price-asc': 'ราคา: น้อย → มาก',
        'price-desc': 'ราคา: มาก → น้อย',
        'name': 'ชื่อ: A-Z'
    };

    let label = 'เรียงตาม: ' + (sortLabels[currentSort] || 'รุ่นรถ');

    if (inStock && outStock) label += '/สต็อกสุทธิ';
    else if (inStock) label += '/มีสินค้า';
    else if (outStock) label += '/หมดสต็อก';

    btn.innerHTML = label + ' <span class="sort-arrow">▼</span>';
}

// 🔧 ฟังก์ชันช่วยจัดการการโชว์/ซ่อน รายการ Sidebar ไม่ให้หุบหาย
function _ensureSidebarVisibility() {
    const hasAnyFilter =
        Object.keys(chkState.pl).length > 0 ||
        Object.keys(chkState.br).length > 0 ||
        fitState.size > 0;

    ['pl', 'br'].forEach(type => {
        const listEl = $(`#${type}List`);
        const items = listEl.find('.chk-item');
        const btn = gEl(`${type}SeeMore`);
        const isExpanded = btn?.classList.contains('expanded');

        if (items.length > 0) {
            if (hasAnyFilter) {
                items.each((idx, el) => {
                    const count = parseInt($(el).find('.chk-count').text()) || 0;
                    $(el).toggle(count > 0);
                });
            } else {
                // ✅ แสดงเฉพาะ count > 0 และไม่เกิน 5
                let visible = 0;
                items.each((idx, el) => {
                    const count = parseInt($(el).find('.chk-count').text()) || 0;
                    if (count === 0) {
                        $(el).hide();
                        return;
                    }
                    if (isExpanded || visible < 5) {
                        $(el).show();
                        visible++;
                    } else {
                        $(el).hide();
                    }
                });
            }
        }

        if (btn) {
            const totalVisible = items.filter((_, el) => $(el).is(':visible')).length;
            const countAboveZero = items.filter((_, el) =>
                (parseInt($(el).find('.chk-count').text()) || 0) > 0
            ).length;
            // ✅ แสดง button ถ้ามี item ที่ count > 0 มากกว่า 5 แม้บางตัวจะถูกซ่อนอยู่
            btn.style.display = countAboveZero > 5 ? 'block' : 'none';
        }
    });
}
function _updateSidebar() {
    // ── Product Line (PL) ──
    const plCounts = {};
    const plSeen = new Set();
    (PRODUCTS_FOR_PL_COUNT || []).forEach(p => {
        if (p && p.line) {
            const key = p.line.trim() + '|' + p.code;
            if (!plSeen.has(key)) {
                plSeen.add(key);
                const name = p.line.trim();
                plCounts[name] = (plCounts[name] || 0) + 1;
            }
        }
    });

    $('#plList .chk-item').each(function () {
        const name = $(this).attr('data-name');
        const count = plCounts[name] ?? 0;
        $(this).find('.chk-count').text(count);
    });

    const $plList = $('#plList');
    const $plChecked = $plList.find('.chk-item.checked').detach();
    const $plUnchecked = $plList.find('.chk-item').detach();
    _sortByTopFlag($plUnchecked);
    $plList.append($plChecked).append($plUnchecked);

    // show/hide หลัง append กลับแล้ว
    const hasAnyFilter =
        Object.keys(chkState.pl).length > 0 ||
        Object.keys(chkState.br).length > 0 ||
        fitState.size > 0;

    if (hasAnyFilter) {
        $plList.find('.chk-item').each(function () {
            const count = parseInt($(this).find('.chk-count').text()) || 0;
            $(this).toggle(count > 0);
        });
        // ใน _updateSidebar ส่วน PL แทนที่ else block ทั้งหมด
    } else {
        if (_sidebarForcedReset || BASE_PRODUCTS.length === 0) {
            _sidebarForcedReset = false; // reset flag
            let plVis = 0;
            $plList.find('.chk-item').each(function () {
                const show = plVis < 5;
                $(this).toggle(show);
                if (show) plVis++;
            });
        } else {
            $plList.find('.chk-item').each(function () {
                const count = parseInt($(this).find('.chk-count').text()) || 0;
                $(this).toggle(count > 0);
            });
            let plVis = 0;
            $plList.find('.chk-item:visible').each(function () {
                if (plVis < 5) { plVis++; }
                else { $(this).hide(); }
            });
        }
    }

    const plBtn = gEl('plSeeMore');
    if (plBtn) {
        plBtn.style.display = $plList.find('.chk-item').filter(function () {
            return (parseInt($(this).find('.chk-count').text()) || 0) > 0;
        }).length > 5 ? 'block' : 'none';
    }

    // ── Brand (BR) ──
    const brCounts = {};
    const brSeen = new Set();
    (PRODUCTS_FOR_BR_COUNT || []).forEach(p => {
        if (p && p.brand) {
            const key = p.brand.trim() + '|' + p.code;
            if (!brSeen.has(key)) {
                brSeen.add(key);
                const name = p.brand.trim();
                brCounts[name] = (brCounts[name] || 0) + 1;
            }
        }
    });

    $('#brList .chk-item').each(function () {
        const name = $(this).attr('data-name');
        const count = brCounts[name] ?? 0;
        $(this).find('.chk-count').text(count);
    });

    const $brList = $('#brList');
    const $brChecked = $brList.find('.chk-item.checked').detach();
    const $brUnchecked = $brList.find('.chk-item').detach();
    _sortByTopFlag($brUnchecked);
    $brList.append($brChecked).append($brUnchecked);

    if (hasAnyFilter) {
        $brList.find('.chk-item').each(function () {
            const count = parseInt($(this).find('.chk-count').text()) || 0;
            if (count > 0) { $(this).show().removeClass('br-extra'); }
            else { $(this).hide().addClass('br-extra'); }
        });
    } else {
        if (_sidebarForcedReset || BASE_PRODUCTS.length === 0) {
            _sidebarForcedReset = false;
            let brVis = 0;
            $brList.find('.chk-item').each(function () {
                const show = brVis < 5;
                $(this).toggle(show).toggleClass('br-extra', !show);
                if (show) brVis++;
            });
        } else {
            $brList.find('.chk-item').each(function () {
                const count = parseInt($(this).find('.chk-count').text()) || 0;
                $(this).toggle(count > 0).toggleClass('br-extra', count === 0);
            });
            let brVis = 0;
            $brList.find('.chk-item:visible').each(function () {
                if (brVis < 5) { brVis++; }
                else { $(this).hide().addClass('br-extra'); }
            });
        }
    }

    const brBtn = gEl('brSeeMore');
    if (brBtn) {
        brBtn.style.display = $brList.find('.chk-item').filter(function () {
            return (parseInt($(this).find('.chk-count').text()) || 0) > 0;
        }).length > 5 ? 'block' : 'none';
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
    if (BASE_PRODUCTS && BASE_PRODUCTS.length > 0) {
        applyAllFilters();
    }
}

/* ════════════ §3 — CLEAR ALL FILTERS ═════════════ */
function clearAllFilters() {
    vfData = {};
    // แทนที่ forEach เดิม
    ['marketsegId', 'segmentId', 'makerId', 'rangeId', 'bodyId', 'engineId', 'driveId'].forEach(id => {
        const el = gEl(id);
        if (!el) return;
        el.value = '';
        if ($(el).data('select2')) {
            $(el).val('').trigger('change.select2'); // ← reset Select2 โดยไม่ destroy container
        }
    });
    const yrFrom = gEl('yearFrom'); if (yrFrom) yrFrom.value = '';
    const yrTo = gEl('yearTo'); if (yrTo) yrTo.value = '';
    const vfTags = gEl('vfTags'); if (vfTags) vfTags.innerHTML = '';
    const vehSummary = gEl('vehSummary');
    if (vehSummary) vehSummary.innerHTML = '';

    chkState = { pl: {}, br: {} };
    if (typeof pgmResetSaved === 'function') pgmResetSaved();   // ✅ เพิ่ม
    document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));

    fitState = new Set();
    document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

    const pq = gEl('partQ'); if (pq) pq.value = '';
    const hq = gEl('headerQ'); if (hq) hq.value = '';

    const sf = gEl('txtSearchField');
    if (sf) sf.value = '';

    currentSort = 'carModel';
    const sortSelect = gEl('sortSelect'); if (sortSelect) sortSelect.value = 'carModel';

    activeModes = new Set(['description']);
    document.querySelectorAll('.smode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === 'description');
    });

    activeGroup = '0';
    window.selectedGroupId = '0';
    document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
    document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

    const activeFilters = gEl('activeFilters'); if (activeFilters) activeFilters.innerHTML = '';

    const backdrop = gEl('specModalBackdrop');
    if (backdrop) closeSpecModal({ target: backdrop });
    closeDrawer();

    // ✅ reset ข้อมูลทั้งหมด
    _lastSearchType = '';
    BASE_PRODUCTS = [];
    _sidebarForcedReset = true;
    PRODUCTS = [];
    PRODUCTS_FOR_COUNT = [];
    PRODUCTS_FOR_PL_COUNT = [];
    PRODUCTS_FOR_BR_COUNT = [];
    currentAllowed.pl = [];
    currentAllowed.br = [];
    $("#plList, #brList").empty();
    GetBrandS();
    GetProductionLine();

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
    Promise.all([
        loadMasterMarketDefault(1),
        loadMasterMarketDefault(2)
    ]).then(async () => {
        const marketSeg = document.getElementById('marketsegId');
        const vehicleSeg = document.getElementById('segmentId');

        if (marketSeg) {
            const japanOpt = Array.from(marketSeg.options)
                .find(o => o.text.trim().toUpperCase().includes('JAPAN'));
            if (japanOpt) marketSeg.value = japanOpt.value;
        }

        if (vehicleSeg) {
            const passOpt = Array.from(vehicleSeg.options)
                .find(o => o.text.trim().toUpperCase().includes('PASSENGER'));
            if (passOpt) vehicleSeg.value = passOpt.value;
        }

        await loadMaker(true);
        await loadModelRange(true);
        updateVehSummary();
    });
}

function _rebuildSidebarFromProducts() {
    if (!BASE_PRODUCTS) return;

    // ── 1. ประมวลผล Product Line (PL) ──
    const lineCount = {};
    const lineSeen = new Set();
    BASE_PRODUCTS.forEach(p => {
        if (p.line) {
            const key = p.line.trim() + '|' + p.code;
            if (!lineSeen.has(key)) {
                lineSeen.add(key);
                const name = p.line.trim();
                lineCount[name] = (lineCount[name] || 0) + 1;
            }
        }
    });

    const $plList = $('#plList');

    Object.keys(lineCount).forEach(name => {
        if ($plList.find(`.chk-item[data-name="${name}"]`).length === 0) {
            const plMaster = MASTER_PRODUCT_LINES.find(x => x.prodlinename === name);
            const plFlag = plMaster?.flag || '';
            const isChecked = !!chkState.pl[name]; // ✅ ประกาศตรงนี้
            $plList.append(`
                <div class="chk-item ${isChecked ? 'checked' : ''}" data-name="${name}" data-flag="${plFlag}" onclick="toggleChk(this,'pl','${name.replace(/'/g, "\\'")}')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="chk-label">${name}</span>
                    <span class="chk-count">0</span>
                </div>
            `);
        }
    });

    $plList.find('.chk-item').each(function () {
        const name = $(this).attr('data-name');
        $(this).find('.chk-count').text(lineCount[name] || 0);
    });

    const $plChecked = $plList.find('.chk-item.checked').detach();
    const $plUnchecked = $plList.find('.chk-item').detach();
    _sortByTopFlag($plUnchecked);
    $plList.append($plChecked).append($plUnchecked);

    let plVisible = 0;
    $plList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked'); // ✅ ประกาศในแต่ละ iteration
        const count = parseInt($(this).find('.chk-count').text()) || 0;
        if (count === 0 && !isChecked) { $(this).hide(); return; }
        const show = isChecked || plVisible < 5;
        $(this).toggle(show);
        if (show && !isChecked) plVisible++;
    });

    const plBtn = gEl('plSeeMore');
    if (plBtn) {
        plBtn.style.display = $plList.find('.chk-item').filter(function () {
            return (parseInt($(this).find('.chk-count').text()) || 0) > 0;
        }).length > 5 ? 'block' : 'none';
    }

    // ── 2. ประมวลผล Brand (BR) ──
    const brandCount = {};
    const brandSeen = new Set();
    BASE_PRODUCTS.forEach(p => {
        if (p.brand && p.brand !== '—') {
            const key = p.brand.trim() + '|' + p.code;
            if (!brandSeen.has(key)) {
                brandSeen.add(key);
                const name = p.brand.trim();
                brandCount[name] = (brandCount[name] || 0) + 1;
            }
        }
    });

    const $brList = $('#brList');

    Object.keys(brandCount).forEach(name => {
        if ($brList.find(`.chk-item[data-name="${name}"]`).length === 0) {
            const brMaster = MASTER_BRANDS.find(x => x.name === name);
            const brFlag = brMaster?.flag || '';
            const isChecked = !!chkState.br[name]; // ✅ ประกาศตรงนี้
            $brList.append(`
                <div class="chk-item ${isChecked ? 'checked' : ''}" data-name="${name}" data-flag="${brFlag}" onclick="toggleChk(this,'br','${name.replace(/'/g, "\\'")}')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="chk-label">${name}</span>
                    <span class="chk-count">0</span>
                </div>
            `);
        }
    });

    $brList.find('.chk-item').each(function () {
        const name = $(this).attr('data-name');
        $(this).find('.chk-count').text(brandCount[name] || 0);
    });

    const $brChecked = $brList.find('.chk-item.checked').detach();
    const $brUnchecked = $brList.find('.chk-item').detach();
    _sortByTopFlag($brUnchecked);
    $brList.append($brChecked).append($brUnchecked);

    let brVisible = 0;
    $brList.find('.chk-item').each(function () {
        const isChecked = $(this).hasClass('checked'); // ✅ ประกาศในแต่ละ iteration
        const count = parseInt($(this).find('.chk-count').text()) || 0;
        if (count === 0 && !isChecked) { $(this).hide().addClass('br-extra'); return; }
        const show = isChecked || brVisible < 5;
        $(this).toggle(show).toggleClass('br-extra', !show);
        if (show && !isChecked) brVisible++;
    });

    const brBtn = gEl('brSeeMore');
    if (brBtn) {
        brBtn.classList.remove('expanded');
        brBtn.innerHTML = '<i class="bi bi-chevron-down"></i> ดูเพิ่มเติม';
        brBtn.style.display = $brList.find('.chk-item').filter(function () {
            return (parseInt($(this).find('.chk-count').text()) || 0) > 0;
        }).length > 5 ? 'block' : 'none';
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

function sortProducts(val) {
    currentSort = val;
    const sel = gEl('sortSelect');
    if (sel && sel.value !== val) sel.value = val;

    // ✅ re-map เพื่อ dedup ใหม่ตาม sort ที่เลือก
    // (BASE_PRODUCTS ถูก set จาก _lastGroups ที่เก็บไว้)
    if (window._lastApiGroups) {
        BASE_PRODUCTS = mapApiResponseToProducts(window._lastApiGroups);
    }

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
    const sortedGroups = [...GROUPS].sort((a, b) => {
        if (String(a.id) === '99') return 1;
        if (String(b.id) === '99') return -1;
        return 0;
    });

    gEl('bbScroll').innerHTML = sortedGroups.map(g => {
        const gidStr = String(g.id);
        const isActive = gidStr === activeStr;
        return `
            <div class="bb-item ${isActive ? 'active' : ''} ${g.id === '99' ? 'bb-universal' : ''}" 
                 data-id="${g.id}">
                <i class="bi ${g.icon}"></i>
                <span class="bb-label">${g.label}</span>
            </div>`;
    }).join('');
}

// เรียกครั้งเดียวตอน init — ไม่อยู่ใน renderBottomBar()
function initBottomBar() {
    const bottomBar = document.querySelector('.bottom-bar');
    if (!bottomBar || bottomBar._bbBound) return;
    bottomBar._bbBound = true;
    bottomBar.addEventListener('click', function (e) {
        const item = e.target.closest('.bb-item');
        if (!item) return;
        e.stopPropagation();
        selectGroup(item.dataset.id);
    });
}

function scrollBottom(dx) {
    gEl('bbScroll').scrollBy({ left: dx, behavior: 'smooth' });
}

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

/* ── Price tier helpers (ใช้ใน spec modal) ── */
function _getTiers(p) {
    const tiers = (p.priceTiers || [])
        .map(t => ({ moq: parseInt(t.moq, 10) || 1, price: parseFloat(t.price) || 0 }))
        .filter(t => t.price > 0)          // ตัด moq 1 ที่ราคา 0.00 (ข้อมูลผิด)
        .sort((a, b) => a.moq - b.moq);

    return tiers.length ? tiers : [{ moq: 1, price: p.price }];
}

// function _getTiers(p) {
//     const tiers = (p.priceTiers || [])
//         .map(t => ({ moq: parseInt(t.moq, 10) || 1, price: parseFloat(t.price) || 0 }))
//         .sort((a, b) => a.moq - b.moq);
//     return tiers.length ? tiers : [{ moq: 1, price: p.price }];
// }

// tier ที่ moq สูงสุดที่ <= จำนวน (ถ้าน้อยกว่า moq แรก ใช้ tier แรก)
function _tierFor(tiers, q) {
    let t = tiers[0];
    tiers.forEach(x => { if (q >= x.moq) t = x; });
    return t;
}

function _tierRange(tiers, i) {
    const start = tiers[i].moq;
    const next = tiers[i + 1];
    if (!next) return start + '+';
    const end = next.moq - 1;
    return start === end ? String(start) : start + '–' + end;
}

function _tierOptionText(tiers, i) {
    const base = tiers[0].price;
    const pct = Math.round((1 - tiers[i].price / base) * 100);
    return `ซื้อ ${_tierRange(tiers, i)} ชิ้น → ${fmt(tiers[i].price)} / ชิ้น` + (pct > 0 ? ` (ลด ${pct}%)` : '');
}

/* อัปเดตราคา / ยอดรวม / dropdown ตามจำนวนที่กรอก (ไม่เขียนทับช่อง qty ขณะพิมพ์) */
function specTierRefresh(pid) {
    const p = PRODUCTS.find(x => x.id === pid) || activeProduct;
    const inp = gEl('modalQty-' + pid);
    if (!p || !inp) return;

    const tiers = _getTiers(p);
    const base = tiers[0].price;
    const q = Math.max(1, parseInt(inp.value, 10) || 1);
    const t = _tierFor(tiers, q);
    const saving = (base - t.price) * q;

    const setText = (id, v) => { const el = gEl(id + pid); if (el) el.textContent = v; };
    setText('modalPrice-', fmt(t.price));
    setText('modalTotal-', fmt(q * t.price));
    setText('modalSave-', `(ประหยัด ${fmt(Math.max(0, saving))})`);
    const saveEl = gEl('modalSave-' + pid);
    if (saveEl) saveEl.style.display = (tiers.length > 1 && saving > 0) ? '' : 'none';

    const old = gEl('modalOld-' + pid);
    if (old) { old.textContent = fmt(base); old.style.display = t.price < base ? '' : 'none'; }

    const disc = gEl('modalDisc-' + pid);
    if (disc) {
        const pct = Math.round((1 - t.price / base) * 100);
        disc.textContent = `ลด ${pct}%`;
        disc.style.display = pct > 0 ? '' : 'none';
    }

    const sel = gEl('modalTier-' + pid);
    if (sel) sel.value = String(t.moq);
}

/* เลือก tier จาก dropdown → ตั้งจำนวนเป็น moq ของ tier นั้น */
function specTierPick(pid, moq) {
    const inp = gEl('modalQty-' + pid);
    if (inp) inp.value = moq;
    specTierRefresh(pid);
}

/* ── Mobile drawer: tier logic ── */
function drTierRefresh() {
    const p = activeProduct;
    const inp = gEl('drQty');
    if (!p || !inp) return;

    const tiers = _getTiers(p);
    const base = tiers[0].price;
    const q = Math.max(1, parseInt(inp.value, 10) || 1);
    const t = _tierFor(tiers, q);
    const saving = Math.max(0, (base - t.price) * q);
    const pct = Math.round((1 - t.price / base) * 100);

    gEl('drPrice').textContent = fmt(t.price);
    gEl('drTotal').textContent = fmt(q * t.price);
    const drSaveEl = gEl('drSave');
    drSaveEl.textContent = `(ประหยัด ${fmt(saving)})`;
    drSaveEl.style.display = (tiers.length > 1 && saving > 0) ? '' : 'none';

    const old = gEl('drOld');
    old.textContent = fmt(base);
    old.style.display = t.price < base ? '' : 'none';

    const disc = gEl('drDisc');
    disc.textContent = `ลด ${pct}%`;
    disc.style.display = pct > 0 ? '' : 'none';

    const sel = gEl('drTier');
    if (sel && sel.style.display !== 'none') sel.value = String(t.moq);
}

function drTierPick(moq) {
    gEl('drQty').value = moq;
    drTierRefresh();
}

function drTierInit(p) {
    const tiers = _getTiers(p);
    const sel = gEl('drTier');
    if (!sel) return;

    if (tiers.length > 1) {
        sel.innerHTML = tiers.map((t, i) =>
            `<option value="${t.moq}">${_tierOptionText(tiers, i)}</option>`).join('');
        sel.style.display = '';
    } else {
        sel.innerHTML = '';
        sel.style.display = 'none';
    }

    gEl('drQty').value = 1;
    drTierRefresh();
}

function buildSpecHTML(p) {
    const tiers = _getTiers(p);
    const base = tiers[0].price;
    const t0 = _tierFor(tiers, 1);
    const isBO = (p.stock ?? 99) === 0;

    const tierSelect = tiers.length > 1 ? `
        <select id="modalTier-${p.id}"
                onclick="event.stopPropagation()"
                onchange="specTierPick(${p.id}, this.value)"
                style="height:32px;border:1px solid var(--border);border-radius:8px;padding:0 8px;
                       font-size:13px;margin-top:10px;width:100%;max-width:330px;background:#fff">
            ${tiers.map((t, i) => `
                <option value="${t.moq}" ${t.moq === t0.moq ? 'selected' : ''}>${_tierOptionText(tiers, i)}</option>`).join('')}
        </select>` : '';

    return `
    <div class="spec-hero">
       ${p.img
            ? `<div class="no-image" id="img-wrap-${p.id}">
           <img src="${p.img}" alt="${p.name}"
                style="width:100%;height:100%;object-fit:contain;border-radius:8px"
                onerror="this.parentElement.innerHTML='<i class=&quot;bi bi-image&quot; style=&quot;font-size:28px;color:var(--text-3)&quot;></i><span style=&quot;font-size:10px;color:var(--text-3);margin-top:4px&quot;>No image</span>'">
       </div>`
            : `<div class="no-image">
           <i class="bi bi-image" style="font-size:28px;color:var(--text-3)"></i>
           <span style="font-size:10px;color:var(--text-3);margin-top:4px">No image</span>
       </div>`}
        <div class="spec-hero-meta flex-grow-1">
            <h5>${p.name}</h5>
            <p>${p.code}</p>
            <p style="font-size:12px;color:var(--text-3);margin-top:3px">${p.brand}</p>

            <div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
                <div class="spec-price" id="modalPrice-${p.id}">${fmt(t0.price)}</div>
                <span id="modalOld-${p.id}"
                      style="color:var(--text-3);text-decoration:line-through;font-size:13px;
                             ${t0.price < base ? '' : 'display:none'}">${fmt(base)}</span>
                <span id="modalDisc-${p.id}"
                      style="background:#dcfce7;color:#16a34a;font-weight:700;font-size:11px;
                             border-radius:10px;padding:1px 8px;
                             ${t0.price < base ? '' : 'display:none'}">
                    ลด ${Math.round((1 - t0.price / base) * 100)}%
                </span>
                <span style="font-size:12px;color:var(--text-3)">/ ชิ้น</span>
            </div>

            ${tierSelect}

            <div class="mt-2 d-flex align-items-center gap-3">
                <input type="number" class="qty" value="1" min="1"
                       id="modalQty-${p.id}"
                       oninput="specTierRefresh(${p.id})"
                       onclick="event.stopPropagation()">
                <button class="acart ${isBO ? 'bo-btn' : ''}"
                        style="flex:Auto;max-width:150px" onclick="addCartFromSpecModal(${p.id}, event)">
                    <i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i>
                    ${isBO ? 'จอง (BO)' : 'เพิ่ม'}
                </button>
            </div>

            <div class="spec-total" style="font-size:12px;margin-top:6px">
                รวม <b id="modalTotal-${p.id}">${fmt(t0.price)}</b>
                <span id="modalSave-${p.id}"
                      style="color:#16a34a;font-weight:600;${tiers.length > 1 ? '' : 'display:none'}">(ประหยัด ${fmt(0)})</span>
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
// async function addCartFromSpecModal(productId, clickEvent) {
//     if (clickEvent) clickEvent.stopPropagation();

//     const p = PRODUCTS.find(x => x.id === productId);
//     if (!p) return;

//     const qty = parseInt(gEl('modalQty-' + productId)?.value) || 1;
//     const btn = clickEvent?.currentTarget instanceof HTMLElement
//         ? clickEvent.currentTarget
//         : document.querySelector('#specModalContent .acart');

//     await _callAddToCartAPI(p, qty, btn);
// }

async function addCartFromSpecModal(productId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();

    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    const tiers = _getTiers(p);                       // ✅
    const minQty = tiers[0].moq || 1;                 // ✅
    const qtyInp = gEl('modalQty-' + productId);

    let qty = parseInt(qtyInp?.value) || 1;
    if (qty < minQty) {                               // ✅
        qty = minQty;
        if (qtyInp) qtyInp.value = minQty;
        specTierRefresh(productId);
        toast(`⚠️ สินค้านี้สั่งขั้นต่ำ ${minQty} ชิ้น`, 'warn');
    }

    const btn = clickEvent?.currentTarget instanceof HTMLElement
        ? clickEvent.currentTarget
        : document.querySelector('#specModalContent .acart');

    // ใช้ราคาตาม tier ที่ตรงกับจำนวน
    const tier = _tierFor(tiers, qty);
    await _callAddToCartAPI({ ...p, price: tier.price, moq: tier.moq }, qty, btn);
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
            drAddBtn.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'เพิ่ม'}`;
        }
        drTierInit(p);
        gEl('specDrawer').querySelectorAll('.drtab').forEach((b, i) => b.classList.toggle('active', i === 0));
        gEl('specDrawer').querySelectorAll('.drpane').forEach((pane, i) => pane.classList.toggle('active', i === 0));

        gEl('drawerOverlay').classList.add('show');
        gEl('specDrawer').classList.add('show');
        document.body.style.overflow = 'hidden';
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
    if (!dr) return; // ✅ guard
    dr.classList.remove('show');
    const drawerOverlay = gEl('drawerOverlay');
    if (drawerOverlay) drawerOverlay.classList.remove('show');
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

    const p = activeProduct;
    if (!p) return;

    const tiers = _getTiers(p);                       // ✅
    const minQty = tiers[0].moq || 1;                 // ✅

    let qty = Math.max(1, parseInt($("#drQty").val(), 10) || 1);
    if (qty < minQty) {                               // ✅
        qty = minQty;
        $("#drQty").val(minQty);
        drTierRefresh();
        toast(`⚠️ สินค้านี้สั่งขั้นต่ำ ${minQty} ชิ้น`, 'warn');
    }
    const btn = document.getElementById('drAddBtn');

    const tier = _tierFor(tiers, qty);
    await _callAddToCartAPI({ ...p, price: tier.price, moq: tier.moq }, qty, btn);
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
        if (currentSort === 'carModel') {
            return p.carModel && p.carModel.trim() && p.carModel !== 'Universal'
                ? p.carModel
                : 'ใช้ได้ทั่วไป';
        }
        if (currentSort === 'brand') return p.brand || 'อื่นๆ';
        if (currentSort === 'part') return p.line || 'อื่นๆ';
        if (currentSort === 'name') return p.name?.charAt(0).toUpperCase() || 'อื่นๆ';
        if (currentSort === 'price-asc' || currentSort === 'price-desc') return 'ทั้งหมด';
        return p.line || 'อื่นๆ';
    };

    const map = {};
    const seenPerGroup = {}; // ✅ เพิ่ม

    list.forEach(p => {
        const key = keyFn(p);
        if (!map[key]) {
            map[key] = [];
            seenPerGroup[key] = new Map(); // ✅ เปลี่ยน Set → Map เพื่อเก็บ index
        }

        const existing = seenPerGroup[key].get(p.code);

        if (existing === undefined) {
            // ยังไม่มี → เพิ่มเลย
            seenPerGroup[key].set(p.code, map[key].length);
            map[key].push(p);
        } else if (p.stock > 0 && map[key][existing].stock === 0) {
            // ✅ มีอยู่แล้วแต่ stock = 0 → แทนด้วยตัวที่มี stock
            map[key][existing] = p;
        }
    });

    return Object.entries(map).sort((a, b) =>
        (a[0] || '').localeCompare(b[0] || '', 'th')
    );
}
// แทนที่ฟังก์ชัน nfScroll เดิม
function nfScroll(rowId, dir) {
    const el = gEl(rowId);
    if (el) el.scrollBy({ left: dir * 660, behavior: 'smooth' });
}

function updateNfArrows(strip) {
    const wrap = strip.closest('.nf-strip-wrap');
    if (!wrap) return;
    const btnL = wrap.querySelector('.nf-arr.l');
    const btnR = wrap.querySelector('.nf-arr.r');
    const scrollable = strip.scrollWidth > strip.clientWidth + 2;
    if (!scrollable) {
        if (btnL) btnL.style.display = 'none';
        if (btnR) btnR.style.display = 'none';
        return;
    }
    if (btnL) btnL.style.display = strip.scrollLeft > 2 ? '' : 'none';
    if (btnR) btnR.style.display = strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 2 ? '' : 'none';
}

/* ═════════════════ RENDER PRODUCTS ═══════════════════ */
/* คำนวณราคาหลัก + แท็กราคาขั้นบันได จาก priceTiers */
function getTierDisplay(p) {
    const fmt2 = v => Number(v).toLocaleString('th-TH', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    // เรียง tier ตาม moq น้อย → มาก และตัดตัวที่ราคาไม่ถูกต้องออก
    const tiers = (p.priceTiers || [])
        .map(t => ({ moq: parseInt(t.moq, 10) || 0, price: parseFloat(t.price) || 0 }))
        .filter(t => t.price > 0)
        .sort((a, b) => a.moq - b.moq);

    // ราคาหลัก: tier แรก ถ้าไม่มี tier ใช้ price เดิม
    const mainPrice = tiers.length ? tiers[0].price : p.price;

    let tagHtml = '';
    if (tiers.length === 2) {
        // มี 2 tier → แสดง tier ที่ 2
        tagHtml = `${tiers[1].moq} ชิ้นขึ้นไป ฿${fmt2(tiers[1].price)} / unit`;
    } else if (tiers.length > 2) {
        // มากกว่า 2 tier → แสดงราคาคุ้มสุด (ราคาต่ำสุดในทุก tier)
        const best = Math.min(...tiers.map(t => t.price));
        tagHtml = `ราคาคุ้มสุด ฿${fmt2(best)} / unit`;
    }

    return { mainPrice, tagHtml, fmt2 };
}

function renderProducts(list) {
    const sorted = applySorting(list);
    const pGrid = gEl('pGrid');
    const nfRows = gEl('nfRows');
    const hasFilter = Object.keys(chkState.pl).length || fitState.size || Object.keys(chkState.br).length;
    const uniqueCount = new Set(sorted.map(p => p.code)).size;
    
    gEl('rcount').style.display = '';
    gEl('rcount').textContent = uniqueCount + ' items';
    const stockLabel = s =>
        s === 0 ? `<span class="pstock out-stock"><i class="bi bi-exclamation-circle-fill"></i> หมดสต็อก</span>` :
            s <= 5 ? `<span class="pstock low-stock"><i class="bi bi-exclamation-circle-fill"></i> เหลือ ${s.toLocaleString()}</span>` :
                `<span class="pstock in-stock"><i class="bi bi-check-circle-fill"></i> ${s.toLocaleString()} ชิ้น</span>`;

    const pcardHTML = p => {
        const { mainPrice, tagHtml, fmt2 } = getTierDisplay(p);
        return`
        <div class="pcard ${hasFilter ? 'highlight-filter' : ''}" id="pc-${p.id}"
             onclick="openDrawer(${p.id},event)" style="cursor:pointer">
            <div class="pimg">
                ${stockLabel(p.stock ?? 99)}
                ${p.img && p.img.trim()
                ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
           <img src="${p.img}" alt="${p.name}"
                style="max-height:85px;max-width:100%;object-fit:contain"
                onerror="this.parentElement.innerHTML='<div class=&quot;no-image&quot;><i class=&quot;bi bi-image&quot; style=&quot;font-size:28px;color:var(--text-3)&quot;></i><span style=&quot;font-size:10px;color:var(--text-3);margin-top:4px&quot;>No image</span></div>'">
       </div>`
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
                <div class="pname" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.name}</div>
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
                <div class="pprice" id="cardPrice-${p.id}">฿${fmt2(mainPrice)} <span>/ unit</span></div>
                ${tagHtml ? `
                <div style="font-size:11px;color:#198754;margin-top:2px;display:flex;align-items:center;gap:4px">
                    <i class="bi bi-tag-fill"></i> ${tagHtml}
                </div>` : ''}
            </div>
            <div class="pfooter">
            <input type="number" class="qty" value="1" min="1"
                   id="qty-${p.id}"
                   oninput="cardQtyChange(${p.id})"
                   onclick="event.stopPropagation()">
            <button class="acart ${(p.stock ?? 99) === 0 ? 'bo-btn' : ''}"
                    id="cb-${p.id}" onclick="addCart(${p.id},event)">
                    <i class="bi ${(p.stock ?? 99) === 0 ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i>
                    ${(p.stock ?? 99) === 0 ? 'จอง (BO)' : 'เพิ่ม'}
                </button>
            </div>
        </div>`;
    }
    
    // ✅ เพิ่ม 2 บรรทัดนี้
    const forceByLine = currentSort === 'part';
    const groups = groupByLine(sorted, forceByLine);

    // เรียง products ภายใน group: มีสต็อกก่อน, หมดสต็อกไว้ท้าย
    groups.forEach(([, products]) => {
        products.sort((a, b) => {
            const aHasStock = (a.stock ?? 99) > 0;
            const bHasStock = (b.stock ?? 99) > 0;
            if (aHasStock === bHasStock) return 0;
            return aHasStock ? -1 : 1;
        });
    });

    // เรียง groups: กลุ่มที่มีสต็อกก่อน, กลุ่มหมดสต็อกทั้งหมดไว้ท้าย
    groups.sort(([, aProducts], [, bProducts]) => {
        const aHasStock = aProducts.some(p => (p.stock ?? 99) > 0);
        const bHasStock = bProducts.some(p => (p.stock ?? 99) > 0);
        if (aHasStock === bHasStock) return 0;
        return aHasStock ? -1 : 1;
    });

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
    // ผูก scroll listener + check ทันทีหลัง render
    requestAnimationFrame(() => {
        document.querySelectorAll('.nf-strip').forEach(strip => {
            updateNfArrows(strip);
            strip.addEventListener('scroll', () => updateNfArrows(strip), { passive: true });
        });
    });
}

/* ══════════════ APPLY ALL FILTERS ══════════════════ */
function applyAllFilters() {
    _applyFiltersAndRender();
}

/* ══════════════ ACTIVE FILTER CHIPS ══════════════════ */
function renderActiveFilterChips() {
    const container = gEl('activeFilters');
    if (!container) return;

    const allChips = [];

    const activeGroupStr = String(activeGroup || '0');
    if (activeGroupStr !== '0') {
        const groupObj = GROUPS.find(g => String(g.id) === activeGroupStr);
        if (groupObj) {
            allChips.push({ t: 'group', v: groupObj.label || groupObj.name, id: groupObj.id, cls: 'af-group' });
        }
    }

    Object.keys(chkState.pl).forEach(v => allChips.push({ t: 'pl', v, cls: 'af-pl' }));
    Object.keys(chkState.br).forEach(v => allChips.push({ t: 'br', v, cls: 'af-br' }));
    [...fitState].forEach(v => allChips.push({ t: 'fi', v, cls: 'af-fi' }));

    if (!allChips.length) { container.innerHTML = ''; return; }

    const SHOW = 3;
    const hidden = allChips.length - SHOW;
    const isExpanded = container.dataset.expanded === '1';

    const chipsToShow = isExpanded ? allChips : allChips.slice(0, SHOW);

    let html = chipsToShow.map(c =>
        `<span class="af-chip ${c.cls}" onclick="removeActiveChip('${c.t}','${(c.v || '').replace(/'/g, "\\'")}')">${c.v} <i class="bi bi-x-circle"></i></span>`
    ).join('');

    if (!isExpanded && hidden > 0) {
        html += `<span class="af-chip af-more" onclick="
            document.getElementById('activeFilters').dataset.expanded='1';
            renderActiveFilterChips()
        ">+${hidden} เพิ่มเติม</span>`;
    } else if (isExpanded) {
        html += `<span class="af-chip af-more" onclick="
            document.getElementById('activeFilters').dataset.expanded='0';
            renderActiveFilterChips()
        ">ย่อ <i class='bi bi-chevron-up'></i></span>`;
    }

    container.innerHTML = html;
}

function showAllFilterChips() {
    renderActiveFilterChips();
}
/* ── ลบ chip ตัวเดียว แล้ว re-fetch ── */
function removeActiveChip(t, v) {
    if (t === 'group') {
        selectGroup('0');
        return;
    }

    if (t === 'pl') {
        delete chkState.pl[v];
        const el = document.querySelector(`#plList .chk-item[data-name="${CSS.escape(v)}"]`);
        if (el) {
            el.classList.remove('checked');
            const chk = el.querySelector('input[type="checkbox"]');
            if (chk) chk.checked = false;
        }
    } else if (t === 'pl-all') {
        chkState.pl = {};
        document.querySelectorAll('#plList .chk-item').forEach(l => {
            l.classList.remove('checked');
            const chk = l.querySelector('input[type="checkbox"]');
            if (chk) chk.checked = false;
        });
    } else if (t === 'br') {
        delete chkState.br[v];
        const el = document.querySelector(`#brList .chk-item[data-name="${CSS.escape(v)}"]`);
        if (el) {
            el.classList.remove('checked');
            const chk = el.querySelector('input[type="checkbox"]');
            if (chk) chk.checked = false;
        }
    } else if (t === 'br-all') {
        chkState.br = {};
        document.querySelectorAll('#brList .chk-item').forEach(l => {
            l.classList.remove('checked');
            const chk = l.querySelector('input[type="checkbox"]');
            if (chk) chk.checked = false;
        });
    } else if (t === 'fi') {
        fitState.delete(v);
        document.querySelectorAll('.fit-chip').forEach(c => {
            if (c.textContent.trim() === v) c.classList.remove('active');
        });
    }
    if (typeof pgmSyncSaved === 'function') pgmSyncSaved();   // ✅ เพิ่ม
    const hasSidebarFilter =
        Object.keys(chkState.pl).length > 0 ||
        Object.keys(chkState.br).length > 0 ||
        fitState.size > 0;

    if (_lastSearchType === 'category' && !hasSidebarFilter && String(activeGroup) === '0') {
        PRODUCTS = [];
        PRODUCTS_FOR_COUNT = [];
        PRODUCTS_FOR_PL_COUNT = [];
        PRODUCTS_FOR_BR_COUNT = [];
        renderProducts([]);
        renderActiveFilterChips();
        return;
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
        if (!el || !el.value || el.value === 'ALL') return null;
        const label = el.options[el.selectedIndex]?.text?.trim() || el.value;
        if (!label || label.startsWith('—') || label.startsWith('-')) return null;
        return { icon: f.icon, label };
    }).filter(Boolean);

    if (!pills.length) { s.innerHTML = ''; return; }

    window._allVehPills = pills;

    const SHOW = 3;
    const hidden = pills.length - SHOW;

    let html = pills.slice(0, SHOW).map(p =>
        `<div class="veh-pill"><i class="bi ${p.icon}"></i><span>${p.label}</span></div>`
    ).join('');

    if (hidden > 0) {
        html += `<div class="veh-pill af-more" style="cursor:pointer" onclick="_expandVehPills()">+${hidden} เพิ่มเติม</div>`;
    }

    s.innerHTML = html;
}

function _expandVehPills() {
    const s = gEl('vehSummary');
    if (!s || !window._allVehPills) return;
    s.innerHTML = window._allVehPills.map(p =>
        `<div class="veh-pill"><i class="bi ${p.icon}"></i><span>${p.label}</span></div>`
    ).join('') +
        `<div class="veh-pill af-more" style="cursor:pointer" onclick="updateVehSummary()">ย่อ <i class="bi bi-chevron-up" style="font-size:9px"></i></div>`;
}

function _collapseVehPills() {
    updateVehSummary();
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
function runSearch() {
    if (!_requireSalesmanAndCustomer()) return;

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
// แก้เป็น — reset count ก่อน render เพื่อกัน count ค้าง
function toggleChk(label, type, val) {
    label.classList.toggle('checked');

    if (label.classList.contains('checked')) {
        chkState[type][val] = true;
    } else {
        delete chkState[type][val];
    }

    activateSec(3);

    const hasSidebarFilter =
        Object.keys(chkState.pl).length > 0 ||
        Object.keys(chkState.br).length > 0 ||
        fitState.size > 0;

    // =========================================================
    // CATEGORY SEARCH:
    // ถ้าเอา Filter ตัวสุดท้ายออก → ไม่ควรแสดง BASE_PRODUCTS
    // เพราะ User ยังไม่ได้เลือก Filter ใด ๆ
    // =========================================================
    if (
        _lastSearchType === 'category' &&
        !hasSidebarFilter &&
        String(activeGroup) === '0'
    ) {
        BASE_PRODUCTS = [];
        PRODUCTS = [];
        PRODUCTS_FOR_COUNT = [];
        PRODUCTS_FOR_PL_COUNT = [];
        PRODUCTS_FOR_BR_COUNT = [];

        // reset count ทั้ง PL และ Brand
        $("#plList .chk-item .chk-count, #brList .chk-item .chk-count").text(0);

        $("#plList .chk-item, #brList .chk-item").removeClass('checked');

        $('#plList .chk-item input[type="checkbox"], #brList .chk-item input[type="checkbox"]')
            .prop('checked', false);

        renderProducts([]);

        // ✅ คืน Sidebar กลับมาแสดง 5 แถวแรก
        _updateSidebar();

        renderActiveFilterChips();

        return;
    }

    // =========================================================
    // ถ้าเป็น Vehicle Search / มี BASE_PRODUCTS อยู่แล้ว
    // ให้ filter local ตามปกติ
    // =========================================================
    if (BASE_PRODUCTS.length > 0) {
        showSkel();

        setTimeout(() => {
            _applyFiltersAndRender();
            hideSkel();
            gEl('nfRows')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 200);

    } else {
        showSkel();

        searchProductByCategory().finally(() => {
            hideSkel();
            gEl('nfRows')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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
// async function addCart(productId, clickEvent) {
//     if (clickEvent) clickEvent.stopPropagation();
//     const p = PRODUCTS.find(x => x.id === productId);
//     if (!p) return;
//     const qty = parseInt(gEl('qty-' + productId)?.value) || 1;
//     const btn = gEl('cb-' + productId);
//     await _callAddToCartAPI(p, qty, btn);
// }

async function addCart(productId, clickEvent) {
    if (clickEvent) clickEvent.stopPropagation();
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    const tiers = _getTiers(p);                       // ✅
    const minQty = tiers[0].moq || 1;                 // ✅ ขั้นต่ำ = moq แรก
    const qtyInp = gEl('qty-' + productId);

    let qty = Math.max(1, parseInt(qtyInp?.value, 10) || 1);
    if (qty < minQty) {                               // ✅
        qty = minQty;
        if (qtyInp) qtyInp.value = minQty;
        cardQtyChange(productId);
        toast(`⚠️ สินค้านี้สั่งขั้นต่ำ ${minQty} ชิ้น`, 'warn');
    }
    const btn = gEl('cb-' + productId);

    // ราคาตาม tier ที่ตรงกับจำนวน
    const tier = _tierFor(tiers, qty);
    await _callAddToCartAPI({ ...p, price: tier.price, moq: tier.moq }, qty, btn);
}

/* อัปเดตราคาหลักบนการ์ดตามจำนวนที่กรอก (ยึดตาม moq) */
function cardQtyChange(pid) {
    const p = PRODUCTS.find(x => x.id === pid);
    const inp = gEl('qty-' + pid);
    const priceEl = gEl('cardPrice-' + pid);
    if (!p || !inp || !priceEl) return;

    const q = Math.max(1, parseInt(inp.value, 10) || 1);
    const t = _tierFor(_getTiers(p), q);
    priceEl.innerHTML = `${fmt(t.price)} <span>/ unit</span>`;
}
/* ══════════════════ SKELETON ══════════════════ */
function showSkel() {
    gEl('skelWrap').style.display = 'block';
    gEl('pGrid').style.display = 'none';
    gEl('nfRows').style.display = 'none';
    gEl('rcount').style.display = '';
    gEl('rcount').textContent = 'Loading...';
    gEl('activeFilters').innerHTML = '';
    gEl('loadingOverlay').style.display = 'block';
    const headerH = document.querySelector('.site-header')?.offsetHeight || 56;
    const overlay = gEl('loadingOverlay');
    overlay.style.top = headerH + 'px';
    overlay.style.display = 'block';
}

function hideSkel() {
    gEl('skelWrap').style.display = 'none';
    gEl('loadingOverlay').style.display = 'none';
}

/* ═══════════════ BREADCRUMB ════════════════ */
function updateBreadcrumb(group, page) {
    const bc3 = gEl('bc3');
    if (bc3) bc3.textContent = page || 'Parts Catalog';
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
    btn.style.display = open ? 'none' : '';  // ← เพิ่ม
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
                </div>
                <div class="os-sku">${c.code}${c.isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> BO</span>' : ''}</div>
                <div class="os-price">${fmt(c.price)}</div>
            </div>
            <div class="os-stepper">
                <button class="os-step-btn" onclick="osChangeQty('${c.id}',-1)">−</button>
                <input class="os-step-input" type="number" value="${c.qty}" min="${c.moq || 1}"
                       onchange="osSetQty('${c.id}',this.value)">
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

    // ✅ ขั้นต่ำตาม moq ของสินค้า (เดิมใช้ 1)
    const minQty = Math.max(1, item.moq || 1);
    const newQty = Math.max(minQty, item.qty + delta);

    if (newQty === item.qty) {
        // ✅ แจ้งเตือนและคืนค่าใน input เมื่อติดขั้นต่ำ
        if (item.qty + delta < minQty) toast(`⚠️ สั่งขั้นต่ำ ${minQty} ชิ้น`, 'warn');
        _updateQtyUI(ordId, item.qty, item.price);
        _isChangingQty = false;
        return;
    }

    // หา tier ตามจำนวนใหม่
    // ✅ ถ้าไม่มี tiers ให้คง price/moq เดิม (เดิม fallback เป็น moq 1 แล้วส่งทับ moq จริง)
    const hasTiers = item.priceTiers && item.priceTiers.length;
    const tiers = _getTiers({ priceTiers: item.priceTiers, price: item.price });
    const tier = hasTiers ? _tierFor(tiers, newQty) : { moq: item.moq, price: item.price };
    const newPrice = tier.price;
    const newMoq = tier.moq;

    // เก็บค่าเดิมไว้ rollback
    const prevQty = item.qty;
    const prevPrice = item.price;
    const prevMoq = item.moq;

    // optimistic update UI
    item.qty = newQty;
    item.price = newPrice;
    item.moq = newMoq;
    _updateQtyUI(ordId, newQty, item.price);

    const rollback = () => {
        item.qty = prevQty;
        item.price = prevPrice;
        item.moq = prevMoq;
        _updateQtyUI(ordId, prevQty, prevPrice);
    };
    console.log('changeQty ordId =', JSON.stringify(ordId), '| item =', item);
    try {
        const res = await fetch(urlsPro.editProductToCart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                ordid: ordId,
                cuscod: window.APP_SESSION?.cuscode || '',
                qty: newQty.toString(),
                price: newPrice.toString(),
                moq: String(newMoq)
            })
        });

        const json = await res.json().catch(() => null);

        // ✅ ตรวจว่า server อัปเดตจริง: qty ที่ตอบกลับต้องตรงกับที่ขอ
        const row = Array.isArray(json?.Data) ? json.Data[0] : json?.Data;
        const serverQty = parseInt(row?.qty, 10);

        if (!json || !json.IsSuccess || (!isNaN(serverQty) && serverQty !== newQty)) {
            rollback();
            toast(`❌ แก้ไขจำนวนไม่สำเร็จ: ${json?.Message || 'ไม่ผ่านเงื่อนไข MOQ'}`, 'warn');
            return;
        }

        toast(`✅ อัปเดตจำนวนเป็น ${newQty} แล้ว`);

    } catch (err) {
        console.error('changeQty error:', err);
        rollback();
        toast('❌ เกิดข้อผิดพลาด', 'warn');
        return;
    } finally {
        _isChangingQty = false;
    }

    // sync ค่าจริงจาก DB กลับมาอีกที (bust cache)
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

    // ✅ debounce 600ms ป้องกันยิง API ทุก keystroke
    clearTimeout(_osSetQtyTimer);
    _osSetQtyTimer = setTimeout(async () => {
        // ✅ คำนวณ delta ตอนยิงจริง (ใช้ qty ล่าสุด) ไม่ใช่ตอนพิมพ์
        const cur = cart.find(c => c.id === ordId);
        if (!cur) return;
        const delta = n - cur.qty;
        if (delta === 0) return;
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

    btn.disabled = true;
    btn.classList.add('success');
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> กำลังดำเนินการ...';

    setTimeout(() => {
        btn.classList.remove('success');
        btn.innerHTML = '<i class="bi bi-credit-card-2-front me-2"></i> CHECKOUT';
        btn.disabled = false;

        closeOrderSummary();
        cart = [];
        updateCart();
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
                MASTER_BRANDS = result.Data || [];
                RenderBrands(result.Data || []);
            }
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
        const isTop = brand.flag === 'TOP';
        const $label = $('<label>')
            .addClass('chk-item')
            .attr('data-id', brand.id)
            .attr('data-name', brand.name)
            .attr('data-filter', 'filterProductBrandId')
            .attr('data-flag', brand.flag || '')
            .attr('data-seq', brand.seqNo ?? 999)
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
            const ok = res.IsSuccess === true || res.statusCode === 200;
            const data = res.Data || res.result || [];
            if (ok) {
                MASTER_PRODUCT_LINES = data;
                RenderProductionLines(data);
            }
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
        const isTop = line.flag === 'TOP';
        const $label = $('<label>')
            .addClass('chk-item')
            .attr('data-id', line.prodlineid)
            .attr('data-name', line.prodlinename)
            .attr('data-filter', 'filterProductLineId')
            .attr('data-flag', line.flag || '')
            .attr('data-seq', line.seqNo ?? 999)
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
    if (window._clickedMatchPending) return; // ✅ กัน double call
    window._clickedMatchPending = true;
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
        },
        complete: function () {
            window._clickedMatchPending = false; // ✅ reset หลังเสร็จ
        }
    });
}

function _renderAfterGroupChange() {
    const hasVehicleSelected = !!(gEl('makerId')?.value);

    // ✅ ใช้ local filter (ไม่ยิง API ใหม่) เฉพาะกรณีข้อมูลชุดปัจจุบันมาจาก Vehicle Search เท่านั้น
    const isFromVehicleSearch = window._isVehicleSearching || _lastSearchType === 'vehicle';

    if (!hasVehicleSelected && isFromVehicleSearch && BASE_PRODUCTS.length > 0) {
        _applyFiltersAndRender();

        window._isSearchingCategory = false;

        document.querySelectorAll('.bb-item').forEach(b => {
            b.style.pointerEvents = '';
        });

        PRODUCTS_FOR_COUNT = [...PRODUCTS];
        _updateSidebar();
        renderActiveFilterChips();
        hideSkel();

        return;
    }

    // ✅ ทุกครั้งที่เป็น category search (หรือยังไม่มี vehicle data) → ยิง Category API ใหม่เสมอ
    searchProductByCategory()
        .catch(err => {
            if (err.name !== 'AbortError') {
                console.error("Group change search failed:", err);
            }
        })
        .finally(() => {
            window._isSearchingCategory = false;

            document.querySelectorAll('.bb-item').forEach(b => {
                b.style.pointerEvents = '';
            });

            PRODUCTS_FOR_COUNT = [...PRODUCTS];
            _updateSidebar();
            renderActiveFilterChips();
            hideSkel();
        });
}

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

// ✅ เพิ่มไว้ใกล้ๆ HELPERS ด้านบนของไฟล์
function _sortByTopFlag($items) {
    return $items.sort((a, b) => {
        const aTop = $(a).attr('data-flag') === 'TOP' ? 0 : 1;
        const bTop = $(b).attr('data-flag') === 'TOP' ? 0 : 1;
        if (aTop !== bTop) return aTop - bTop;
        const aSeq = parseInt($(a).attr('data-seq') || '999');
        const bSeq = parseInt($(b).attr('data-seq') || '999');
        if (aSeq !== bSeq) return aSeq - bSeq;  // ✅ เรียงตาม seqNo จาก API
        return (parseInt($(b).find('.chk-count').text()) || 0) -
            (parseInt($(a).find('.chk-count').text()) || 0);
    });
}

function _showTopFlagged($items) {
    $items.each(function () {
        $(this).toggle($(this).attr('data-flag') === 'TOP');
    });
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

/* ✅ อ่าน tiers ที่เก็บไว้ตอน Add (คงอยู่แม้ refresh หน้า) */
function _readTiers(stkcod) {
    try {
        const store = JSON.parse(localStorage.getItem('tierStore') || '{}');
        if (store[stkcod] && store[stkcod].length) return store[stkcod];
    } catch (e) { /* ignore */ }
    return (window._tierStore || {})[stkcod] || [];
}

/* ── Map API response row → cart item ── */
function _mapCartItem(item) {
    return {
        id: String(item.ordId ?? item.ordid ?? item.OrdId ?? item.id ?? ''),        // PK ใช้ ordId ตลอด
        code: item.stkcod || '—',
        name: item.stkdes || '—',
        price: parseFloat(item.price) || 0,
        qty: parseInt(item.qty) || 1,
        img: item.imagePath || '',
        brand: item.stkgrp || '—',
        isBO: item.backOrder === '1',
        uom: item.uom || '',
        moq: parseInt(item.minord ?? item.moq) || 1,      // ✅ เพิ่มรองรับ field moq
        priceTiers: _readTiers(item.stkcod),              // ✅ เปลี่ยนจาก _tierStore อย่างเดียว
        amt: parseFloat(item.amt) || 0
    };
}

/* ── Fetch cart จาก server แล้ว render ทุก view ── */
// async function _fetchCartFromServer(forceRefresh = false) {
//     try {
//         const cuscode = window.APP_SESSION?.cuscode || '';

//         const url = forceRefresh
//             ? `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}&t=${Date.now()}`
//             : `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}`;
//         const res = await fetch(url, { method: 'GET' });
//         console.log('RAW cart row =', JSON.stringify(json.Data?.[0]));
//         const json = await res.json();
//         cart = json.Data.map(_mapCartItem);
//         if (json.IsSuccess && Array.isArray(json.Data) && json.Data.length > 0) {
//             cart = json.Data.map(_mapCartItem);
//         } else {
//             cart = [];
//         }
//     } catch (err) {
//         console.warn('_fetchCartFromServer failed:', err);
//     }

//     updateCart();
// }
async function _fetchCartFromServer(forceRefresh = false) {
    try {
        const cuscode = window.APP_SESSION?.cuscode || '';

        const url = forceRefresh
            ? `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}&t=${Date.now()}`
            : `${urlsPro.getProductToCartUrl}?cuscode=${encodeURIComponent(cuscode)}`;
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();

        console.log('RAW cart row =', JSON.stringify(json.Data?.[0]));   // ← หลัง json ถูกประกาศแล้ว

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
    const sortDropdownBtn = document.getElementById('sortDropdownBtn');
    const sortMenu = document.getElementById('sortMenu');
    sortDropdownBtn?.addEventListener('click', function (e) {
        e.stopPropagation();
        sortMenu?.classList.toggle('show');
    });
    sortMenu?.addEventListener('click', function (e) {
        e.stopPropagation();
        if (e.target.closest('button')) {
            sortMenu.classList.remove('show');
        }
    });
    document.addEventListener('mousedown', function (e) {
        if (!e.target.closest('.sort-dropdown')) {
            sortMenu?.classList.remove('show');
        }
    });
    if (!window.APP_SESSION) window.APP_SESSION = {};
    if (sessionSlm) window.APP_SESSION.slmcode = sessionSlm;
    if (sessionCus) window.APP_SESSION.cuscode = sessionCus;
    if (userType === '0') {
        $('#salesmanId, #customerId').prop('disabled', true);
    } else if (userType === '1' || userType === '5') {
        getSalesmanAll(sessionSlm, sessionCus);
    } else if (userType === '2' && sessionSlm) {
        getSalesmanAll(sessionSlm, sessionCus, true);
    } else if (userType === '3') {
        $('#salesmanId').closest('.sb-sc-field').hide();
        getCustomerByCuscode(sessionCus);
    } else if (sessionCus) {
        getInfomantionCustomer(sessionCus);
    } else if (sessionSlm) {
        getCustomerbySalesman(sessionSlm, '');
    } else {
        getCustomerbySalesman('', '');
    }
});

// ================ 1. GET SALESMAN ALL ========================
function getSalesmanAll(sessionSlm, sessionCus, lockMode = false) {
    $.ajax({
        url: urls.getSalesmanAll,
        method: 'GET',
        data: lockMode ? { slmcode: sessionSlm } : {}, 
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
            $('#salesmanId').select2({
                placeholder: '-- เลือก Salesman --',
                allowClear: true,
                width: '250px'
            });

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
                const fullText = `${cus.cuscode} - ${cus.cusname}`;
                select.append(
                    $('<option>', {
                        value: cus.cuscode,
                        text: fullText,        // ✅ ใช้ fullText แทน cus.cusname
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
            if ($('#customerId').data('select2')) {
                $('#customerId').select2('destroy');
            }
            $('#customerId').select2({
                placeholder: '-- เลือก Customer --',
                allowClear: true,
                width: '250px'
            });
        },
        error: function (xhr, status, error) {
            console.error('getCustomerbySalesman error:', error);
        }
    });
}

function getCustomerByCuscode(sessionCus) {
    $.ajax({
        url: urls.getCustomerByCuscode,
        method: 'GET',
        data: { cuscode: sessionCus },
        success: function (data) {
            if (!data.IsSuccess) return;
            const select = $('#customerId');
            select.empty().append('<option value="">-- เลือก Customer --</option>');
            $.each(data.Data, function (i, cus) {
                select.append($('<option>', {
                    value: cus.cuscode,
                    text: `${cus.cuscode} - ${cus.cusname}`,
                    'data-full': `${cus.cuscode} - ${cus.cusname}`,
                    'data-name': cus.cusname
                }));
            });
            // โหลดร้านแม่ขึ้นมาเป็น default
            select.val(sessionCus);
            getInfomantionCustomer(sessionCus);
            if ($('#customerId').data('select2')) $('#customerId').select2('destroy');
            $('#customerId').select2({ placeholder: '-- เลือก Customer --', allowClear: false, width: '250px' });
            select.off('change').on('change', function () {
                const selectedCus = $(this).val();
                if (window.APP_SESSION) window.APP_SESSION.cuscode = selectedCus || '';
                if (selectedCus) { getInfomantionCustomer(selectedCus); _fetchCartFromServer(true); }
                else { clearCustomerCard(); cart = []; updateCart(); }
            });
        },
        error: function (xhr, status, error) {
            console.error('getCustomerByCuscode error:', error);
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
        const full = opt.getAttribute('data-full'); // ✅ ใช้ full text (code - name)
        if (full) opt.textContent = full;
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

function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('en-US');
}

function renderCustomerCard(cus) {
    const info = document.querySelector('#customerCard .customer-info');
    if (!info) return;

    info.innerHTML = `
        <div class="mb-1"><strong>${cus.cusname ?? '-'} : ${cus.cuscode ?? '-'}</strong></div>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:0px 10px; font-size:10px;">
            <div><span class="text-muted mb-1">Salesman: </span><strong>${cus.slmcode ?? '-'}</strong></div>
            <div class="mb-1"><span class="text-muted me-1">เครดิต(วัน): </span>
                <span class="badge bg-primary" style="font-size: .65rem">
                    TAC ${formatNumber(cus.tacpaytrm)}
                </span>
                <span class="badge bg-primary" style="font-size: .65rem">
                    AAC ${formatNumber(cus.aacpaytrm)}
                </span>
            </div>
            <div><span class="text-muted">Tel: </span><strong>${cus.phone ?? '-'}</strong></div>
            <div><span class="text-muted me-1">วงเงินเครดิต: </span>
                <span class="badge bg-success " style="font-size: .65rem">
                    TAC ${formatNumber(cus.taccrline)}
                </span>
                <span class="badge bg-success" style="font-size: .65rem">
                    AAC ${formatNumber(cus.aaccrline)}
                </span>
            </div>
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
    return result;
}

// ฟังก์ชันบันทึกและจัดการการคลิก
function toggleCompany(btn) {
    const isCurrentlyPressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', isCurrentlyPressed ? 'false' : 'true');
    const selected = getActiveCompanies();
    if (!window.APP_SESSION) window.APP_SESSION = {};
    window.APP_SESSION.companies = selected;
    window.APP_SESSION.company = selected.length > 0 ? selected[0] : 'TAC';
    sessionStorage.setItem('selected_company', getActiveCompanies().join(','));

    const selectedSlm = document.getElementById('salesmanId')?.value;
    const currentCus = document.getElementById('customerId')?.value || ''; // ✅ เก็บค่าปัจจุบัน
    if (selectedSlm) {
        getCustomerbySalesman(selectedSlm, currentCus); // ✅ ส่ง currentCus แทน ''
    }

    var selectedPlNames = Object.keys(window._plSel || {});
    if (selectedPlNames.length && document.getElementById('pgPickerModal')?.classList.contains('pgm-open')) {
        _brSel = {};
        _loadBrandsForSelectedPl(selectedPlNames);
    }
}
// ✅ ฟังก์ชันดึงค่าที่เคยเลือกไว้กลับมาแสดง (เรียกใช้ตอนโหลดหน้าเว็บ)
function initCompanySelection() {
    if (!window.APP_SESSION) window.APP_SESSION = {};
    const saved = sessionStorage.getItem('selected_company') || 'TAC'; // ← default TAC อย่างเดียว
    const savedList = saved.split(',').filter(Boolean);
    window.APP_SESSION.company = savedList[0] || 'TAC';
    window.APP_SESSION.companies = savedList;
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.setAttribute('aria-pressed',
            savedList.includes(btn.dataset.company) ? 'true' : 'false'
        );
    });
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
//-------------Helper ตอนเปลี่ยน ส่วนเซลลูกค้า
function _syncSessionFromUI() {
    const slm = $("#salesmanId").val() || "";
    const cus = $("#customerId").val() || "";
    const companies = getActiveCompanies();
    if (!window.APP_SESSION) window.APP_SESSION = {};
    if (cus) window.APP_SESSION.cuscode = cus;
    if (companies.length) window.APP_SESSION.company = companies[0];
    if (!slm && window.APP_SESSION?.slmcode)
        $("#salesmanId").val(window.APP_SESSION.slmcode);
    if (!cus && window.APP_SESSION?.cuscode)
        $("#customerId").val(window.APP_SESSION.cuscode);
}

//--------------------------------------------New Catagory
/* ══════════════════════════════════════════════════════
   PRODUCT GROUP PICKER MODAL
   อ่านข้อมูลจาก MASTER_PRODUCT_LINES และ MASTER_BRANDS
   กรอง PL ผ่าน API getMatchProductionGroup
   ══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── state ── */
    var _gid = null;   // groupId ที่เปิดอยู่
    var _gname = '';
    var _plAll = [];     // MASTER_PRODUCT_LINES ทั้งหมด (กรองตาม allowed)
    var _brAll = [];     // MASTER_BRANDS ทั้งหมด
    var _plSel = {};     // {name: true}
    var _brSel = {};     // {name: true}
    var _lastFocus = null;
    var _savedByGroup = {};

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* ════ OPEN ════ */
    function pgmOpen(groupId, groupName, focusEl) {
        _gid = groupId;
        _gname = groupName || String(groupId);
        _lastFocus = focusEl || document.activeElement;

        // ✅ restore ค่าที่เคยยืนยันไว้ของกลุ่มนี้ (ถ้าไม่เคย = ว่าง)
        var saved = _savedByGroup[String(groupId)];
        _plSel = saved ? Object.assign({}, saved.pl) : {};
        _brSel = saved ? Object.assign({}, saved.br) : {};
        var _hasSaved = !!saved && Object.keys(_plSel).length > 0;

        var t = document.getElementById('pgmTitle');
        if (t) t.textContent = _gname;

        var ov = document.getElementById('pgPickerModal');
        if (ov) {
            ov.classList.add('pgm-open');
            ov.removeAttribute('aria-hidden');  // ✅ ใช้ removeAttribute แทน setAttribute('aria-hidden','false')
        }
        document.body.classList.add('pgm-lock');

        setPlLoading();
        setBrPlaceholder();
        updateFooter();

        function _doOpen() {
            $.ajax({
                url: urls.getMatchProductionGroup,
                method: 'GET',
                data: { prodgrpid: groupId },
                success: function (res) {
                    var allowedIds = [];
                    if (res && res.IsSuccess && res.Data && res.Data.length > 0) {
                        allowedIds = res.Data.map(function (x) {
                            return String(x.prodlineid);
                        });
                    }

                    if (allowedIds.length > 0) {
                        _plAll = (MASTER_PRODUCT_LINES || []).filter(function (pl) {
                            var plId = String(pl.prodlineid || pl.id || '');
                            return allowedIds.includes(plId);
                        });
                    } else {
                        _plAll = [...(MASTER_PRODUCT_LINES || [])];
                    }

                    _brAll = [...(MASTER_BRANDS || [])];

                    // ✅ render PL ก่อนได้เลย ไม่ต้องรอ brand
                    renderPlList();
                    updateFooter();

                    if (Object.keys(_plSel).length) {
                        _loadBrandsForSelectedPl(Object.keys(_plSel), true);  // true = keepBrSel
                    } else {
                        setBrPlaceholder();
                    }

                    setTimeout(function () {
                        var s = document.getElementById('pgmPlSearch');
                        if (s) s.focus();
                    }, 150);
                },
                error: function () {
                    _plAll = [...(MASTER_PRODUCT_LINES || [])];
                    _brAll = [...(MASTER_BRANDS || [])];
                    renderPlList();
                    updateFooter();

                    if (Object.keys(_plSel).length) {
                        _loadBrandsForSelectedPl(Object.keys(_plSel), true);  // true = keepBrSel
                    } else {
                        setBrPlaceholder();
                    }
                }
            });
        }

        if (!MASTER_PRODUCT_LINES.length || !MASTER_BRANDS.length) {
            var waitCount = 0;
            var waitTimer = setInterval(function () {
                waitCount++;
                if (MASTER_PRODUCT_LINES.length && MASTER_BRANDS.length) {
                    clearInterval(waitTimer);
                    _doOpen();
                } else if (waitCount >= 20) {
                    clearInterval(waitTimer);
                    _doOpen();
                }
            }, 100);
        } else {
            _doOpen();
        }
        document.querySelector('.bottom-bar').style.zIndex = '0';
    }

    /* ════ CLOSE ════ */
    window.pgmClose = function () {
        // ✅ blur focus ออกจาก element ข้างใน modal ก่อน
        // เพื่อป้องกัน "Blocked aria-hidden" warning
        const activeEl = document.activeElement;
        const modal = document.getElementById('pgPickerModal');
        if (modal && activeEl && modal.contains(activeEl)) {
            activeEl.blur();
        }

        var ov = document.getElementById('pgPickerModal');
        if (ov) {
            ov.classList.remove('pgm-open');
            ov.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('pgm-lock');
        var s = document.getElementById('pgmPlSearch');
        if (s) { s.value = ''; pgmFilterPl(''); }
        if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
        document.querySelector('.bottom-bar').style.zIndex = '';
    };

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' &&
            document.getElementById('pgPickerModal')?.classList.contains('pgm-open')) {
            window.pgmClose();
        }
    });

    /* ════ RENDER: Product Line ════ */
    function renderPlList() {
        var dst = document.getElementById('pgmPlList');
        if (!dst) return;

        if (!_plAll.length) {
            dst.innerHTML = '<div class="pgm-empty">ไม่พบหมวดหมู่ย่อยในกลุ่มนี้</div>';
            syncPlAll();
            return;
        }

        var q = (document.getElementById('pgmPlSearch') || { value: '' }).value.trim().toLowerCase();

        // ✅ เรียง A-Z / ก-ฮ ก่อน render
        var sorted = _plAll.slice().sort((a, b) =>
            (a.prodlinename || '').localeCompare(b.prodlinename || '', 'th')
        );

        var html = '';

        sorted.forEach(function (pl) {  // ✅ เปลี่ยนตรงนี้
            var name = pl.prodlinename || '';
            var cnt = pl.count || 0;
            if (q && name.toLowerCase().indexOf(q) < 0) return;
            var on = !!_plSel[name];
            html += '<label class="pgm-row' + (on ? ' is-on' : '') + '">' +
                '<input type="checkbox"' + (on ? ' checked' : '') +
                ' onchange="pgmPlChange(this,\'' + esc(name) + '\')">' +
                '<span class="pgm-nm">' + esc(name) + '</span>' +
                '</label>';
        });

        dst.innerHTML = html || '<div class="pgm-empty">ไม่พบผลลัพธ์</div>';
        syncPlAll();
    }

    /* ════ RENDER: Brand ════ */
    function renderBrList() {
        var dst = document.getElementById('pgmBrList');
        var allCk = document.getElementById('pgmBrAll');
        if (!dst) return;

        if (!Object.keys(_plSel).length) {
            setBrPlaceholder();
            if (allCk) { allCk.checked = false; allCk.disabled = true; }
            return;
        }

        if (allCk) allCk.disabled = false;

        // ✅ กรองเฉพาะ brand ที่มีสินค้าใน PL ที่เลือก
        var selectedPlNames = Object.keys(_plSel);
        var brsToShow = _brAll;
        var _txt = (document.getElementById('txtSearchField')?.value || '').trim();
        var _maker = document.getElementById('makerId')?.value || '';
        var _range = document.getElementById('rangeId')?.value || '';

        var _ctxActive =
            (_lastSearchType === 'part' && _txt.length > 0) ||
            (_lastSearchType === 'vehicle' && (_maker || (_range && _range !== 'ALL')));

        if (_ctxActive) {
            var filteredBr = _brAll.filter(function (br) {
                return BASE_PRODUCTS.some(function (p) {
                    return selectedPlNames.includes(p.line) && p.brand === br.name;
                });
            });
            if (filteredBr.length > 0) brsToShow = filteredBr;
        }

        var isFirstTime = !Object.keys(_brSel).length;
        if (isFirstTime) {
            brsToShow.forEach(function (br) { _brSel[br.name] = true; });
        }

        var html = '';
        brsToShow.forEach(function (br) {
            var name = br.name || '';
            var on = !!_brSel[name];
            html += '<label class="pgm-row' + (on ? ' is-on' : '') + '">' +
                '<input type="checkbox"' + (on ? ' checked' : '') +
                ' onchange="pgmBrChange(this,\'' + esc(name) + '\')">' +
                '<span class="pgm-nm">' + esc(name) + '</span>' +
                '</label>';
        });

        dst.innerHTML = html || '<div class="pgm-empty">ไม่มียี่ห้อ</div>';
        syncBrAll();
    }

    function setPlLoading() {
        var dst = document.getElementById('pgmPlList');
        if (dst) dst.innerHTML = '<div class="pgm-loading">กำลังโหลดหมวดหมู่ย่อย...</div>';
    }

    function setBrPlaceholder() {
        var dst = document.getElementById('pgmBrList');
        if (dst) dst.innerHTML =
            '<div class="pgm-placeholder">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 8px;opacity:.4"><path d="M15 6l-6 6 6 6"/></svg>' +
            'เลือกหมวดหมู่ย่อยทางซ้ายก่อน<br>ยี่ห้อที่มีสินค้าในหมวดนั้นจะแสดงที่นี่</div>';
    }

    /* ════ CHANGE HANDLERS ════ */
    window.pgmPlChange = function (chk, name) {
        chk.closest('.pgm-row').classList.toggle('is-on', chk.checked);
        if (chk.checked) _plSel[name] = true;
        else delete _plSel[name];
        syncPlAll();
        _brSel = {};

        var selectedPlNames = Object.keys(_plSel);
        if (!selectedPlNames.length) {
            setBrPlaceholder();
            var allCk = document.getElementById('pgmBrAll');
            if (allCk) { allCk.checked = false; allCk.disabled = true; }
            updateFooter();
            return;
        }

        _loadBrandsForSelectedPl(selectedPlNames);
        updateFooter();
    };

    var _brReqVer = 0;

    function _loadBrandsForSelectedPl(selectedPlNames, keepBrSel) {
        var dst = document.getElementById('pgmBrList');
        var allCk = document.getElementById('pgmBrAll');

        if (!selectedPlNames.length) {
            setBrPlaceholder();
            if (allCk) { allCk.checked = false; allCk.disabled = true; }
            return;
        }

        var selectedPlIds = [];
        (MASTER_PRODUCT_LINES || []).forEach(function (pl) {
            if (selectedPlNames.indexOf(pl.prodlinename) >= 0) {
                var id = String(pl.prodlineid);
                if (selectedPlIds.indexOf(id) < 0) selectedPlIds.push(id);
            }
        });

        if (!selectedPlIds.length) {
            if (dst) dst.innerHTML = '<div class="pgm-empty">ไม่พบหมวดหมู่ย่อย</div>';
            return;
        }

        if (dst) dst.innerHTML = '<div class="pgm-loading">กำลังโหลดยี่ห้อ...</div>';
        if (allCk) allCk.disabled = true;

        var myVer = ++_brReqVer;

        $.ajax({
            url: urls.getBrandsByProductLine,
            method: 'GET',
            cache: false,
            data: { prodLineIds: selectedPlIds.join(',') },
            success: function (res) {
                if (myVer !== _brReqVer) return;

                var data = (res && res.IsSuccess && Array.isArray(res.Data)) ? res.Data : [];
                var activeCompanies = Array.from(
                    document.querySelectorAll('.company-btn[aria-pressed="true"]')
                ).map(function (b) { return b.dataset.company; });

                var seen = {};
                _brAll = data.filter(function (br) {
                    if (seen[br.id]) return false;
                    seen[br.id] = true;
                    return true;
                });

                if (keepBrSel) {
                    var valid = {};
                    _brAll.forEach(function (b) {
                        if (_brSel[b.name]) valid[b.name] = true;
                    });
                    _brSel = valid;
                } else {
                    _brSel = {};
                }

                renderBrList();
                updateFooter();
                if (allCk) allCk.disabled = false;
            },
            error: function () {
                if (myVer !== _brReqVer) return;
                if (dst) dst.innerHTML = '<div class="pgm-empty">โหลดยี่ห้อไม่สำเร็จ</div>';
            }
        });
    }

    window.pgmBrChange = function (chk, name) {
        chk.closest('.pgm-row').classList.toggle('is-on', chk.checked);
        if (chk.checked) _brSel[name] = true;
        else delete _brSel[name];
        syncBrAll();
        updateFooter();
    };

    /* ════ SELECT ALL ════ */
    window.pgmToggleAll = function (type, chk) {
        if (type === 'pl') {
            _plAll.forEach(function (pl) {
                if (chk.checked) _plSel[pl.prodlinename] = true;
                else delete _plSel[pl.prodlinename];
            });
            _brSel = {};
            renderPlList();

            var selectedPlNames = Object.keys(_plSel);
            if (!selectedPlNames.length) {
                setBrPlaceholder();
                var allCk = document.getElementById('pgmBrAll');
                if (allCk) { allCk.checked = false; allCk.disabled = true; }
            } else {
                _loadBrandsForSelectedPl(selectedPlNames); // ← ใช้ฟังก์ชันเดียวกัน
            }
        } else {
            _brAll.forEach(function (br) {
                if (chk.checked) _brSel[br.name] = true;
                else delete _brSel[br.name];
            });
            var dst = document.getElementById('pgmBrList');
            if (dst) dst.querySelectorAll('.pgm-row').forEach(function (row) {
                row.classList.toggle('is-on', chk.checked);
                var c = row.querySelector('input'); if (c) c.checked = chk.checked;
            });
        }
        updateFooter();
    };

    function syncPlAll() {
        var allCk = document.getElementById('pgmPlAll'); if (!allCk) return;
        var total = _plAll.length;
        var on = Object.keys(_plSel).length;
        allCk.checked = total > 0 && on === total;
        allCk.indeterminate = on > 0 && on < total;
    }

    function syncBrAll() {
        var allCk = document.getElementById('pgmBrAll');
        if (!allCk || allCk.disabled) return;
        var total = _brAll.length;
        var on = Object.keys(_brSel).length;
        allCk.checked = total > 0 && on === total;
        allCk.indeterminate = on > 0 && on < total;
    }

    /* ════ SEARCH ════ */
    window.pgmFilterPl = function (q) {
        renderPlList();
    };

    /* ════ FOOTER ════ */
    function updateFooter() {
        var plOn = Object.keys(_plSel).length;
        var brOn = Object.keys(_brSel).length;
        var brTot = _brAll.length;

        var sum = document.getElementById('pgmSum');
        if (sum) {
            sum.innerHTML = plOn
                ? 'หมวดหมู่ย่อย <b>' + plOn + '</b> · ยี่ห้อ <b>' + brOn + '/' + brTot + '</b>'
                : 'ยังไม่ได้เลือกหมวดหมู่ย่อย';
        }

        var btn = document.getElementById('pgmConfirm');
        if (btn) btn.disabled = !(plOn && brOn);

        var s2 = document.getElementById('pgmStep2');
        var s3 = document.getElementById('pgmStep3');
        if (s2) s2.className = 'pgm-step ' + (plOn ? 'pgm-done' : 'pgm-cur');
        if (s3) s3.className = 'pgm-step ' + (plOn && brOn ? 'pgm-cur' : '');
    }

    /* ════ CONFIRM ════ */
    window.pgmConfirm = function () {
        chkState.pl = {};
        Object.keys(_plSel).forEach(function (name) {
            var master = MASTER_PRODUCT_LINES.find(function (x) { return x.prodlinename === name; });
            chkState.pl[name] = master ? String(master.prodlineid) : null;
        });

        chkState.br = {};
        Object.keys(_brSel).forEach(function (name) {
            var master = MASTER_BRANDS.find(function (x) { return x.name === name; });
            chkState.br[name] = master ? String(master.id) : null;
        });

        // ✅ ข้อ 5+6: ล้างของกลุ่มเก่า แล้วจำเฉพาะกลุ่มที่เพิ่งยืนยัน
        _savedByGroup = {};
        _savedByGroup[String(_gid)] = {
            pl: Object.assign({}, _plSel),
            br: Object.assign({}, _brSel)
        };

        window.pgmClose();

        activeGroup = String(_gid);
        window.selectedGroupId = String(_gid);

        document.querySelectorAll('.bb-item').forEach(function (b) {
            b.classList.toggle('active', String(b.dataset.id) === String(_gid));
        });

        showSkel();

        searchProductByCategory().finally(function () {
            hideSkel();
            renderActiveFilterChips();
            _updateSidebar();
            window._isSearchingCategory = false;
            document.querySelectorAll('.bb-item')
                .forEach(function (b) { b.style.pointerEvents = ''; });
            var nr = document.getElementById('nfRows');
            if (nr) nr.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    /* ล้างค่าที่จำไว้ทั้งหมด */
    window.pgmResetSaved = function () {
        _savedByGroup = {};
    };

    /* sync ค่าที่จำไว้ให้ตรงกับ chip ปัจจุบัน (ใช้หลังลบ chip) */
    window.pgmSyncSaved = function () {
        var gid = String(activeGroup);
        if (gid === '0' || !_savedByGroup[gid]) return;
        _savedByGroup[gid] = {
            pl: Object.assign({}, chkState.pl),
            br: Object.assign({}, chkState.br)
        };
    };

    /* ════ แทนที่ selectGroup() เดิม ════ */
    window.selectGroup = function (id) {
        var now = Date.now();
        if (window._lastSelectGroupTime && now - window._lastSelectGroupTime < 500) return;
        window._lastSelectGroupTime = now;

        /* "สินค้าทุกประเภท" → clear ไม่ต้องเปิด modal */
        if (String(id) === '0') {
            activeGroup = '0';
            window.selectedGroupId = '0';
            document.querySelectorAll('.bb-item').forEach(function (b) {
                b.classList.toggle('active', String(b.dataset.id) === '0');
            });
            _resetSidebarFilters();
            chkState.pl = {};
            chkState.br = {};
            window.pgmResetSaved();          // ✅ เพิ่มบรรทัดนี้
            _applyFiltersAndRender();
            renderActiveFilterChips();
            return;
        }
        if (!_requireSalesmanAndCustomer()) return;
        /* หา group name จาก GROUPS */
        var grpName = String(id);
        if (typeof GROUPS !== 'undefined') {
            var found = GROUPS.find(function (g) { return String(g.id) === String(id); });
            if (found) grpName = found.label || found.name || grpName;
        }

        var clickedEl = document.querySelector('.bb-item[data-id="' + id + '"]');
        pgmOpen(id, grpName, clickedEl);
    };

})();
//--------------------------------------------New Catagory
function _requireSalesmanAndCustomer() {
    const slm = $("#salesmanId").val() || '';
    const cus = $("#customerId").val() || '';

    if (!slm || !cus) {
        Swal.fire({
            icon: 'warning',
            title: 'กรุณาเลือกข้อมูลก่อนค้นหา',
            html: `
                <div style="font-size:14px;color:#555;line-height:1.8">
                    ${!slm ? '<div>📋 กรุณาเลือก <strong>Salesman</strong></div>' : ''}
                    ${!cus ? '<div>🏪 กรุณาเลือก <strong>Customer</strong></div>' : ''}
                </div>
            `,
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#e63946'
        });
        return false;
    }
    return true;
}