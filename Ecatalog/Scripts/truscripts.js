/* ════════════════════════════════
   DATA
   หมายเหตุ: ลบ demo PRODUCTS array ออกแล้ว
   ตอนนี้ PRODUCTS จะถูกเติมค่าจาก loadSearchProductVio()
   ซึ่งดึงข้อมูลจาก API: GetProductBySearchVio
════════════════════════════════ */
let PRODUCTS = [];

const GROUPS = [
    { id: 'สินค้าทุกประเภท', icon: 'bi-grid-3x3-gap', label: 'สินค้าทุกประเภท', isClear: true },
    { id: 'Universal', icon: 'bi-stars', label: 'Universal' },
    { id: 'กรอง', icon: 'bi-funnel', label: 'กรอง' },
    { id: 'โช้คอัพ', icon: 'bi-arrow-down-up', label: 'โช้คอัพ' },
    { id: 'แบตเตอรี่', icon: 'bi-battery-charging', label: 'แบตเตอรี่' },
    { id: 'ใบปัดน้ำฝน', icon: 'bi-water', label: 'ใบปัดน้ำฝน' },
    { id: 'ระบบคลัทช์', icon: 'bi-gear', label: 'ระบบคลัทช์' },
    { id: 'ระบบช่วงล่างและบังคับเลี้ยว', icon: 'bi-arrows-move', label: 'ระบบช่วงล่างฯ' },
    { id: 'ระบบเบรก', icon: 'bi-stop-circle', label: 'ระบบเบรก' },
    { id: 'ระบบเบรกลม', icon: 'bi-wind', label: 'ระบบเบรกลม' },
    { id: 'ระบบสายพานส่งกำลัง', icon: 'bi-infinity', label: 'สายพานส่งกำลัง' },
    { id: 'ระบบแอร์', icon: 'bi-snow', label: 'ระบบแอร์' },
    { id: 'ระบายความร้อน', icon: 'bi-thermometer-high', label: 'ระบายความร้อน' },
    { id: 'สินค้ากลุ่มไฟฟ้า', icon: 'bi-lightning', label: 'สินค้ากลุ่มไฟฟ้า' },
    { id: 'สินค้ากลุ่มELECTRONIC', icon: 'bi-cpu', label: 'ELECTRONIC' },
    { id: 'ระบบเครื่องยนต์', icon: 'bi-gear-wide-connected', label: 'ระบบเครื่องยนต์' },
    { id: 'ปั๊มและหัวฉีดดีเซล', icon: 'bi-droplet', label: 'ปั๊ม/หัวฉีดดีเซล' },
    { id: 'ลูกปืน', icon: 'bi-circle', label: 'ลูกปืน' },
    { id: 'ซีล', icon: 'bi-shield', label: 'ซีล' },
    { id: 'ท่อ', icon: 'bi-arrows-expand', label: 'ท่อ' },
    { id: 'ของเหลว จารบีและอื่นๆ', icon: 'bi-droplet-half', label: 'ของเหลว/จารบี' },
    { id: 'คาร์แคร์', icon: 'bi-car-front', label: 'คาร์แคร์' },
    { id: 'หลอดไฟ', icon: 'bi-lightbulb', label: 'หลอดไฟ' },
    { id: 'ระบบเพลา', icon: 'bi-arrow-left-right', label: 'ระบบเพลา' },
    { id: 'ระบบกันการสั่นสะเทือน', icon: 'bi-activity', label: 'กันสั่นสะเทือน' },
    { id: 'ระบบเกียร์ธรรมดา', icon: 'bi-gear-wide', label: 'เกียร์ธรรมดา' },
    { id: 'ตัวถัง', icon: 'bi-box', label: 'ตัวถัง' },
    { id: 'เครื่องมือ และเครื่องเช็คหัวฉีด', icon: 'bi-tools', label: 'เครื่องมือ' },
    { id: 'เครื่องเสียงรถยนต์', icon: 'bi-speaker', label: 'เครื่องเสียง' },
    { id: 'น้ำยาต่างๆ', icon: 'bi-flask', label: 'น้ำยาต่างๆ' },
    { id: 'อื่นๆ', icon: 'bi-three-dots', label: 'อื่นๆ' },
];

/* ════════════════════════════════
   STATE
════════════════════════════════ */
let cart = [];
let cartCnt = 0;
let vfData = {};
let chkState = { pl: {}, br: {} };
let fitState = new Set();
let activeGroup = 'สินค้าทุกประเภท';
let currentSort = 'carModel';
let activeModes = new Set(['description']); // multi-select search modes
let activeGroups = [];

/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
const gEl = id => document.getElementById(id);
const g = id => document.getElementById(id);
const isMobile = () => window.innerWidth <= 991;
const fmt = v => '฿' + v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const totalAddress = document.querySelectorAll('#osAddrList .os-addr-item').length;

document.getElementById('totalAddr').innerText =
    totalAddress + ' ที่อยู่';

/* ════════════════════════════════
   INIT
════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    renderBB();
    // ไม่ render demo data แล้ว — รอข้อมูลจาก API
    // ถ้าต้องการให้โหลดสินค้าทันทีตอนเปิดหน้า (ก่อนเลือก vehicle filter)
    // ให้เปิดคอมเมนต์บรรทัดด้านล่าง (ต้องเช็คกับ backend ว่ารองรับ filter ว่างหรือไม่)
    // loadSearchProductVio();

    // แสดง empty state เริ่มต้น
    renderProducts(PRODUCTS);

    setTimeout(() => { gEl('guide').style.display = 'block'; }, 900);
});

/* ════════════════════════════════
   API: SEARCH PRODUCTS BY VEHICLE (GetProductBySearchVio)
════════════════════════════════ */
async function loadSearchProductVio() {
    const btn = gEl('btnSearchProductVio');
    if (btn) btn.disabled = true;

    const marketSegmentId = vfData.market || gEl('marketsegId')?.value || "";
    const segmentId = vfData.segment || gEl('segmentId')?.value || "";
    const makerId = vfData.maker || gEl('makerId')?.value || "";
    const rangeId = vfData.range || gEl('rangeId')?.value || "";
    const bodyId = vfData.body || gEl('bodyId')?.value || "";
    const engineId = vfData.engine || gEl('engineId')?.value || "";
    const yearFrom = gEl('yearFrom')?.value || "";
    const yearTo = gEl('yearTo')?.value || "";
    const driveType = vfData.drive || gEl('driveId')?.value || "";

    showSkel();

    try {
        const result = await ajaxCallApiService(API_URLS.getProductBySearchVio, {
            marketSegmentId, segmentId, makerId, rangeId,
            bodyId, engineId, yearFrom, yearTo, driveType
        });

        if (result.IsSuccess) {
            const cacheEl = gEl('cacheStatus');
            if (cacheEl) {
                cacheEl.textContent =
                    (result.IsFromCache ? "Cache Hit" : "API Call") + " (" + result.ExecutionTime + " ms)";
            }
            PRODUCTS = mapApiResponseToProducts(result.Data || []);
        } else {
            PRODUCTS = [];
            toast(result.Message || 'ไม่พบข้อมูลสินค้า', 'warn');
        }
    } catch (ex) {
        console.error(ex);
        PRODUCTS = [];
        toast('เกิดข้อผิดพลาดในการดึงข้อมูล', 'warn');
    } finally {
        hideSkel();
        if (btn) btn.disabled = false;
        applyAllFilters();
    }
}

