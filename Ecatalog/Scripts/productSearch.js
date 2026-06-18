/* productSearch.js
   jQuery layer: search API call, flat grid render, jQuery drawer
   ทำงานร่วมกับ truscripts.js (vanilla) และ productTabLoader.js (tab API) */

let currentProducts = [];
let currentGroups = [];
let currentSpecProduct = null;
const API_URLS = {
    getProductBySearchVio: '/Product/GetProductBySearchVio',
    getProductBySearchCatagory: '/Product/GetProductBySearchCatagory'
}

/* SEARCH — เรียก API GetProductBySearchVio ถูก call จาก _Sidebar.cshtml (btnSearchProductVio) และจาก truscripts.js (loadSearchProductVio) */
async function loadSearchProductVio() {
    const btn = $("#btnSearchProductVio");
    btn.prop("disabled", true);
    showSkel();

    try {
        const marketSegmentId = $("#marketsegId").val() || "";
        const segmentId = $("#segmentId").val() || "";
        const makerId = $("#makerId").val() || "";
        const rangeId = $("#rangeId").val() || "";
        const bodyId = $("#bodyId").val() || "";
        const engineId = $("#engineId").val() || "";
        const yearFrom = $("#yearFrom").val() || "";
        const yearTo = $("#yearTo").val() || "";
        const driveType = $("#driveId").val() || "";
        const imagePath = $("#imagePath").val() || "";

        const result = await ajaxCallApiService(
            API_URLS.getProductBySearchVio,
            {
                marketSegmentId, segmentId, makerId, rangeId,
                bodyId, engineId, yearFrom, yearTo, driveType, imagePath
            }
        );

        if (result.IsSuccess) {
            $("#cacheStatus").html(
                (result.IsFromCache ? "VIO Cache Hit" : "API Call") +
                " (" + result.ExecutionTime + " ms)"
            );

            currentGroups = result.Data || [];
            currentProducts = [];
            currentGroups.forEach(group => {
                (group.productList || []).forEach(item => {
                    currentProducts.push({ ...item, productGroupNameMain: group.productGroupNameMain });
                });
            });

            // Sync เข้า PRODUCTS (vanilla JS)
            PRODUCTS = mapApiResponseToProducts(result.Data || []);
            console.log('PRODUCTS after map:', PRODUCTS.length);
            console.log('Sample product:', PRODUCTS[0]);
            console.log('chkState:', chkState);
            console.log('activeGroup:', activeGroup);
            // ✅ reset group filter
            activeGroup = '0';
            window.selectedGroupId = '0';
            document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
            document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

            renderProducts(PRODUCTS);
            $("#rcount").text(PRODUCTS.length + " items");

        } else {
            toast(result.Message || "Search Error", "warn");
        }
    } catch (ex) {
        console.error(ex);
        toast("System Error", "warn");
    } finally {
        hideSkel();
        btn.prop("disabled", false);
    }
}

async function searchProductByCategory() {
    const btn = $("#btnSearchProductCatagory");
    btn.prop("disabled", true);
    showSkel();

    try {
        const filters = getSearchCatagoryObject();

        const response = await fetch(
            API_URLS.getProductBySearchCatagory,   // ← ใช้ API_URLS แทน @Url.Action
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.Message || result.errorMessage || "API Error");
        }

        if (result.IsSuccess) {
            $("#cacheStatusCatagory").html(
                (result.IsFromCache ? "Category Cache Hit" : "API Call") +
                " (" + result.ExecutionTime + " ms)"
            );

            // ✅ sync เข้า PRODUCTS (vanilla JS) — เหมือน loadSearchProductVio
            PRODUCTS = mapApiResponseToProducts(result.Data || []);

            applyAllFilters();
            $("#rcount").text(PRODUCTS.length + " items");

        } else {
            toast(result.Message || "Search Error", "warn");
        }

    } catch (ex) {
        console.error("searchProductByCategory Error:", ex);
        toast(ex.message || "System Error", "warn");
    } finally {
        hideSkel();
        btn.prop("disabled", false);
    }
}

/* OPEN SPEC — desktop modal หรือ mobile drawer เรียกจาก card ใน renderProductGrid (jQuery grid) */
function showProductSpec(idx) {
    // รองรับทั้ง currentProducts (raw) และ PRODUCTS (mapped)
    const raw = currentProducts[idx];
    if (!raw) return;
    currentSpecProduct = _normalizeProduct(raw);

    if (window.innerWidth >= 992) {
        openSpecModal(currentSpecProduct);
    } else {
        openSpecDrawer(currentSpecProduct);
    }
}

/* ??? Desktop modal ??? */
function openSpecModal(p) {
    // p คือ normalized object แล้ว
    window._currentStkcode = p.code;

    $("#specModalContent").html(buildSpecBodyHtml(p));
    $("#specModalBackdrop").addClass("open");
    document.body.style.overflow = "hidden";

    if (typeof initProductTabs === "function") {
        initProductTabs(p.code, "modal", "modal");
    }
}

function closeSpecModal(e) {
    if (e && e.target && e.target.id !== "specModalBackdrop") return;
    $("#specModalBackdrop").removeClass("open");
    document.body.style.overflow = "";
}

