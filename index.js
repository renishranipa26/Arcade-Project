/* ============================================
   ARCED CERAMIC — USER / SHOWROOM LOGIC
   Customer-facing catalog, search, filters,
   product detail modal, and real-time sync
   from admin changes via StorageEvent.
   ============================================ */

// ==========================================
// STATE
// ==========================================
let selectedShowroomL1 = 'cat-l1-tiles';
let selectedShowroomL2 = null;
let selectedShowroomL3 = null;
let searchQuery = '';
let currentModalProductId = null;

// ==========================================
// INITIALIZATION
// ==========================================
window.onload = async function () {
  await initializeDatabase();

  renderShowroomAccordion();
  renderShowroomProducts();

  console.log("ARCED Ceramic User Showroom loaded.");

  // Periodic polling sync (every 5 seconds) to check database updates from server
  setInterval(async () => {
    const previousCatsString = JSON.stringify(categories);
    const previousProdsString = JSON.stringify(products);

    await loadFromDatabase();

    if (JSON.stringify(categories) !== previousCatsString || JSON.stringify(products) !== previousProdsString) {
      renderShowroomAccordion();
      renderShowroomProducts();
      triggerNotification("Catalog Synced", "The showroom has been updated with the latest changes from the server.");
    }
  }, 5000);
};

// ==========================================
// REAL-TIME SYNC — Listen for admin changes
// ==========================================
window.addEventListener('storage', async function (e) {
  if (e.key === 'arcade_products' || e.key === 'arcade_categories') {
    await loadFromDatabase();
    renderShowroomAccordion();
    renderShowroomProducts();
    triggerNotification("Catalog Updated", "The showroom has been refreshed with the latest data from admin.");
  }
});

// ==========================================
// MOBILE MENU
// ==========================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// ==========================================
// GLOBAL SEARCH
// ==========================================
function handleGlobalSearch(val) {
  searchQuery = val.trim().toUpperCase();
  const clearBtn = document.getElementById('clear-search-btn');
  const searchStatusBar = document.getElementById('search-status-bar');
  const highlightLabel = document.getElementById('search-query-highlight');

  if (searchQuery.length > 0) {
    clearBtn.classList.remove('hidden');
    searchStatusBar.classList.remove('hidden');
    highlightLabel.innerText = searchQuery;
  } else {
    clearBtn.classList.add('hidden');
    searchStatusBar.classList.add('hidden');
  }

  // Sync dual inputs
  document.getElementById('global-search').value = searchQuery;
  const mobileInput = document.getElementById('mobile-global-search');
  if (mobileInput) mobileInput.value = searchQuery;

  renderShowroomProducts();
}

function clearGlobalSearch() {
  searchQuery = '';
  document.getElementById('global-search').value = '';
  const mobileInput = document.getElementById('mobile-global-search');
  if (mobileInput) mobileInput.value = '';
  document.getElementById('clear-search-btn').classList.add('hidden');
  document.getElementById('search-status-bar').classList.add('hidden');
  renderShowroomProducts();
}

