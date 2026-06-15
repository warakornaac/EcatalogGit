let currentProducts = [];   // flat array ของสินค้าทั้งหมด (สำหรับ modal/cart lookup)
let currentGroups = [];     // เก็บ groups ไว้สำหรับ filter/re-render

async function loadSearchProductVio() {
    const btn = $("#btnSearchProductVio");
    btn.prop("disabled", true);
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

        const result = await ajaxCallApiService(
            API_URLS.getProductBySearchVio,
            { marketSegmentId, segmentId, makerId, rangeId, bodyId, engineId, yearFrom, yearTo, driveType });

        if (result.IsSuccess) {
            $("#cacheStatus").html(
                (result.IsFromCache ? "Cache Hit" : "API Call") + " (" + result.ExecutionTime + " ms)"
            );

            currentGroups = result.Data || [];
            currentProducts = [];
            currentGroups.forEach(group => {
                (group.productList || []).forEach(item => {
                    currentProducts.push({
                        ...item,
                        productGroupNameMain: group.productGroupNameMain
                    });
                });
            });

            // Sync เข้า PRODUCTS ที่ vanilla JS (Site.js) ใช้ render
            PRODUCTS = mapApiResponseToProducts(result.Data || []);

            renderProductGrid(currentProducts); // jQuery flat grid (ถ้ายังใช้อยู่)
            applyAllFilters();                  // vanilla JS Netflix rows
            $("#rcount").text(currentProducts.length + " items");
        } else {
            alert(result.Message || "Search Error");
        }
    } catch (ex) {
        console.error(ex);
        alert("System Error");
    } finally {
        btn.prop("disabled", false);
    }
}

// ===== Render product cards (flat list) =====
function renderProductGrid(products) {
    const grid = $("#pGrid");
    grid.empty();

    if (!products || products.length === 0) {
        grid.html(`
            <div class="empty-result" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)">
                <i class="bi bi-inbox" style="font-size:2rem"></i>
                <p>ไม่พบสินค้าตามเงื่อนไขที่เลือก</p>
            </div>
        `);
        return;
    }

    products.forEach((p, idx) => {
        const qty = parseInt(p.qtyReady) || 0;
        const isBO = qty === 0;
        const price = parseFloat(p.price) || 0;

        grid.append(`
            <div class="product-card">
                ${p.imageUrl
                ? `<img src="${p.imageUrl}" alt="${p.stkcodeDescription || ''}" style="width:100%;height:140px;object-fit:cover">`
                : `<div style="width:100%;height:140px;display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--text-3);font-size:32px"><i class="bi bi-image"></i></div>`
                }
                <div class="pc-brand">${p.brand || '—'}</div>
                <h6 class="pc-name">${p.stkcodeDescription || '—'}</h6>
                <div class="pc-code">${p.stkcode || '—'}</div>
                <div class="pc-line" style="font-size:11px;color:var(--text-3)">${p.productLine || ''}</div>
                <div class="pc-price">฿${price.toFixed(2)}</div>
                ${isBO ? '<span class="bo-tag"><i class="bi bi-hourglass-split"></i> จอง (BO)</span>' : `<span class="stock-tag" style="font-size:11px;color:var(--text-3)">คงเหลือ ${qty}</span>`}
                <button class="pc-detail-btn" onclick="showProductSpec(${idx})">
                    <i class="bi bi-eye"></i> See detail
                </button>
            </div>
        `);
    });
}

// ===== Open spec (desktop modal or mobile drawer) =====
function showProductSpec(idx) {
    currentSpecProduct = currentProducts[idx];
    if (window.innerWidth >= 992) {
        openSpecModal(currentSpecProduct);
    } else {
        openSpecDrawer(currentSpecProduct);
    }
}

// ----- Desktop modal -----
function openSpecModal(p) {
    $("#specModalContent").html(buildSpecBodyHtml(p));
    $("#specModalBackdrop").addClass("open");
}

function closeSpecModal(e) {
    if (e && e.target.id !== "specModalBackdrop") return;
    $("#specModalBackdrop").removeClass("open");
    document.body.style.overflow = '';
}