/* ── แปลงโครงสร้าง API response (group → productList) เป็น flat array ── */
function mapApiResponseToProducts(groups) {
    const list = [];
    let autoId = 1;

    (groups || []).forEach(group => {
        (group.productList || []).forEach(item => {
            const qty = parseInt(item.qtyReady, 10);
            list.push({
                id: autoId++,
                code: item.stkcode || '',
                name: item.stkcodeDescription || item.stkcode || '—',
                price: parseFloat(item.price) || 0,
                stock: isNaN(qty) ? 99 : qty,
                cat: item.productGroup || group.productGroupNameMain || 'อื่นๆ',
                brand: item.brand || '—',
                line: item.productLine || 'อื่นๆ',
                fit: [], // API ยังไม่มีข้อมูลตำแหน่ง (หน้า/หลัง/ซ้าย/ขวา)
                carModel: [item.makerName, item.modelName].filter(Boolean).join(' ') || 'Universal',
                img: item.imageUrl || '/Content/images/no-image.png'
            });
        });
    });

    return list;
}

/* ════════════════════════════════
   §1 — SEARCH SYNC (two inputs)
   Header input ↔ Sidebar input
════════════════════════════════ */
function syncSearch(source) {
    const headerQ = gEl('headerQ');
    const partQ = gEl('partQ');
    if (source === 'header') {
        partQ.value = headerQ.value;
    } else {
        headerQ.value = partQ.value;
    }
    activateSec(2);
    applyAllFilters();
}

/* ════════════════════════════════
   §2 — SEARCH MODE (multi-select)
════════════════════════════════ */
function toggleMode(btn) {
    const mode = btn.dataset.mode;
    if (activeModes.has(mode)) {
        // Don't allow deselecting all — keep at least one
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

/* ════════════════════════════════
   §3 — CLEAR ALL FILTERS
   Removes veh-pills, resets all filters, shows all products
════════════════════════════════ */
function clearAllFilters() {
    // 1. Clear vehicle filter selections
    vfData = {};
    ['marketsegId', 'segmentId', 'makerId', 'rangeId', 'bodyId', 'engineId', 'driveId'].forEach(id => {
        const el = gEl(id); if (el) el.value = '';
    });
    const yrFrom = gEl('yearFrom'); if (yrFrom) yrFrom.value = '';
    const yrTo = gEl('yearTo'); if (yrTo) yrTo.value = '';
    gEl('vfTags').innerHTML = '';

    // 2. Remove veh-pills from #vehSummary
    gEl('vehSummary').innerHTML = `
    <div class="veh-empty">
      <i class="bi bi-car-front" style="font-size:1.1rem"></i>
      <span>Select vehicle attributes in the left panel to filter parts</span>
    </div>`;

    // 3. Reset checkbox filters
    chkState = { pl: {}, br: {} };
    document.querySelectorAll('.chk-item.checked').forEach(el => el.classList.remove('checked'));

    // 4. Reset fit chips
    fitState = new Set();
    document.querySelectorAll('.fit-chip.active').forEach(el => el.classList.remove('active'));

    // 5. Reset search inputs
    gEl('partQ').value = '';
    gEl('headerQ').value = '';

    // 6. Reset sort
    currentSort = 'carModel';
    gEl('sortSelect').value = 'carModel';

    // 7. Reset search modes to default (Description only)
    activeModes = new Set(['description']);
    document.querySelectorAll('.smode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === 'description');
    });

    // 8. Clear active filter chips
    gEl('activeFilters').innerHTML = '';

    // 9. Close spec (modal on desktop, drawer on mobile)
    closeSpecModal({ target: gEl('specModalBackdrop') });
    closeDrawer();

    // 10. Reset product list (no vehicle selected → no API call)
    PRODUCTS = [];
    showSkel();
    setTimeout(() => { hideSkel(); renderProducts(PRODUCTS); }, 350);

    // Remove section highlights
    [1, 2, 3, 4].forEach(i => {
        gEl('lb' + i)?.classList.remove('active-badge');
        gEl('rb' + i)?.classList.remove('active-badge');
    });
    gEl('rz1')?.classList.remove('g1', 'g2', 'g3', 'g4');
    gEl('rz2')?.classList.remove('g1', 'g2', 'g3', 'g4');
}

/* ════════════════════════════════
   §4 — SORTING
════════════════════════════════ */
function sortProducts(val) {
    currentSort = val;
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
    return arr.sort((a, b) => (a.carModel || '').localeCompare(b.carModel || '', 'th')); // default = carModel
}

/* ════════════════════════════════
   §5 — BOTTOM BAR (bb-scroll)
   Multi-select with สินค้าทุกประเภท = clear all in that row
════════════════════════════════ */
function renderBB() {
    gEl('bbScroll').innerHTML = GROUPS.map(g => `
    <div class="bb-item ${g.id === activeGroup ? 'active' : ''} ${g.id === 'Universal' ? 'bb-universal' : ''}" onclick="selectGroup('${g.id}')">
      <i class="bi ${g.icon}"></i>
      <span class="bb-label">${g.label}</span>
    </div>`).join('');
}
function scrollBB(dx) { gEl('bbScroll').scrollBy({ left: dx, behavior: 'smooth' }); }

function selectGroup(id) {
    activeGroup = id;
    document.querySelectorAll('.bb-item').forEach((b, i) => {
        b.classList.toggle('active', GROUPS[i].id === id);
    });
    document.querySelectorAll('.pg-nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.gid === id);
    });
    // Scroll active into view
    const activeNav = document.querySelector(`.pg-nav-btn[data-gid="${id}"]`);
    if (activeNav) activeNav.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const activeBB = document.querySelector('.bb-item.active');
    if (activeBB) activeBB.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    updateBreadcrumb(id, 'Parts Catalog');
    showSkel();
    setTimeout(() => { hideSkel(); applyAllFilters(); }, 500);
}