/* สร้าง HTML โครงสร้าง modal พร้อม pane ว่างๆ รอ Tab loader */
function buildSpecBodyHtml(p) {
    // p เป็น normalized แล้ว — ใช้ field เดียวกันหมด
    const isBO = p.isBO;

    return `
        <div class="dr-hero">
            <img src="${p.img}" alt="${p.name}"
                 style="width:100%;height:140px;object-fit:contain"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:140px;align-items:center;
                        justify-content:center;background:var(--surface-2);
                        color:var(--text-3);font-size:32px">
                <i class="bi bi-image"></i>
            </div>
            <div class="dr-meta">
                <div class="dm-brand">${p.brand}</div>
                <h3>${p.name}</h3>
                <div class="dm-code">${p.code}</div>
                <div class="dr-price">฿${p.price.toFixed(2)}</div>
                <div class="dr-add-row">
                    <input type="number" class="dr-qty" id="mQty" value="1" min="1" max="99">
                    <button class="dr-add-btn${isBO ? ' bo-btn' : ''}" 
                            onclick="addCartFromModal(event)">
                        <i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i>
                        ${isBO ? 'จอง (BO)' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>

        <div class="dr-tabs" style="margin-top:12px">
            <button class="drtab active" onclick="switchModalTab(this,'desc')">
                <i class="bi bi-file-text"></i> Description
            </button>
            <button class="drtab" onclick="switchModalTab(this,'spec')">
                <i class="bi bi-rulers"></i> Spec 
            </button>
            <button class="drtab" onclick="switchModalTab(this,'imgs')">
                <i class="bi bi-images"></i> Image 
            </button>
            <button class="drtab" onclick="switchModalTab(this,'oem')">
                <i class="bi bi-upc"></i> OEM 
            </button>
            <button class="drtab" onclick="switchModalTab(this,'comp')">
                <i class="bi bi-diagram-2"></i> Competitor 
            </button>
            <button class="drtab" onclick="switchModalTab(this,'veh')">
                <i class="bi bi-car-front"></i> Vehicle 
            </button>
        </div>

        <div class="dr-content" id="modalTabContent">
            <div class="drpane active" id="mdp-desc"></div>
            <div class="drpane"        id="mdp-spec"></div>
            <div class="drpane"        id="mdp-imgs"></div>
            <div class="drpane"        id="mdp-oem"></div>
            <div class="drpane"        id="mdp-comp"></div>
            <div class="drpane"        id="mdp-veh"></div>
        </div>`;
}
/* Tab switching ใน modal */
function switchModalTab(btn, tabId) {
    $("#specModalContent .drtab").removeClass("active");
    $("#specModalContent .drpane").removeClass("active");
    $(btn).addClass("active");
    $("#mdp-" + tabId).addClass("active");

    const stkcode = window._currentStkcode;
    if (stkcode && typeof loadModalTab === "function") {
        loadModalTab(tabId, stkcode);
    }
}

//function addCartFromModal(e) {
//    e.stopPropagation();
//    const qty = parseInt($("#mQty").val()) || 1;
//    if (!currentSpecProduct) return;
//    const p = currentSpecProduct;
//    const pid = p.stkcode || p.code || p.id;
//    const ex = cart.find(c => c.code === pid || c.id === pid);
//    const cartItem = {
//        id: pid,
//        code: p.stkcode || p.code || '—',
//        name: p.stkcodeDescription || p.name || '—',
//        price: parseFloat(p.price) || 0,
//        stock: parseInt(p.qtyReady) || 0,
//        img: p.imagePath || p.img || '',
//        brand: p.brand || '—',
//        isBO: (parseInt(p.qtyReady) || 0) === 0
//    };
//    if (ex) ex.qty += qty; else cart.push({ ...cartItem, qty });
//    updateCart();
//    toast(`?? เพิ่ม "${cartItem.name.substring(0, 30)}…"`);
//}

function addCartFromModal(e) {
    e.stopPropagation();
    const p = currentSpecProduct;
    if (!p) return;
    const qty = parseInt($("#mQty").val()) || 1;
    const ex = cart.find(c => c.code === p.code);
    if (ex) { ex.qty += qty; }
    else { cart.push({ ...p, qty }); }
    updateCart();
    toast(`🛒 เพิ่ม "${p.name.substring(0, 30)}…"`);
}