// ==========================================
// CATEGORY ACCORDION
// ==========================================
function renderShowroomAccordion() {
  const container = document.getElementById('showroom-category-accordion');
  container.innerHTML = '';

  const l1Cats = categories.filter(c => c.level === 1);

  l1Cats.forEach(l1 => {
    const isL1Active = selectedShowroomL1 === l1.id;
    const l2Cats = categories.filter(c => c.parentId === l1.id);

    const l1Item = document.createElement('div');
    l1Item.className = "border border-luxury-100 rounded-xl overflow-hidden transition-all-300";

    // L1 Title Trigger
    l1Item.innerHTML = `
      <div onclick="selectL1Filter('${l1.id}')" class="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-all-300 ${isL1Active ? 'bg-luxury-900 text-white' : 'bg-luxury-50 text-luxury-800 hover:bg-luxury-100'}">
        <span class="text-xs font-extrabold uppercase tracking-wide flex items-center gap-2">
          <i class="fa-solid ${getCategoryIcon(l1.name)}"></i> ${l1.name}
        </span>
        <i class="fa-solid ${isL1Active ? 'fa-chevron-up text-luxury-accent' : 'fa-chevron-down text-luxury-400'} text-xs"></i>
      </div>
    `;

    if (isL1Active) {
      const l2Container = document.createElement('div');
      l2Container.className = "p-3 bg-white space-y-2 border-t border-luxury-100";

      l2Cats.forEach(l2 => {
        const isL2Active = selectedShowroomL2 === l2.id;
        const l3Cats = categories.filter(c => c.parentId === l2.id);

        const l2Item = document.createElement('div');
        l2Item.className = "space-y-1.5";
        l2Item.innerHTML = `
          <div onclick="selectL2Filter('${l1.id}', '${l2.id}')" class="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all-300 ${isL2Active ? 'text-luxury-accent bg-luxury-100' : 'text-luxury-700 hover:text-luxury-accent hover:bg-luxury-50'}">
            <span>• ${l2.name}</span>
            <i class="fa-solid ${isL2Active ? 'fa-minus' : 'fa-plus'} text-[10px] opacity-60"></i>
          </div>
        `;

        if (isL2Active) {
          const l3Container = document.createElement('div');
          l3Container.className = "pl-6 pr-2 py-1 space-y-1";

          l3Cats.forEach(l3 => {
            const isL3Active = selectedShowroomL3 === l3.id;
            l3Container.innerHTML += `
              <button onclick="selectL3Filter('${l1.id}', '${l2.id}', '${l3.id}')" class="w-full text-left px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center justify-between transition-all-300 ${isL3Active ? 'text-white bg-luxury-accent' : 'text-luxury-500 hover:text-luxury-900 hover:bg-luxury-50'}">
                <span>${l3.name}</span>
                <span class="opacity-50 text-[10px]">(${getL3Count(l3.id)})</span>
              </button>
            `;
          });

          if (l3Cats.length === 0) {
            l3Container.innerHTML = `<span class="text-[10px] text-luxury-400 italic block pl-2">No specs linked</span>`;
          }

          l2Item.appendChild(l3Container);
        }

        l2Container.appendChild(l2Item);
      });

      if (l2Cats.length === 0) {
        l2Container.innerHTML = `<span class="text-[10px] text-luxury-400 italic block">No items registered</span>`;
      }

      l1Item.appendChild(l2Container);
    }

    container.appendChild(l1Item);
  });
}

// ==========================================
// ACCORDION FILTER ACTIONS
// ==========================================
function selectL1Filter(l1Id) {
  if (selectedShowroomL1 === l1Id) {
    selectedShowroomL1 = null;
    selectedShowroomL2 = null;
    selectedShowroomL3 = null;
  } else {
    selectedShowroomL1 = l1Id;
    selectedShowroomL2 = null;
    selectedShowroomL3 = null;
  }
  renderShowroomAccordion();
  renderShowroomProducts();
}

function selectL2Filter(l1Id, l2Id) {
  event.stopPropagation();
  if (selectedShowroomL2 === l2Id) {
    selectedShowroomL2 = null;
    selectedShowroomL3 = null;
  } else {
    selectedShowroomL2 = l2Id;
    selectedShowroomL3 = null;
  }
  renderShowroomAccordion();
  renderShowroomProducts();
}

function selectL3Filter(l1Id, l2Id, l3Id) {
  event.stopPropagation();
  selectedShowroomL3 = (selectedShowroomL3 === l3Id) ? null : l3Id;
  renderShowroomAccordion();
  renderShowroomProducts();
}

function resetCategoryFilters() {
  selectedShowroomL1 = 'cat-l1-tiles';
  selectedShowroomL2 = null;
  selectedShowroomL3 = null;
  clearGlobalSearch();
  renderShowroomAccordion();
  renderShowroomProducts();
  triggerNotification("Filters Reset", "Viewing complete Premium Tiles");
}