/* ════════════════════════════════
   §6 — PRODUCT DETAIL / SPEC
   Desktop (≥992 px) → modal popup   (original behaviour)
   Mobile  (<992 px) → PartHub-style slide-in drawer
════════════════════════════════ */
let activeProduct = null;


function selCard(id) {
    document.querySelectorAll('.pcard').forEach(c => c.classList.remove('active-card'));
    gEl('pc-' + id)?.classList.add('active-card');
}

/* ── shared spec HTML builder (used by modal) ── */
function buildSpecHTML(p) {
    return `
    <div class="spec-hero">
      <img src="${p.img}" alt="${p.name}" onerror="this.onerror=null;this.src='/Content/images/no-image.png'">
      <div class="spec-hero-meta flex-grow-1">
        <h5>${p.name}</h5>
        <p>${p.code}</p>
        <p style="font-size:12px;color:var(--text-3);margin-top:3px">—</p>
        <div class="mt-2 d-flex align-items-center gap-3">
          <div class="spec-price">฿${p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
          <input type="number" class="qty" value="1" min="1" max="99" onclick="event.stopPropagation()">
          <button class="acart ${(p.stock ?? 99) === 0 ? 'bo-btn' : ''}" style="max-width:160px" onclick="addCart(${p.id},event)">
            <i class="bi ${(p.stock ?? 99) === 0 ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${(p.stock ?? 99) === 0 ? 'จอง (BO)' : 'เพิ่ม'}
          </button>
        </div>
      </div>
    </div>
    <div class="stabs-nav">
      <button class="stab-btn active" onclick="switchTabIn(this,'desc','${p.id}')"><i class="bi bi-file-text"></i> Description</button>
      <button class="stab-btn" onclick="switchTabIn(this,'spec','${p.id}')"><i class="bi bi-rulers"></i> Spec</button>
      <button class="stab-btn" onclick="switchTabIn(this,'img','${p.id}')"><i class="bi bi-images"></i> Image</button>
    </div>
    <div class="stab-content">
      <div class="stab-pane active" id="itab-desc-${p.id}">
        <p style="font-size:13px;line-height:1.7;color:var(--text-2)">
          ${p.name}
        </p>
        <div class="row g-2 mt-1">
          <div class="col-6 col-sm-3"><div style="background:var(--surface-2);border-radius:7px;padding:9px;text-align:center;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase;font-weight:600">Category</div><div style="font-size:12px;font-weight:600;margin-top:3px">${p.cat}</div></div></div>
          <div class="col-6 col-sm-3"><div style="background:var(--surface-2);border-radius:7px;padding:9px;text-align:center;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase;font-weight:600">Product Line</div><div style="font-size:12px;font-weight:600;margin-top:3px">${p.line}</div></div></div>
          <div class="col-6 col-sm-3"><div style="background:var(--surface-2);border-radius:7px;padding:9px;text-align:center;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase;font-weight:600">Vehicle</div><div style="font-size:12px;font-weight:600;margin-top:3px">${p.carModel}</div></div></div>
          <div class="col-6 col-sm-3"><div style="background:var(--surface-2);border-radius:7px;padding:9px;text-align:center;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase;font-weight:600">Brand</div><div style="font-size:12px;font-weight:600;margin-top:3px">${p.brand}</div></div></div>
        </div>
      </div>
      <div class="stab-pane" id="itab-spec-${p.id}">
        <table class="spec-table">
          <tr><td>Stock Code</td><td>${p.code}</td></tr>
          ${(p.stock ?? 99) === 0 ? `<tr><td>สถานะสินค้า</td><td><span class="bo-tag" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;background:#fff3cd;color:#856404;border:1px solid #ffc107;border-radius:6px;padding:2px 9px"><i class="bi bi-hourglass-split"></i> จอง (Back Order)</span></td></tr>` : ''}
          <tr><td>คงเหลือ</td><td>${p.stock} ชิ้น</td></tr>
          <tr><td>กลุ่มสินค้า</td><td>${p.cat}</td></tr>
          <tr><td>สายผลิตภัณฑ์</td><td>${p.line}</td></tr>
          <tr><td>Brand</td><td>${p.brand}</td></tr>
          <tr><td>รุ่นรถที่ใช้ได้</td><td>${p.carModel}</td></tr>
        </table>
      </div>
      <div class="stab-pane" id="itab-img-${p.id}">
        <div class="img-grid">
          <div class="img-ph"><i class="bi bi-camera"></i><span>Front View</span></div>
          <div class="img-ph"><i class="bi bi-camera"></i><span>Side View</span></div>
        </div>
      </div>
    </div>`;
}

/* ── single entry point called by every card ── */
function openDrawer(id, e) {
    if (e) e.stopPropagation();
    selCard(id);
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    activeProduct = p;
    activateSec(4);
    updateBreadcrumb(activeGroup, p.name);

    if (isMobile()) {
        /* ── MOBILE: PartHub-style slide-in drawer ── */
        gEl('drTitle').textContent = p.name;
        gEl('drCode').textContent = p.code;
        gEl('drCode2').textContent = p.code;
        gEl('drImg').src = p.img;
        gEl('drBrand').textContent = p.brand;
        gEl('drName').textContent = p.name;
        gEl('drPrice').textContent = '฿' + p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 });
        gEl('drDescFull').textContent = p.name;
        gEl('drCat').textContent = p.cat;
        gEl('drBrandCard').textContent = p.brand;
        gEl('drPN').textContent = p.code;
        // BO status row in mobile drawer spec tab
        const drBoRow = gEl('drBoRow');
        if (drBoRow) drBoRow.style.display = (p.stock ?? 99) === 0 ? '' : 'none';
        const drAddBtn = gEl('drAddBtn');
        if (drAddBtn) {
            const isBO = (p.stock ?? 99) === 0;
            drAddBtn.className = 'dr-add-btn' + (isBO ? ' bo-btn' : '');
            drAddBtn.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'Add to Cart'}`;
        }
        gEl('drawerOverlay').classList.add('open');
        gEl('specDrawer').classList.add('open');
        document.body.style.overflow = 'hidden';
        switchDrTab(gEl('specDrawer').querySelector('.drtab'), 'desc');
    } else {
        /* ── DESKTOP: centred modal popup (original) ── */
        gEl('specModalContent').innerHTML = buildSpecHTML(p);
        gEl('specModalBackdrop').classList.add('open');
        document.body.style.overflow = 'hidden';
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
    gEl('drawerOverlay').classList.remove('open');
    gEl('specDrawer').classList.remove('open');
    document.body.style.overflow = '';
    document.querySelectorAll('.pcard').forEach(c => c.classList.remove('active-card'));
    gEl('rb4')?.classList.remove('active-badge');
    updateBreadcrumb(activeGroup, 'Parts Catalog');
}

