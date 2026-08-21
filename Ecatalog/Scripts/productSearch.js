/* productSearch.js
   jQuery layer: search API call, flat grid render, jQuery drawer
   ทำงานร่วมกับ truscripts.js (vanilla) และ productTabLoader.js (tab API) */

let currentProducts = [];
let currentGroups = [];
let currentSpecProduct = null;
// const API_URLS = {
//     getProductBySearchVio: '/Product/GetProductBySearchVio',
//     getProductBySearchCatagory: '/Product/GetProductBySearchCatagory'
// }

/* SEARCH — เรียก API GetProductBySearchVio ถูก call จาก _Sidebar.cshtml (btnSearchProductVio) และจาก truscripts.js (loadSearchProductVio) */
async function loadSearchProductVio() {
    const btn = $("#btnSearchProductVio");

    const marketSegmentId = $("#marketsegId").val();
    const segmentId = $("#segmentId").val();
    const makerId = $("#makerId").val();
    const rangeId = $("#rangeId").val();
    const bodyId = $("#bodyId").val();
    const engineId = $("#engineId").val();
    const yearFrom = $("#yearFrom").val();
    const yearTo = $("#yearTo").val();
    const driveId = $("#driveId").val();
    const slmCode = $("#salesmanId").val() || "";
    const cusCode = $("#customerId").val() || "";
    const companies = typeof getActiveCompanies === 'function' ? getActiveCompanies() : [];

    const hasMaker = !!makerId;
    const hasMarketAndSegment = !!(marketSegmentId && segmentId);

    if (!hasMaker && !hasMarketAndSegment) {
        Swal.fire({
            icon: 'warning',
            title: 'กรุณาเลือก Maker หรือเลือก Market Segment + Vehicle Segment ก่อนทำการค้นหา'
        });
        return;
    }

    btn.prop("disabled", true);
    showSkel();

    try {
        // ✅ build URLSearchParams เองเพื่อรองรับ array
        const params = new URLSearchParams();
        params.append('marketSegmentId', marketSegmentId || '');
        params.append('segmentId', segmentId || '');
        params.append('makerId', makerId || '');
        params.append('rangeId', rangeId || '');
        params.append('bodyId', bodyId || '');
        params.append('engineId', engineId || '');
        params.append('yearFrom', yearFrom || '');
        params.append('yearTo', yearTo || '');
        params.append('driveType', driveId || '');
        params.append('SlmCode', slmCode);
        params.append('CusCode', cusCode);
        companies.forEach(c => params.append('Company', c));

        const response = await fetch(`${API_URLS.getProductBySearchVio}?${params}`, { method: 'GET' });
        const result = await response.json();

        if (result.IsSuccess) {
            $("#cacheStatus").html(
                (result.IsFromCache ? "VIO Cache Hit" : "API Call") +
                " (" + result.ExecutionTime + " ms)"
            );

            const previousGroup = activeGroup;
            document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
            _setBaseProducts(result.Data, 'vehicle', false, true);

            const groupStillExists = previousGroup !== '0' &&
                GROUPS.some(g => String(g.id) === String(previousGroup));

            if (groupStillExists) {
                activeGroup = previousGroup;
                window.selectedGroupId = previousGroup;
                document.querySelector(`.bb-item[data-id="${previousGroup}"]`)?.classList.add('active');
            } else {
                activeGroup = '0';
                window.selectedGroupId = '0';
                document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');
            }

            _applyFiltersAndRender();

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
/*SearchGlobal*/
async function searchProductGlobal(keyword) {
    if (!keyword || keyword.trim().length < 2) return;

    showSkel();

    try {
        const result = await ajaxCallApiService(
            API_URLS.getProductBySearchGlobal,
            { Keyword: keyword.trim() }
        );

        if (result.IsSuccess && result.Data?.length > 0) {
            activeGroup = '0';
            window.selectedGroupId = '0';
            document.querySelectorAll('.bb-item').forEach(b => b.classList.remove('active'));
            document.querySelector('.bb-item[data-id="0"]')?.classList.add('active');

            currentSort = 'part';
            const sel = gEl('sortSelect');
            if (sel) sel.value = 'part';

            const kw = keyword.toLowerCase().trim();
            const tokens = kw.split(/[\s\/]+/).filter(t => t.length > 0);

            const filteredData = result.Data.map(group => ({
                ...group,
                productList: (group.productList || []).filter(p => {
                    const searchText = [
                        p.stkcode, p.stkcodeDescription, p.brand,
                        p.makerName, p.modelName, p.productGroup, p.productLine, p.fittingDescription
                    ].join(' ').toLowerCase();
                    return tokens.every(token => searchText.includes(token));
                })
            })).filter(group => group.productList.length > 0);

            const dataToUse = filteredData.length > 0 ? filteredData : result.Data;
            _setBaseProducts(dataToUse, 'part', true);

        } else {
            toast(result.Message || "ไม่พบสินค้าที่ค้นหา", "warn");
        }

    } catch (ex) {
        console.error('searchProductGlobal error:', ex);
        toast("เกิดข้อผิดพลาดในการค้นหา", "warn");
    } finally {
        hideSkel();
    }
}
/*SearchGlobal*/

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

/* จาก Desktop Modal — ใช้ currentSpecProduct (normalized) */
async function addCartFromModal(e) {
    // e อาจเป็น MouseEvent หรือ undefined
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }

    const p = currentSpecProduct;
    if (!p) return;

    const qty = parseInt($("#mQty").val()) || 1;
    const btn = (e?.currentTarget instanceof HTMLElement)
        ? e.currentTarget
        : document.querySelector('#specModalContent .dr-add-btn');

    await _callAddToCartAPI(p, qty, btn);
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

/* ═══════════════════════════════════════════════════════
   CART — SHARED API HELPER  (Single Source of Truth)
   ทุก path ที่ Add to Cart ผ่านมาที่นี่ทั้งหมด
═══════════════════════════════════════════════════════ */
async function _callAddToCartAPI(p, qty, btnEl) {
    const cuscode = window.APP_SESSION?.cuscode || '';
    const company = window.APP_SESSION?.company || 'TAC';
    const isBO = p.isBO ?? ((parseInt(p.stock ?? p.qtyReady ?? 99)) === 0);
    const stkcode = p.code || p.stkcode || '';
    const price = parseFloat(p.price) || 0;

    /* ── loading state ── */
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> กำลังเพิ่ม…';
    }

    try {
        const res = await fetch(urlsPro.addProductToCartUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                Cuscode: cuscode,
                Stkcode: stkcode,
                Company: company,
                Price: price.toString(),
                Qty: qty.toString(),
                BackOrder: isBO ? '1' : '0'
            })
        });

        // ✅ เช็ค HTTP status ก่อน parse JSON
        if (!res.ok) {
            toast('❌ ไม่สามารถเชื่อมต่อ API ได้', 'warn');
            _resetAddBtn(btnEl, isBO, false);
            return false;
        }

        const json = await res.json().catch(() => null);

        // ✅ เช็ค json null ก่อน
        if (!json) {
            toast('❌ Response ไม่ถูกต้อง', 'warn');
            _resetAddBtn(btnEl, isBO, false);
            return false;
        }

        if (!json.IsSuccess) {
            toast(`❌ ${json.Message || 'ไม่สามารถเพิ่มสินค้าได้'}`, 'warn');
            _resetAddBtn(btnEl, isBO, false);
            return false;
        }

        /* ── Single Source of Truth: fetch cart จาก server ── */
        await _fetchCartFromServer();   // อยู่ใน truscripts.js

        toast(`🛒 เพิ่ม "${(p.name || p.stkcodeDescription || stkcode).substring(0, 30)}…"`);
        _resetAddBtn(btnEl, isBO, true);
        return true;

    } catch (err) {
        console.error('AddToCart API error:', err);
        toast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่', 'warn');
        _resetAddBtn(btnEl, isBO, false);
        return false;
    }
}

/* ── reset button state หลัง API call ── */
function _resetAddBtn(btnEl, isBO, success) {
    if (!btnEl) return;
    btnEl.disabled = false;

    if (success) {
        btnEl.classList.add('added');
        btnEl.innerHTML = '<i class="bi bi-check-lg"></i> Added';
        setTimeout(() => {
            btnEl.classList.remove('added');
            btnEl.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> 
                               ${isBO ? 'จอง (BO)' : 'Add to Cart'}`;
        }, 1500);
    } else {
        btnEl.innerHTML = `<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> 
                           ${isBO ? 'จอง (BO)' : 'Add to Cart'}`;
    }
}