// Shared body markup (reuses the drawer's tab structure for the modal)
function buildSpecBodyHtml(p) {
    const qty = parseInt(p.qtyReady) || 0;
    const isBO = qty === 0;
    const price = parseFloat(p.price) || 0;

    return `
        <div class="dr-hero">
            ${p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.stkcodeDescription || ''}" style="width:100%;height:100%;object-fit:cover">`
            : `<div style="width:100%;min-height:120px;display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--text-3);font-size:40px;border-radius:8px"><i class="bi bi-image"></i></div>`
            }
            <div class="dr-meta">
                <div class="dm-brand">${p.brand || '—'}</div>
                <h3>${p.stkcodeDescription || '—'}</h3>
                <div class="dm-code">${p.stkcode || '—'}</div>
                <div class="dr-price">฿${price.toFixed(2)}</div>
                <div class="dr-add-row">
                    <input type="number" class="dr-qty" id="mQty" value="1" min="1" max="99">
                    <button class="dr-add-btn${isBO ? ' bo-btn' : ''}" onclick="addCartFromModal(event)">
                        <i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
        <table class="spec-table">
            <tr><td>Stock Code</td><td>${p.stkcode || '—'}</td></tr>
            <tr><td>รายละเอียด</td><td>${p.stkcodeDescription || '—'}</td></tr>
            <tr><td>Brand</td><td>${p.brand || '—'}</td></tr>
            <tr><td>กลุ่มสินค้า</td><td>${p.productGroupNameMain || p.productGroup || '—'}</td></tr>
            <tr><td>สายผลิตภัณฑ์</td><td>${p.productLine || '—'}</td></tr>
            <tr><td>คงเหลือ</td><td>${p.qtyReady || '0'}</td></tr>
            <tr><td>ใช้กับรุ่น</td><td>${p.makerName || ''} ${p.modelName || ''}</td></tr>
            ${isBO ? `<tr><td>สถานะสินค้า</td><td><span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;background:#fff3cd;color:#856404;border:1px solid #ffc107;border-radius:6px;padding:2px 9px"><i class="bi bi-hourglass-split"></i> จอง (Back Order)</span></td></tr>` : ''}
        </table>
    `;
}

function addCartFromModal(e) {
    e.stopPropagation();
    const qty = parseInt($("#mQty").val()) || 1;
    addToCart(currentSpecProduct, qty);
}

// ----- Mobile drawer -----
function openSpecDrawer(p) {
    const isBO = (p.stock ?? 99) === 0;

    $("#drTitle").text(p.partName ?? "Product Specification");
    $("#drCode, #drCode2").text(p.partNumber ?? "—");
    if (p.imageUrl) {
        $("#drImg").attr("src", p.imageUrl).attr("alt", p.partName ?? "").show();
        $("#drImgPh").hide();
    } else {
        $("#drImg").hide();
        $("#drImgPh").show();
    }
    $("#drBrand, #drBrandCard").text(p.brand ?? "—");
    $("#drName").text(p.partName ?? "—");
    $("#drPrice").text("$" + (p.price ?? 0).toFixed(2));
    $("#drDescFull").text(p.description ?? "—");
    $("#drCat").text(p.category ?? "—");
    $("#drPN").text(p.partNumber ?? "—");
    $("#drQty").val(1);

    // Back order row
    $("#drBoRow").toggle(isBO);

    // Add-to-cart button state
    const addBtn = $("#drAddBtn");
    addBtn.toggleClass("bo-btn", isBO);
    addBtn.html(`<i class="bi ${isBO ? 'bi-hourglass-split' : 'bi-cart-plus'}"></i> ${isBO ? 'จอง (BO)' : 'Add to Cart'}`);

    // OEM tab
    const oemWrap = $("#dp-oem .oem-chips");
    oemWrap.empty();
    (p.oemNumbers || []).forEach(oem => {
        oemWrap.append(`<span class="oem-chip"><i class="bi bi-upc-scan"></i> ${oem}</span>`);
    });

    // Competitor tab
    const compTable = $("#dp-comp table");
    compTable.find("tr").not(":first").remove();
    (p.competitors || []).forEach(c => {
        compTable.append(`<tr><td>${c.brand}</td><td>${c.partNumber}</td></tr>`);
    });

    // Vehicle fitment tab
    const vehList = $("#dp-veh .veh-list");
    vehList.empty();
    (p.vehicles || []).forEach(v => {
        vehList.append(`
            <div class="veh-item"><i class="bi bi-car-front-fill"></i>
                <div><strong>${v.maker} ${v.model}</strong> ${v.engine ?? ''} ${v.yearFrom}–${v.yearTo} (${v.drive ?? ''})</div>
            </div>
        `);
    });

    // reset to first tab
    $(".drtab").removeClass("active").first().addClass("active");
    $(".drpane").removeClass("active");
    $("#dp-desc").addClass("active");

    $("#drawerOverlay, #specDrawer").addClass("open");
}

function closeDrawer() {
    $("#drawerOverlay, #specDrawer").removeClass("open");
}

function switchDrTab(btn, tab) {
    $(".drtab").removeClass("active");
    $(btn).addClass("active");
    $(".drpane").removeClass("active");
    $("#dp-" + tab).addClass("active");
}

function addCartFromDrawer(e) {
    e.stopPropagation();
    const qty = parseInt($("#drQty").val()) || 1;
    addToCart(currentSpecProduct, qty);
}

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
        return ` <div class="veh-pill"> <i class="bi ${f.icon}"></i> <span>${label}</span> </div>`;
    }).filter(Boolean);

    s.innerHTML = pills.length
        ? pills.join('')
        : `<div class="veh-empty">
               <i class="bi bi-car-front" style="font-size:1.1rem"></i>
               <span>Select vehicle attributes in the left panel to filter parts</span>
           </div>`;
}