/* ── Tab switching inside modal ── */
function switchTabIn(btn, tabId, pid) {
    const container = btn.closest('.spec-modal-body') || btn.closest('.spec-wrap');
    if (!container) return;
    container.querySelectorAll('.stab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = container.querySelector(`#itab-${tabId}-${pid}`);
    if (pane) pane.classList.add('active');
    badge('rb4');
}

/* ── Tab switching inside drawer ── */
function switchDrTab(btn, id) {
    gEl('specDrawer').querySelectorAll('.drtab').forEach(b => b.classList.remove('active'));
    gEl('specDrawer').querySelectorAll('.drpane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    gEl('dp-' + id)?.classList.add('active');
    badge('rb4');
}

/* ── Add to cart from drawer ── */
function addCartFromDrawer(e) {
    if (e) e.stopPropagation();
    if (!activeProduct) return;
    const qty = parseInt(gEl('drQty')?.value) || 1;
    const ex = cart.find(c => c.id === activeProduct.id);
    if (ex) ex.qty += qty; else cart.push({ ...activeProduct, qty });
    updateCart();
    toast(`🛒 เพิ่ม "${activeProduct.name.substring(0, 30)}…"`);
}

/* ── Escape key: close whichever is open ── */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (gEl('specModalBackdrop')?.classList.contains('open'))
        closeSpecModal({ target: gEl('specModalBackdrop') });
    else if (gEl('specDrawer')?.classList.contains('open'))
        closeDrawer();
});