// ==========================================
// SHOWROOM PRODUCT GRID
// ==========================================
function renderShowroomProducts() {
  const grid = document.getElementById('showroom-grid');
  const emptyState = document.getElementById('showroom-empty-state');
  const showroomTitle = document.getElementById('showroom-title');
  const breadcrumbTrail = document.getElementById('breadcrumb-trail');
  const countLabel = document.getElementById('showroom-count');

  grid.innerHTML = '';

  // Determine active headers
  let titleText = "Tiles";
  let trailText = "/ Tiles";

  if (selectedShowroomL1) {
    const c1 = categories.find(c => c.id === selectedShowroomL1);
    titleText = c1 ? `${c1.name} ` : titleText;
    trailText = ` / ${c1 ? c1.name : ''}`;
  }
  if (selectedShowroomL2) {
    const c2 = categories.find(c => c.id === selectedShowroomL2);
    trailText += ` / ${c2 ? c2.name : ''}`;
  }
  if (selectedShowroomL3) {
    const c3 = categories.find(c => c.id === selectedShowroomL3);
    trailText += ` / ${c3 ? c3.name : ''}`;
  }

  showroomTitle.innerText = titleText;
  breadcrumbTrail.innerText = trailText;

  // Filter products
  let list = [...products];

  if (selectedShowroomL1) list = list.filter(p => p.l1 === selectedShowroomL1);
  if (selectedShowroomL2) list = list.filter(p => p.l2 === selectedShowroomL2);
  if (selectedShowroomL3) list = list.filter(p => p.l3 === selectedShowroomL3);

  if (searchQuery) {
    list = list.filter(p => p.productId.includes(searchQuery) || p.name.toUpperCase().includes(searchQuery));
  }

  countLabel.innerText = list.length;

  if (list.length === 0) {
    grid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // Loop and draw product cards
  list.forEach((prod, index) => {
    const mainImg = (prod.images && prod.images.length > 0) ? prod.images[0] : SVG_TILES_1;
    const lowStock = prod.stock <= 15;
    const outOfStock = prod.stock === 0;

    let badgeHtml = '';
    if (outOfStock) {
      badgeHtml = `<span class="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shadow">Out of stock</span>`;
    } else if (lowStock) {
      badgeHtml = `<span class="absolute top-3 left-3 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1"></span>`;
    } else {
      badgeHtml = `<span class="absolute top-3 left-3 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1"></span>`;
    }

    const card = document.createElement('div');
    card.className = "group bg-white border border-luxury-200 hover:border-luxury-accent/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all-300 flex flex-col justify-between";

    card.innerHTML = `
      <div class="relative overflow-hidden aspect-square bg-luxury-50 flex items-center justify-center cursor-pointer" onclick="openShowroomModal('${prod.productId}')">
        <img id="card-img-${prod.productId}" src="${mainImg}" alt="${prod.name}" class="w-full h-full object-cover group-hover:scale-105 transition-all-300 duration-500">
        ${badgeHtml}

        <div class="absolute inset-0 bg-luxury-900/40 opacity-0 group-hover:opacity-100 transition-all-300 flex items-center justify-center">
          <span class="bg-white/95 text-luxury-900 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all-300">
            <i class="fa-solid fa-expand text-luxury-accent"></i> View Specs
          </span>
        </div>
      </div>

      <div class="p-5 flex-grow flex flex-col justify-between">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-luxury-400">
            <span>${getBreadcrumbStringShort(prod)}</span>
            <span class="text-luxury-800 bg-luxury-100 px-2 py-0.5 rounded border border-luxury-200 font-extrabold tracking-wide text-[9px]">ID: ${prod.productId}</span>
          </div>
          <h4 class="font-extrabold text-luxury-900 text-sm tracking-tight hover:text-luxury-accent cursor-pointer transition-all-300" onclick="openShowroomModal('${prod.productId}')">${prod.name}</h4>
          <p class="text-[11px] text-luxury-500 line-clamp-2 leading-relaxed">${prod.desc || 'No product catalog specifications provided.'}</p>
        </div>

        <!-- Card Thumbnail switcher panel -->
        <div class="mt-4 pt-3 border-t border-luxury-100 flex items-center justify-between">
          <div class="flex gap-1.5 items-center">
            ${generateThumbnailSwitcherRow(prod)}
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================
// THUMBNAIL HELPERS
// ==========================================
function generateThumbnailSwitcherRow(p) {
  if (!p.images || p.images.length <= 1) return '';

  let html = '';
  p.images.forEach((img, index) => {
    if (index > 3) return;
    html += `
      <div onmouseover="switchCardMainImage('${p.productId}', ${index})" class="w-6 h-6 border border-luxury-200 rounded-md overflow-hidden bg-luxury-100 cursor-pointer hover:border-luxury-accent transition-all-300">
        <img src="${img}" alt="t" class="w-full h-full object-cover">
      </div>
    `;
  });
  return html;
}

function switchCardMainImage(pId, imgIndex) {
  const img = document.getElementById(`card-img-${pId}`);
  if (img) {
    const prod = products.find(p => p.productId === pId);
    if (prod && prod.images && prod.images[imgIndex]) {
      img.src = prod.images[imgIndex];
    }
  }
}

// ==========================================
// SHOWROOM PRODUCT DETAIL MODAL
// ==========================================
function openShowroomModal(pId) {
  const prod = products.find(p => p.productId === pId);
  if (!prod) return;

  currentModalProductId = pId;

  document.getElementById('showroom-modal-title').innerText = prod.name;
  document.getElementById('showroom-modal-product-id').innerText = `ID: ${prod.productId}`;
  document.getElementById('showroom-modal-desc').innerText = prod.desc || "A flagship model offering unmatched durability, sleek lines, and modern aesthetics curated especially for designer environments.";
  const stockContainer = document.getElementById('showroom-modal-stock');
  if (stockContainer) {
    const stockA = prod.stockA !== undefined ? prod.stockA : prod.stock;
    const stockB = prod.stockB !== undefined ? prod.stockB : 0;
    const stockC = prod.stockC !== undefined ? prod.stockC : 0;
    const stockD = prod.stockD !== undefined ? prod.stockD : 0;

    stockContainer.innerHTML = `
      <div class="flex flex-col gap-2.5 bg-luxury-50 p-4 rounded-2xl border border-luxury-200 w-full shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-luxury-500">Aggregated Catalog Volume</span>
          <span class="text-2xl font-black text-luxury-900">${prod.stock} Pcs</span>
        </div>
        <div class="grid grid-cols-4 gap-2 pt-2.5 border-t border-luxury-200 text-center">
          <div class="bg-white p-2 rounded-xl border border-luxury-100 flex flex-col gap-0.5 shadow-sm">
            <span class="text-[9px] font-bold text-luxury-400 block uppercase">Batch A</span>
            <span class="text-xs font-black text-luxury-900">${stockA}</span>
          </div>
          <div class="bg-white p-2 rounded-xl border border-luxury-100 flex flex-col gap-0.5 shadow-sm">
            <span class="text-[9px] font-bold text-luxury-400 block uppercase">Batch B</span>
            <span class="text-xs font-black text-luxury-900">${stockB}</span>
          </div>
          <div class="bg-white p-2 rounded-xl border border-luxury-100 flex flex-col gap-0.5 shadow-sm">
            <span class="text-[9px] font-bold text-luxury-400 block uppercase">Batch C</span>
            <span class="text-xs font-black text-luxury-900">${stockC}</span>
          </div>
          <div class="bg-white p-2 rounded-xl border border-luxury-100 flex flex-col gap-0.5 shadow-sm">
            <span class="text-[9px] font-bold text-luxury-400 block uppercase">Batch D</span>
            <span class="text-xs font-black text-luxury-900">${stockD}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Category breadcrumb trail
  const l1 = categories.find(c => c.id === prod.l1);
  const l2 = categories.find(c => c.id === prod.l2);
  const l3 = categories.find(c => c.id === prod.l3);
  const trail = `${l1 ? l1.name : ''} > ${l2 ? l2.name : ''} > ${l3 ? l3.name : ''}`;
  document.getElementById('showroom-modal-breadcrumbs').innerText = trail;

  // Main image
  const mainImgElement = document.getElementById('showroom-modal-main-img');
  const firstImg = (prod.images && prod.images.length > 0) ? prod.images[0] : SVG_TILES_1;
  mainImgElement.src = firstImg;

  // // Stock badge
  // const badge = document.getElementById('showroom-modal-stock-badge');
  // if (prod.stock === 0) {
  //   badge.className = "absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-md bg-red-600 text-white";
  //   // badge.innerText = "Out of stock";
  // } else if (prod.stock <= 15) {
  //   badge.className = "absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-md bg-amber-500 text-white animate-pulse";
  //   // badge.innerText = `Low Stock Warning: ${prod.stock} units`;
  // } else {
  //   badge.className = "absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-md bg-green-600 text-white";
  //   // badge.innerText = "Premium Item Available";
  // }

  // Thumbnail list
  const thumbRow = document.getElementById('showroom-modal-thumbnail-row');
  thumbRow.innerHTML = '';

  if (prod.images && prod.images.length > 0) {
    prod.images.forEach((img, index) => {
      const thumb = document.createElement('div');
      thumb.className = `w-14 h-14 rounded-xl border-2 shrink-0 overflow-hidden bg-luxury-100 cursor-pointer transition-all-300 ${index === 0 ? 'border-luxury-accent' : 'border-transparent hover:border-luxury-400'}`;
      thumb.innerHTML = `<img src="${img}" class="w-full h-full object-cover">`;
      thumb.onclick = function () {
        mainImgElement.src = img;
        Array.from(thumbRow.children).forEach(child => child.classList.replace('border-luxury-accent', 'border-transparent'));
        thumb.classList.replace('border-transparent', 'border-luxury-accent');
      };
      thumbRow.appendChild(thumb);
    });
  }

  // Show modal
  const modal = document.getElementById('showroom-modal');
  const card = document.getElementById('showroom-modal-card');

  modal.classList.remove('hidden');
  setTimeout(() => {
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
  }, 50);
}

function closeShowroomModal() {
  const modal = document.getElementById('showroom-modal');
  const card = document.getElementById('showroom-modal-card');

  card.classList.remove('scale-100');
  card.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 150);
}

// ==========================================
// COPY INQUIRY TO CLIPBOARD
// ==========================================
function copyInquiryDetails() {
  const prod = products.find(p => p.productId === currentModalProductId);
  if (!prod) return;

  const l1 = categories.find(c => c.id === prod.l1);
  const l2 = categories.find(c => c.id === prod.l2);
  const l3 = categories.find(c => c.id === prod.l3);

  // const queryText = `ARCED Ceramic Showroom Inquiry:\n-----------------------------------\nProduct ID: ${prod.productId}\nName: ${prod.name}\nHierarchy Path: ${l1 ? l1.name : ''} > ${l2 ? l2.name : ''} > ${l3 ? l3.name : ''}\nAvailable Stock Level: ${prod.stock} Pcs\nDescription: ${prod.desc || ''}\n-----------------------------------\nGenerated on system: ${new Date().toLocaleString()}`;
  const queryText = `ARCED Ceramic Showroom Inquiry:\n-----------------------------------\nProduct ID: ${prod.productId}\nName: ${prod.name}\nHierarchy Path: ${l1 ? l1.name : ''} > ${l2 ? l2.name : ''} > ${l3 ? l3.name : ''}\nAvailable Stock Level: ${prod.stock} Pcs\nDescription: ${prod.desc || ''}\nDate & Time : ${new Date().toLocaleString()}`;

  const el = document.createElement('textarea');
  el.value = queryText;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);

  triggerNotification("Inquiry Details Copied", "Share details directly with your regional ARCED Ceramic representative.");
}