/* ??? Mobile drawer ??? */
function openSpecDrawer(p) {
    // p คือ normalized object แล้ว
    window._currentStkcode = p.code;
    currentSpecProduct = p;

    const isBO = p.isBO;

    $("#drTitle, #drName").text(p.name);
    $("#drCode, #drCode2, #drPN").text(p.code);
    $("#drBrand, #drBrandCard").text(p.brand);
    $("#drPrice").text("฿" + p.price.toFixed(2));
    $("#drDescFull").text(p.name);
    $("#drCat").text(p.cat);
    $("#drQty").val(1);
    $("#drBoRow").toggle(isBO);

    // รูปภาพ
    if (p.img) {
        $("#drImg").attr("src", p.img).attr("alt", p.name).show();
        $("#drImgPh").hide();
        $("#drImg").on("error", function () {
            $(this).hide();
            $("#drImgPh").show();
        });
    } else {
        $("#drImg").hide();
        $("#drImgPh").show();
    }

    // ปุ่ม Add to Cart
    const addBtn = $("#drAddBtn");
    addBtn.toggleClass("bo-btn", isBO);
    addBtn.html(`<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> 
                 ${isBO ? 'จอง (BO)' : 'Add to Cart'}`);

    // Reset tab แรก
    $(".drtab").removeClass("active").first().addClass("active");
    $(".drpane").removeClass("active");
    $("#dp-desc").addClass("active");

    $("#drawerOverlay, #specDrawer").addClass("open");
    document.body.style.overflow = "hidden";

    if (typeof initProductTabs === "function") {
        initProductTabs(p.code, "drawer", null);
    }
}
function closeDrawerJQ() {
    $("#drawerOverlay, #specDrawer").removeClass("open");
    document.body.style.overflow = "";
}

//function addCartFromDrawer(e) {
//    if (e) e.stopPropagation();
//    const qty = parseInt($("#drQty").val()) || 1;
//    const p = currentSpecProduct;
//    if (!p) return;
//    const pid = p.stkcode || p.code || p.id;
//    const cartItem = {
//        id: pid,
//        code: p.stkcode || '—',
//        name: p.stkcodeDescription || p.name || '—',
//        price: parseFloat(p.price) || 0,
//        img: p.imagePath || '',
//        brand: p.brand || '—',
//        isBO: (parseInt(p.qtyReady) || 0) === 0
//    };
//    const ex = cart.find(c => c.id === pid);
//    if (ex) ex.qty += qty; else cart.push({ ...cartItem, qty });
//    updateCart();
//    toast(`?? เพิ่ม "${cartItem.name.substring(0, 30)}…"`);
//}

function addCartFromDrawer(e) {
    if (e) e.stopPropagation();
    const p = currentSpecProduct;
    if (!p) return;
    const qty = parseInt($("#drQty").val()) || 1;
    const ex = cart.find(c => c.code === p.code);
    if (ex) { ex.qty += qty; }
    else { cart.push({ ...p, qty }); }
    updateCart();
    toast(`🛒 เพิ่ม "${p.name.substring(0, 30)}…"`);
}

/* RENDER FLAT PRODUCT GRID (jQuery) ใช้สำหรับกรณีที่ต้องการ flat list แทน Netflix rows */
function renderProductGrid(products) {
    const grid = $("#pGrid");
    grid.empty();

    if (!products || products.length === 0) {
        grid.html(`
            <div class="empty-result" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)">
                <i class="bi bi-inbox" style="font-size:2rem"></i>
                <p>ไม่พบสินค้าตามเงื่อนไขที่เลือก</p>
            </div>`);
        return;
    }

    products.forEach((p, idx) => {
        const qty = parseInt(p.qtyReady) || 0;
        const isBO = qty === 0;
        const price = parseFloat(p.price) || 0;

        grid.append(`
            <div class="product-card" onclick="showProductSpec(${idx})" style="cursor:pointer">
                <img src="${p.imagePath || ''}" alt="${p.stkcodeDescription || ''}"
                     style="width:100%;height:140px;object-fit:contain"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div style="display:none;width:100%;height:140px;align-items:center;justify-content:center;
                            background:var(--surface-2);color:var(--text-3);font-size:32px">
                    <i class="bi bi-image"></i>
                </div>
                <div class="pc-brand">${p.brand || '—'}</div>
                <h6 class="pc-name">${p.stkcodeDescription || '—'}</h6>
                <div class="pc-code">${p.stkcode || '—'}</div>
                <div class="pc-line" style="font-size:11px;color:var(--text-3)">${p.productLine || ''}</div>
                <div class="pc-price">฿${price.toFixed(2)}</div>
                ${isBO
                ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> จอง (BO)</span>'
                : `<span class="stock-tag" style="font-size:11px;color:var(--text-3)">คงเหลือ ${qty}</span>`}
                <button class="pc-detail-btn">
                    <i class="bi bi-eye"></i> See detail
                </button>
            </div>`);
    });
}

/* VEHICLE SUMMARY (jQuery version ถ้า sidebar ใช้ jQuery) */
function updateVehSummary() {
    const s = document.getElementById('vehSummary');
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
function _normalizeProduct(p) {
    // รองรับทั้ง raw API object และ mapped PRODUCTS object
    return {
        id: p.id || p.stkcode || p.code || '',
        code: p.stkcode || p.code || '—',
        name: p.stkcodeDescription || p.name || '—',
        price: parseFloat(p.price) || 0,
        stock: parseInt(p.qtyReady ?? p.stock ?? 99),
        img: p.imagePath || p.img || '',
        brand: p.brand || '—',
        cat: p.productGroup || p.productGroupNameMain || p.cat || '—',
        line: p.productLine || p.line || '—',
        isBO: (parseInt(p.qtyReady ?? p.stock ?? 99)) === 0
    };
}