/* ── Orientation change: if rotated to desktop while drawer is open, swap to modal ── */
window.addEventListener('resize', () => {
    if (!isMobile() && gEl('specDrawer')?.classList.contains('open')) {
        const p = activeProduct;
        closeDrawer();
        if (p) {
            gEl('specModalContent').innerHTML = buildSpecHTML(p);
            gEl('specModalBackdrop').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }
});

/* ════════════════════════════════
   GROUP BY helper – groups Netflix rows by the current sort key
════════════════════════════════ */
function groupByLine(list, forceByLine) {
    const keyFn = p =>
        forceByLine ? (p.line || 'อื่นๆ') :
            currentSort === 'carModel' ? (p.carModel || 'อื่นๆ') :
                currentSort === 'brand' ? (p.brand || 'อื่นๆ') :
                    currentSort === 'part' ? (p.line || 'อื่นๆ') :
                        (p.line || 'อื่นๆ');
    const map = {};
    list.forEach(p => {
        const key = keyFn(p);
        if (!map[key]) map[key] = [];
        map[key].push(p);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'th'));
}

function nfScroll(rowId, dir) {
    const el = gEl(rowId);
    if (el) el.scrollBy({ left: dir * 660, behavior: 'smooth' });
}

/* ════════════════════════════════
   RENDER PRODUCTS
════════════════════════════════ */
function renderProducts(list) {
    const sorted = applySorting(list);
    const pGrid = gEl('pGrid');
    const nfRows = gEl('nfRows');
    const isGrouped = true; // always use Netflix grouped mode
    const hasFilter = Object.keys(chkState.pl).length || fitState.size || Object.keys(chkState.br).length;

    gEl('rcount').textContent = sorted.length + ' items';

    const stockLabel = s =>
        s === 0 ? `<span class="pstock out-stock"><i class="bi bi-exclamation-circle-fill"></i> หมดสต็อก</span>` :
            s <= 5 ? `<span class="pstock low-stock"><i class="bi bi-exclamation-circle-fill"></i> เหลือ ${s}</span>` :
                `<span class="pstock in-stock"><i class="bi bi-check-circle-fill"></i> ${s} ชิ้น</span>`;

    const pcardHTML = p => {
        return `
    <div class="pcard ${hasFilter ? 'highlight-filter' : ''}" id="pc-${p.id}" onclick="openDrawer(${p.id},event)" style="cursor:pointer">
      <div class="pimg">
        ${stockLabel(p.stock ?? 99)}
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='/Content/images/no-image.png'">
      </div>
      <div class="pbody">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:3px">
          <div class="pcode">${p.code}</div>
          <div class="pname" style="font-size:10.5px;font-weight:700;color:var(--primary);background:var(--primary-light);border-radius:20px;padding:1px 8px;white-space:nowrap;flex-shrink:0">${p.brand}</div>
        </div>
        <div class="pname">${p.name}</div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:4px;margin-bottom:2px">
          ${p.carModel === 'Universal'
                ? `<span style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#fef9c3,#fde68a);color:#92400e;border:1px solid #f59e0b;border-radius:20px;padding:1px 9px;display:inline-flex;align-items:center;gap:3px"><i class="bi bi-stars" style="font-size:9px"></i> Universal</span>`
                : `<i class="bi bi-car-front-fill" style="font-size:10px;color:var(--text-3)"></i><span style="font-size:11px;color:var(--text-2);font-weight:500">${p.carModel}</span>`
            }
        </div>
        ${p.fit && p.fit.length ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px">${p.fit.map(f => `<span style="font-size:10px;border:1px solid var(--border);border-radius:10px;padding:1px 7px;color:var(--text-3)">${f}</span>`).join('')}</div>` : ''}
        <div class="pprice">฿${p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })} <span>/ unit</span></div>
      </div>
      <div class="pfooter">
        <input type="number" class="qty" value="1" min="1" max="99" id="qty-${p.id}" onclick="event.stopPropagation()">
        <button class="acart ${(p.stock ?? 99) === 0 ? 'bo-btn' : ''}" id="cb-${p.id}" onclick="addCart(${p.id},event)">
          <i class="bi ${(p.stock ?? 99) === 0 ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${(p.stock ?? 99) === 0 ? 'จอง (BO)' : 'เพิ่ม'}
        </button>
      </div>
    </div>`;
    };

    if (!sorted.length) {
        const noHTML = '<div class="no-results"><i class="bi bi-search"></i><p>ไม่พบสินค้าตามเงื่อนไขที่เลือก<br>กรุณาเลือกข้อมูลรถยนต์ในแถบด้านซ้าย หรือปรับตัวกรอง</p></div>';
        if (isGrouped) {
            pGrid.style.display = 'none';
            nfRows.style.display = 'flex';
            nfRows.innerHTML = noHTML;
        } else {
            nfRows.style.display = 'none';
            pGrid.style.display = 'grid';
            pGrid.innerHTML = noHTML;
        }
        return;
    }

    if (isGrouped) {
        /* ── NETFLIX MODE: one horizontal scrollable row per Product Line ── */
        pGrid.style.display = 'none';
        nfRows.style.display = 'flex';

        const groups = groupByLine(sorted, activeGroup === 'สินค้าทุกประเภท');
        const groupIcon =
            currentSort === 'carModel' ? 'bi-car-front-fill' :
                currentSort === 'brand' ? 'bi-award' :
                    'bi-tag';
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

    } else {
        /* ── FLAT MODE: original product-grid (สินค้าทุกประเภท) ── */
        nfRows.style.display = 'none';
        pGrid.style.display = 'grid';
        pGrid.innerHTML = sorted.map(p => pcardHTML(p)).join('');
    }
}

/* ════════════════════════════════
   APPLY ALL FILTERS
════════════════════════════════ */
function applyAllFilters() {
    const q = gEl('partQ').value.toLowerCase().trim();
    const plK = Object.keys(chkState.pl);
    const brK = Object.keys(chkState.br);
    const fitK = [...fitState];

    const list = PRODUCTS.filter(p => {
        // Group filter (Bottom Bar category)
        if (activeGroup && activeGroup !== 'สินค้าทุกประเภท') {
            if (p.cat !== activeGroup) return false;
        }
        // Text search (respects active search modes)
        if (q) {
            let match = false;
            if (activeModes.has('description') && p.name.toLowerCase().includes(q)) match = true;
            if (activeModes.has('oe') && p.code.toLowerCase().includes(q)) match = true;
            if (activeModes.has('competitor') && p.brand.toLowerCase().includes(q)) match = true;
            if (!match) return false;
        }
        if (plK.length && !plK.includes(p.line)) return false;
        if (brK.length && !brK.includes(p.brand)) return false;
        if (fitK.length && !fitK.some(f => p.fit.includes(f))) return false;
        return true;
    });

    renderProducts(list);
}

/* ════════════════════════════════
   ACTIVE FILTER CHIPS
════════════════════════════════ */
function renderActiveChips() {
    const chips = [];
    Object.keys(chkState.pl).forEach(v => chips.push({ t: 'pl', v, cls: 'af-pl' }));
    [...fitState].forEach(v => chips.push({ t: 'fi', v, cls: 'af-fi' }));
    Object.keys(chkState.br).forEach(v => chips.push({ t: 'br', v, cls: 'af-br' }));
    gEl('activeFilters').innerHTML = chips.map(c =>
        `<span class="af-chip ${c.cls}" onclick="removeChip('${c.t}','${c.v}')">${c.v} <i class="bi bi-x-circle"></i></span>`
    ).join('');
}

function removeChip(t, v) {
    if (t === 'pl') { delete chkState.pl[v]; document.querySelectorAll('#plList .chk-item').forEach(l => { if (l.textContent.trim().startsWith(v)) l.classList.remove('checked'); }); }
    else if (t === 'br') { delete chkState.br[v]; document.querySelectorAll('#brList .chk-item').forEach(l => { if (l.textContent.trim().startsWith(v)) l.classList.remove('checked'); }); }
    else if (t === 'fi') { fitState.delete(v); document.querySelectorAll('.fit-chip').forEach(c => { if (c.textContent.trim() === v) c.classList.remove('active'); }); }
    renderActiveChips();
    applyAllFilters();
}

/* ════════════════════════════════
   §1 — VEHICLE FILTER
   vfData keys: market, segment, maker, range, body, engine, drive
   ผูกกับ select#marketsegId, #segmentId, #makerId, #rangeId, #bodyId, #engineId, #driveId
════════════════════════════════ */
function vfChange(sel, key) {
    activateSec(1);
    if (sel.value) { vfData[key] = sel.value; } else { delete vfData[key]; }
    renderVfTags();
    updateVehSummary();
    loadSearchProductVio(); // เปลี่ยน vehicle filter → ดึงข้อมูลสินค้าใหม่จาก API
}

function updateVehSummary() {
    const s = gEl('vehSummary');
    if (!Object.keys(vfData).length) {
        s.innerHTML = '<div class="veh-empty"><i class="bi bi-car-front" style="font-size:1.1rem"></i><span>Select vehicle attributes to filter parts</span></div>';
        return;
    }
    const ic = { market: '🌏', segment: '🚗', maker: '🏭', range: '📋', body: '🚙', engine: '⚙️', drive: '⚡' };
    s.innerHTML = Object.entries(vfData).map(([k, v]) => `<div class="veh-pill"><span>${ic[k] || '🔧'}</span>${v}</div>`).join('');
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

/* ════════════════════════════════
   §2 — SEARCH (run on button click)
   ใช้กรองข้อมูลที่ได้จาก PRODUCTS (client-side) — ไม่เรียก API ใหม่
════════════════════════════════ */
function runSearch() {
    activateSec(2);
    showSkel();
    setTimeout(() => {
        hideSkel();
        applyAllFilters();
        gEl('rz2').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

/* ════════════════════════════════
   §3 — CHECKBOX FILTERS
════════════════════════════════ */
function toggleChk(label, type, val) {
    label.classList.toggle('checked');
    if (label.classList.contains('checked')) { chkState[type][val] = true; }
    else { delete chkState[type][val]; }
    activateSec(3);
    showSkel();
    setTimeout(() => { hideSkel(); applyAllFilters(); renderActiveChips(); }, 400);
}

function toggleFit(chip, val) {
    chip.classList.toggle('active');
    if (chip.classList.contains('active')) { fitState.add(val); }
    else { fitState.delete(val); }
    activateSec(3);
    showSkel();
    setTimeout(() => { hideSkel(); applyAllFilters(); renderActiveChips(); }, 400);
}

/* ════════════════════════════════
   CART
════════════════════════════════ */
function addCart(id, e) {
    if (e) e.stopPropagation();
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const qty = parseInt(gEl('qty-' + id)?.value) || 1;
    const ex = cart.find(c => c.id === id);
    if (ex) ex.qty += qty; else cart.push({ ...p, qty, isBO: (p.stock ?? 99) === 0 });
    updateCart();
    const btn = gEl('cb-' + id);
    const isBO = (p.stock ?? 99) === 0;
    if (btn) {
        btn.classList.add('added');
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Added';
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'เพิ่ม'}`;
        }, 1500);
    }
    toast(`🛒 เพิ่ม "${p.name.substring(0, 30)}…" ฿${p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);
}

/* ════════════════════════════════
   SKELETON
════════════════════════════════ */
function showSkel() {
    gEl('skelWrap').style.display = 'block';
    gEl('pGrid').style.display = 'none';
    gEl('nfRows').style.display = 'none';
}
function hideSkel() {
    gEl('skelWrap').style.display = 'none';
    /* pGrid / nfRows visibility managed inside renderProducts */
}

/* ════════════════════════════════
   BREADCRUMB
════════════════════════════════ */
function updateBreadcrumb(group, page) {
    //gEl('bc2').textContent = group || 'ระบบเบรก';
    gEl('bc3').textContent = page || 'Parts Catalog';
}

/* ════════════════════════════════
   SECTION ACTIVATION
════════════════════════════════ */
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
// ---------------------------------------------

function openCart() {
    document.getElementById('cartPanel').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
}
function closeCart() {
    document.getElementById('cartPanel').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
}
function clearCart() { cart = []; updateCart(); toast('🗑️ ล้างตะกร้าแล้ว', 'warn'); }
function removeFromCart(id) { cart = cart.filter(c => c.id !== id); updateCart(); }
function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    updateCart();
}
function updateCart() {
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const count = cart.reduce((s, c) => s + c.qty, 0);
    g('cartCount').textContent = count;
    g('cpCount').textContent = `${cart.length} ชิ้น`;
    g('cpTotal').textContent = fmt(total);
    const qsCart = g('qs-cart'); if (qsCart) qsCart.textContent = cart.length;
    if (!cart.length) { g('cpBody').innerHTML = '<div class="cp-empty"><i class="bi bi-cart-x"></i><p>ยังไม่มีสินค้าในตะกร้า</p></div>'; return; }
    g('cpBody').innerHTML = cart.map(c => `
    <div class="cart-row">
      <img src="${c.img}" alt="" onerror="this.onerror=null;this.src='/Content/images/no-image.png'">
      <div class="cr-info">
        <div class="cr-name">${c.name}${c.isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> BO</span>' : ''}</div>
        <div class="cr-code">${c.code}</div>
        <div class="cr-price">${fmt(c.price * c.qty)}</div>
      </div>
      <div class="cr-qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${c.id},-1)"><i class="bi bi-dash"></i></button>
        <span class="cr-qval">${c.qty}</span>
        <button class="qty-btn" onclick="changeQty(${c.id},1)"><i class="bi bi-plus"></i></button>
      </div>
      <button class="cr-del" onclick="removeFromCart(${c.id})"><i class="bi bi-x-lg"></i></button>
    </div>`).join('');
}

/* ════════════════════════════════
   TOAST
════════════════════════════════ */
function toast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'toast-item' + (type === 'warn' ? ' warn' : '');
    el.innerHTML = msg;
    g('toastRack').appendChild(el);
    setTimeout(() => { el.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => el.remove(), 300); }, 2500);
}

/* ════════════════════════════════
   AUTOCOMPLETE / SEARCH SUGGESTION
════════════════════════════════ */

// Build suggestion pool from PRODUCTS data
function buildSuggestions(q) {
    if (!q || q.length < 1) return [];
    const qLow = q.toLowerCase().trim();
    const results = [];
    const seen = new Set();

    PRODUCTS.forEach(p => {
        const nameLow = p.name.toLowerCase();
        const codeLow = p.code.toLowerCase();
        const brandLow = (p.brand || '').toLowerCase();
        const catLow = (p.cat || '').toLowerCase();

        if (nameLow.includes(qLow) || codeLow.includes(qLow) || brandLow.includes(qLow) || catLow.includes(qLow)) {
            const key = p.id;
            if (!seen.has(key)) {
                seen.add(key);
                results.push({ type: 'product', id: p.id, name: p.name, code: p.code, brand: p.brand || '', cat: p.cat || '', price: p.price });
            }
        }
    });

    // Also add category/brand suggestions
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

let acSelected = null;  // currently selected suggestion text
let acFocusIdx = -1;
let acItems = [];

function acInput(inp) {
    const q = inp.value.trim();
    acSelected = null;
    acFocusIdx = -1;
    updateMobSearchBtn(false);

    if (!q) { acClose(); return; }

    acItems = buildSuggestions(q);
    renderAcDropdown(q);
}

function renderAcDropdown(q) {
    const dd = gEl('acDropdown');
    if (!acItems.length) {
        dd.innerHTML = `<div class="ac-empty"><i class="bi bi-search"></i>ไม่พบคำแนะนำสำหรับ "<strong>${q}</strong>"</div>`;
        dd.classList.add('open');
        return;
    }

    const products = acItems.filter(i => i.type === 'product');
    const cats = acItems.filter(i => i.type === 'category');

    let html = '';

    if (products.length) {
        products.forEach((item, idx) => {
            const hn = highlightMatch(item.name, q);
            const hc = highlightMatch(item.code, q);
            html += `
        <div class="ac-item" role="option" data-idx="${idx}" data-val="${item.name}" data-code="${item.code}"
          onmousedown="acSelect(event, '${item.name.replace(/'/g, "\\'")}','${item.code.replace(/'/g, "\\'")}')">
          <div class="ac-text">
            <div class="ac-name">${hn}</div>
            <div class="ac-meta">${hc}${item.brand ? ' · ' + item.brand : ''}${item.cat ? ' · ' + item.cat : ''}</div>
          </div>
        </div>`;
        });
    }

    if (cats.length) {
        html += `<div class="ac-header"><i class="bi bi-tag me-1"></i>หมวดหมู่</div>`;
        cats.forEach((item) => {
            const hn = highlightMatch(item.name, q);
            html += `
        <div class="ac-item" role="option" data-val="${item.name}"
          onmousedown="acSelect(event,'${item.name.replace(/'/g, "\\'")}','')">
          <div class="ac-text">
            <div class="ac-name">${hn}</div>
            <div class="ac-meta">ดูสินค้าในหมวด "${item.name}"</div>
          </div>
        </div>`;
        });
    }
    dd.innerHTML = html;
    dd.classList.add('open');
    gEl('headerQ').setAttribute('aria-expanded', 'true');
}

function acSelect(event, val, code) {
    if (event) event.preventDefault();
    gEl('headerQ').value = val;
    syncSearch('header');
    acSelected = val;
    acClose();
    updateMobSearchBtn(true);
    // On desktop: also run search immediately
    if (window.innerWidth > 575) {
        runSearch();
    }
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
        if (event.key === 'ArrowDown') { acInput(gEl('headerQ')); }
        return;
    }
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        acFocusIdx = Math.min(acFocusIdx + 1, items.length - 1);
        acUpdateFocus(items);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        acFocusIdx = Math.max(acFocusIdx - 1, -1);
        acUpdateFocus(items);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (acFocusIdx >= 0 && items[acFocusIdx]) {
            const val = items[acFocusIdx].getAttribute('data-val');
            const code = items[acFocusIdx].getAttribute('data-code') || '';
            acSelect(null, val, code);
        } else if (acSelected) {
            runSearch();
        } else if (window.innerWidth > 575) {
            // desktop: allow enter without suggestion
            acClose();
            runSearch();
        }
    } else if (event.key === 'Escape') {
        acClose();
    }
}

function acUpdateFocus(items) {
    const dd = gEl('acDropdown');
    const allItems = items || dd.querySelectorAll('.ac-item');
    allItems.forEach((el, i) => {
        el.classList.toggle('ac-focused', i === acFocusIdx);
    });
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

function doMobSearch() {
    if (acSelected) { runSearch(); }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const wrap = gEl('hSearchWrap');
    if (wrap && !wrap.contains(e.target)) acClose();
    const swrap = gEl('sidebarSearchWrap');
    if (swrap && !swrap.contains(e.target)) acCloseSidebar();
});

/* ── Sidebar AC (reuses same helpers, separate state) ── */
let acSbSelected = null;
let acSbFocusIdx = -1;
let acSbItems = [];

function acInputSidebar(inp) {
    const q = inp.value.trim();
    acSbSelected = null; acSbFocusIdx = -1;
    if (!q) { acCloseSidebar(); return; }
    acSbItems = buildSuggestions(q);
    renderAcDropdownSidebar(q);
}

function renderAcDropdownSidebar(q) {
    const dd = gEl('acDropdownSidebar');
    if (!acSbItems.length) {
        dd.innerHTML = `<div class="ac-empty"><i class="bi bi-search"></i>ไม่พบคำแนะนำสำหรับ "<strong>${q}</strong>"</div>`;
        dd.classList.add('open'); return;
    }
    const products = acSbItems.filter(i => i.type === 'product');
    const cats = acSbItems.filter(i => i.type === 'category');
    let html = '';
    if (products.length) {
        products.forEach(item => {
            const hn = highlightMatch(item.name, q);
            const hc = highlightMatch(item.code, q);
            html += `<div class="ac-item" role="option" data-val="${item.name}"
        onmousedown="acSelectSidebar(event,'${item.name.replace(/'/g, "\\'")}')">
        <div class="ac-text">
          <div class="ac-name">${hn}</div>
          <div class="ac-meta">${hc}${item.brand ? ' · ' + item.brand : ''}${item.cat ? ' · ' + item.cat : ''}</div>
        </div>
      </div>`;
        });
    }
    if (cats.length) {
        html += `<div class="ac-header"><i class="bi bi-tag me-1"></i>หมวดหมู่</div>`;
        cats.forEach(item => {
            const hn = highlightMatch(item.name, q);
            html += `<div class="ac-item" role="option" data-val="${item.name}"
        onmousedown="acSelectSidebar(event,'${item.name.replace(/'/g, "\\'")}')">
        <div class="ac-text">
          <div class="ac-name">${hn}</div>
          <div class="ac-meta">ดูสินค้าในหมวด "${item.name}"</div>
        </div>
      </div>`;
        });
    }
    dd.innerHTML = html;
    dd.classList.add('open');
    gEl('partQ').setAttribute('aria-expanded', 'true');
}

function acSelectSidebar(event, val) {
    if (event) event.preventDefault();
    gEl('partQ').value = val;
    syncSearch('sidebar');
    acSbSelected = val;
    acCloseSidebar();
    runSearch();
}

function acCloseSidebar() {
    gEl('acDropdownSidebar').classList.remove('open');
    gEl('partQ').setAttribute('aria-expanded', 'false');
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
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        acSbFocusIdx = Math.min(acSbFocusIdx + 1, items.length - 1);
        acUpdateFocusSidebar(items);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        acSbFocusIdx = Math.max(acSbFocusIdx - 1, -1);
        acUpdateFocusSidebar(items);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (acSbFocusIdx >= 0 && items[acSbFocusIdx]) {
            acSelectSidebar(null, items[acSbFocusIdx].getAttribute('data-val'));
        } else {
            acCloseSidebar(); runSearch();
        }
    } else if (event.key === 'Escape') {
        acCloseSidebar();
    }
}

function acUpdateFocusSidebar(items) {
    const dd = gEl('acDropdownSidebar');
    const all = items || dd.querySelectorAll('.ac-item');
    all.forEach((el, i) => el.classList.toggle('ac-focused', i === acSbFocusIdx));
    if (acSbFocusIdx >= 0 && all[acSbFocusIdx]) {
        gEl('partQ').value = all[acSbFocusIdx].getAttribute('data-val');
        all[acSbFocusIdx].scrollIntoView({ block: 'nearest' });
    }
}

/* ════════════════════════════════
   MOBILE SIDEBAR (hamburger)
════════════════════════════════ */
function toggleMobSidebar() {
    const sb = gEl('sidebar');
    const ov = gEl('mobOverlay');
    const ham = gEl('mobHamburger');
    const isOpen = sb.classList.toggle('mob-open');
    ov.classList.toggle('show', isOpen);
    ham.classList.toggle('open', isOpen);
    ham.setAttribute('aria-expanded', isOpen);
}

gEl('mobOverlay').addEventListener('click', toggleMobSidebar);

/* ════════════════════════════════
   COLLAPSE SYNC
════════════════════════════════ */
document.querySelectorAll('.sec-hd').forEach(hd => {
    const t = hd.getAttribute('data-bs-target');
    const el = document.querySelector(t);
    if (el) {
        el.addEventListener('show.bs.collapse', () => hd.setAttribute('aria-expanded', 'true'));
        el.addEventListener('hide.bs.collapse', () => hd.setAttribute('aria-expanded', 'false'));
    }
});

/* ════════════════════════════════
   ENTER KEY support on both inputs
════════════════════════════════ */
gEl('partQ').addEventListener('focus', e => { if (gEl('partQ').value.trim()) acInputSidebar(gEl('partQ')); });
gEl('headerQ').addEventListener('focus', e => { if (gEl('headerQ').value.trim()) acInput(gEl('headerQ')); });

/* ════════════════════════════════
   ORDER SUMMARY MODAL
════════════════════════════════ */
const DISCOUNT_RATE = 0.075; // 7.5% cash discount
const VAT_RATE = 0.07;

function openOrderSummary() {
    if (!cart.length) { toast('🛒 ยังไม่มีสินค้าในตะกร้า', 'warn'); return; }
    renderOrderSummary();
    closeCart();
    gEl('osOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeOrderSummary() {
    gEl('osOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function osOverlayClick(e) {
    if (e.target === gEl('osOverlay')) closeOrderSummary();
}

function renderOrderSummary() {
    const list = gEl('osProductList');

    // Product rows with checkboxes
    list.innerHTML = cart.map(c => `
    <div class="os-item" id="osItem-${c.id}">
      <label class="os-chk-wrap" onclick="event.stopPropagation()" title="เลือกรายการนี้">
        <input type="checkbox" class="os-item-chk" data-id="${c.id}" checked onchange="updateOsSelection()">
        <span class="os-chk-box"></span>
      </label>
      <img class="os-thumb" src="${c.img}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="os-thumb-ph" style="display:none">🔧</div>
      <div class="os-info">
        <div class="os-name" title="${c.name}">${c.name}${c.isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> BO</span>' : ''}</div>
        <div class="os-sku">${c.code}</div>
        <div class="os-price">${fmt(c.price)}</div>
      </div>
      <div class="os-stepper">
        <button class="os-step-btn" onclick="osChangeQty(${c.id},-1)">−</button>
        <input class="os-step-input" type="number" value="${c.qty}" min="1"
          onchange="osSetQty(${c.id},this.value)" oninput="osSetQty(${c.id},this.value)">
        <button class="os-step-btn" onclick="osChangeQty(${c.id},1)">+</button>
      </div>
      <button class="os-del-btn" onclick="osRemoveItem(${c.id})" title="ลบ">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>`).join('');

    updateOsSelection();
}

function updateOsSelection() {
    const chks = document.querySelectorAll('.os-item-chk');
    const allChecked = [...chks].every(c => c.checked);
    const selectAllChk = gEl('osSelectAll');
    if (selectAllChk) selectAllChk.checked = allChecked;

    const selectedIds = [...chks].filter(c => c.checked).map(c => parseInt(c.dataset.id));
    const selectedItems = cart.filter(c => selectedIds.includes(c.id));

    const totalQty = selectedItems.reduce((s, c) => s + c.qty, 0);
    const skuCount = selectedItems.length;
    const subtotal = selectedItems.reduce((s, c) => s + c.price * c.qty, 0);
    const discount = subtotal * DISCOUNT_RATE;
    const net = subtotal - discount;
    const vat = net * VAT_RATE;
    const total = net + vat;

    gEl('osItemBadge').textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''}`;
    gEl('osQtyCount').textContent = totalQty;
    gEl('osSkuCount').textContent = skuCount;
    gEl('osDiscount').textContent = '−' + discount.toFixed(2);
    gEl('osNet').textContent = net.toFixed(2);
    gEl('osVat').textContent = vat.toFixed(2);
    gEl('osTotal').textContent = fmt(total);
}

function osToggleSelectAll(chk) {
    document.querySelectorAll('.os-item-chk').forEach(c => c.checked = chk.checked);
    updateOsSelection();
}

function osChangeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    updateCart();
    const input = document.querySelector(`#osItem-${id} .os-step-input`);
    if (input) input.value = item.qty;
    updateOsSelection();
}

function osSetQty(id, val) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1) { item.qty = n; updateCart(); updateOsSelection(); }
}

function osRemoveItem(id) {
    const row = gEl('osItem-' + id);
    if (row) {
        row.style.transition = 'opacity .18s, transform .18s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(10px)';
        setTimeout(() => {
            cart = cart.filter(c => c.id !== id);
            updateCart();
            if (!cart.length) { closeOrderSummary(); toast('🗑️ ตะกร้าว่างแล้ว', 'warn'); return; }
            renderOrderSummary();
        }, 200);
    }
}

function osSelectAddr(el) {
    gEl('osAddrList').querySelectorAll('.os-addr-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    const name = el.querySelector('.os-addr-name').textContent;
    const lines = [];
    el.childNodes.forEach(n => { if (n.nodeType === 3 || (n.nodeType === 1 && !n.classList.contains('os-addr-name') && !n.classList.contains('os-addr-phone'))) { const t = (n.textContent || '').trim(); if (t) lines.push(t); } });
    gEl('osAddrDisplay').innerHTML = `<strong>${name}</strong><br>${lines.join('<br>')}`;
    // Update short address
    const addrLine = el.querySelector('div:not(.os-addr-name):not(.os-addr-phone)');
    const shortAddr = addrLine ? addrLine.textContent.trim() : lines[0] || '';
    const shortEl = gEl('osCurrentAddrShort');
    if (shortEl) shortEl.textContent = shortAddr;
    // Close picker after selecting
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
    if (isOpen) {
        osCloseAddrPicker();
    } else {
        picker.style.display = 'flex';
        picker.style.animation = 'osItemIn .2s ease both';
        gEl('osChangAddrBtn').innerHTML = '<i class="bi bi-x-circle"></i> ปิด';
        gEl('osChangAddrBtn').style.borderColor = '#fca5a5';
        gEl('osChangAddrBtn').style.color = '#9b0008';
        gEl('osChangAddrBtn').style.background = 'var(--red-light)';
        // Clear search input
        const inp = picker.querySelector('.os-addr-search');
        if (inp) { inp.value = ''; osFilterAddr(''); }
    }
}

function osUseInvoiceAddr() {
    // Select first address (invoice address) and close
    const firstItem = gEl('osAddrList')?.querySelector('.os-addr-item');
    if (firstItem) osSelectAddr(firstItem);
    osCloseAddrPicker();
    toast('✅ ใช้ที่อยู่ในใบกำกับภาษี');
}

function osCloseAddrPicker() {
    const picker = gEl('osAddrPicker');
    picker.style.display = 'none';
    const btn = gEl('osChangAddrBtn');
    btn.innerHTML = '<i class="bi bi-house-door"></i> เปลี่ยนที่อยู่ในการจัดส่ง';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.background = '';
}

/* ════════════════════════════════
   SEE MORE / SEE LESS (pl & br)
════════════════════════════════ */
function toggleSeeMore(type) {
    const btn = gEl(type + 'SeeMore');
    const extras = document.querySelectorAll('.' + type + '-extra');
    const isOpen = btn.classList.toggle('expanded');
    extras.forEach(el => { el.style.display = isOpen ? '' : 'none'; });
    btn.innerHTML = isOpen
        ? '<i class="bi bi-chevron-up" id="' + type + 'SeeMoreIcon"></i> ดูน้อยลง'
        : '<i class="bi bi-chevron-down" id="' + type + 'SeeMoreIcon"></i> ดูเพิ่มเติม';
}

function osCheckout() {
    const btn = gEl('osCheckoutBtn');
    btn.classList.add('success');
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> กำลังดำเนินการ...';
    setTimeout(() => {
        btn.classList.remove('success');
        btn.innerHTML = '<i class="bi bi-credit-card-2-front me-2"></i> CHECKOUT';
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
    trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); }
    });

    document.addEventListener('click', () => {
        if (open) {
            open = false;
            trigger.classList.remove('open');
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', false);
        }
    });
}

setupDropdown('trigger1', 'dropdown1');

/* ════════════════════════════════
   API HELPER
════════════════════════════════ */
async function ajaxCallApiService(url, params) {
    const response = await fetch(
        `${url}?${new URLSearchParams(params)}`,
        {
            method: 'GET'
        });

    if (!response.ok) {
        const text = await response.text();
        console.error('API Error:', response.status, text);
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}