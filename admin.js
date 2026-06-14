/* ============================================
   ARCED CERAMIC — ADMIN DASHBOARD LOGIC
   All admin-only functionality: dashboard tabs,
   CRUD for products & categories, stock management,
   Excel import engine, and form handling.
   ============================================ */

// ==========================================
// STATE
// ==========================================
let currentDashTab = 'home';
let modalImageBuffer = [];
let rawImportData = [];
let processedImportBatch = [];
let activeModalMode = 'add'; // 'add' or 'edit'
let activeEditProductId = null;

// ==========================================
// INITIALIZATION
// ==========================================
window.onload = async function () {
  await initializeDatabase();

  renderDashboardOverview();
  syncCategoryDropdownOptions();

  console.log("ARCED Ceramic Admin Dashboard loaded.");

  // Periodic polling sync (every 5 seconds) to check database updates from server
  setInterval(async () => {
    const previousCatsString = JSON.stringify(categories);
    const previousProdsString = JSON.stringify(products);
    
    await loadFromDatabase();
    
    if (JSON.stringify(categories) !== previousCatsString || JSON.stringify(products) !== previousProdsString) {
      renderDashboardOverview();
      syncCategoryDropdownOptions();
      if (currentDashTab === 'home') {
        renderDashboardOverview();
      } else if (currentDashTab === 'categories') {
        renderCategoryHierarchyTree();
      } else if (currentDashTab === 'products') {
        renderAdminProductsTable();
      } else if (currentDashTab === 'stock') {
        renderAdminStockTable();
      }
      triggerNotification("Catalog Synced", "The admin panel has been updated with the latest changes from the server.");
    }
  }, 5000);
};

// ==========================================
// MOBILE MENU
// ==========================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// ==========================================
// DASHBOARD TAB ROUTING
// ==========================================
function switchDashTab(tabName) {
  currentDashTab = tabName;

  // Hide all sub tab screens
  const tabs = ['home', 'categories', 'products', 'stock', 'import'];
  tabs.forEach(t => {
    document.getElementById(`dash-tabscreen-${t}`).classList.add('hidden');

    const btn = document.getElementById(`dash-tab-${t}`);
    btn.className = "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all-300 hover:bg-luxury-800 text-luxury-400";
  });

  // Show active subscreen
  document.getElementById(`dash-tabscreen-${tabName}`).classList.remove('hidden');

  // Highlight side tab button
  const activeBtn = document.getElementById(`dash-tab-${tabName}`);
  activeBtn.className = "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all-300 bg-luxury-accent text-white shadow-lg shadow-luxury-accent/15";

  // Tab Trigger Actions
  if (tabName === 'home') {
    renderDashboardOverview();
  } else if (tabName === 'categories') {
    renderCategoryHierarchyTree();
  } else if (tabName === 'products') {
    renderAdminProductsTable();
  } else if (tabName === 'stock') {
    renderAdminStockTable();
  }
}

// ==========================================
// OVERVIEW STATS
// ==========================================
function renderDashboardOverview() {
  document.getElementById('stat-total-products').innerText = products.length;
  document.getElementById('stat-total-categories').innerText = categories.length;

  const totalStockSum = products.reduce((acc, curr) => acc + parseInt(curr.stock || 0), 0);
  document.getElementById('stat-total-stock').innerText = totalStockSum;

  const lowStockCount = products.filter(p => p.stock <= 15).length;
  document.getElementById('stat-low-stock').innerText = lowStockCount;
}

// ==========================================
// CATEGORY HIERARCHY TREE
// ==========================================
function renderCategoryHierarchyTree() {
  const treeContainer = document.getElementById('category-hierarchy-view');
  treeContainer.innerHTML = '';

  const l1Cats = categories.filter(c => c.level === 1);

  l1Cats.forEach(l1 => {
    const l1Node = document.createElement('div');
    l1Node.className = "bg-white p-4 rounded-xl border border-luxury-200 space-y-3 shadow-sm";

    const l2Cats = categories.filter(c => c.parentId === l1.id);

    l1Node.innerHTML = `
      <div class="flex items-center justify-between border-b border-luxury-100 pb-2">
        <span class="text-xs font-extrabold text-luxury-900 uppercase tracking-widest flex items-center gap-1.5">
          <i class="fa-solid fa-folder text-luxury-accent"></i> Level 1: ${l1.name}
        </span>
        <div class="flex items-center gap-2">
          <button onclick="deleteCategoryNode('${l1.id}')" class="text-red-500 hover:text-red-700 text-xs px-2 py-1"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;

    const l2Container = document.createElement('div');
    l2Container.className = "pl-6 space-y-3 border-l border-luxury-200 mt-2";

    l2Cats.forEach(l2 => {
      const l2Node = document.createElement('div');
      l2Node.className = "bg-luxury-50 p-3 rounded-lg border border-luxury-200 space-y-2";

      const l3Cats = categories.filter(c => c.parentId === l2.id);

      l2Node.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-luxury-800 uppercase tracking-wide flex items-center gap-1.5">
            <i class="fa-solid fa-folder-open text-luxury-accent"></i> Level 2: ${l2.name}
          </span>
          <button onclick="deleteCategoryNode('${l2.id}')" class="text-red-500 hover:text-red-700 text-[11px]"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;

      const l3Container = document.createElement('div');
      l3Container.className = "pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1";

      l3Cats.forEach(l3 => {
        l3Container.innerHTML += `
          <div class="bg-white px-2.5 py-1.5 rounded border border-luxury-200 flex items-center justify-between">
            <span class="text-[11px] text-luxury-700 font-medium">Level 3: ${l3.name}</span>
            <button onclick="deleteCategoryNode('${l3.id}')" class="text-red-500 hover:text-red-700 text-[10px]"><i class="fa-solid fa-circle-minus"></i></button>
          </div>
        `;
      });

      if (l3Cats.length === 0) {
        l3Container.innerHTML = `<span class="text-[10px] text-luxury-400 italic">No Level 3 spec nodes registered. Products require at least one Level 3 association.</span>`;
      }

      l2Node.appendChild(l3Container);
      l2Container.appendChild(l2Node);
    });

    if (l2Cats.length === 0) {
      l2Container.innerHTML = `<span class="text-[10px] text-luxury-400 italic">No Level 2 subcategories registered.</span>`;
    }

    l1Node.appendChild(l2Container);
    treeContainer.appendChild(l1Node);
  });

  if (l1Cats.length === 0) {
    treeContainer.innerHTML = `
      <div class="text-center py-10">
        <p class="text-xs text-luxury-500">No categories recorded. Expand your hierarchy framework using the action controller.</p>
      </div>
    `;
  }
}

async function deleteCategoryNode(catId) {
  const hasChildren = categories.some(c => c.parentId === catId);
  if (hasChildren) {
    triggerNotification("Action Obstructed", "Please delete or reassociate nested child categories first.", "error");
    return;
  }

  const productsLinked = products.some(p => p.l1 === catId || p.l2 === catId || p.l3 === catId);
  if (productsLinked) {
    triggerNotification("Action Obstructed", "A product model in your catalog is actively bound to this node.", "error");
    return;
  }

  categories = categories.filter(c => c.id !== catId);
  await writeCategoriesToDatabase();
  renderCategoryHierarchyTree();
  renderDashboardOverview();
  syncCategoryDropdownOptions();
  triggerNotification("Node Eliminated", "Category path structure pruned successfully.");
}

// ==========================================
// CATEGORY MODAL (ADD)
// ==========================================
function openCategoryModal() {
  const modal = document.getElementById('category-modal');
  const card = document.getElementById('category-modal-card');

  document.getElementById('category-form').reset();
  adjustCategoryModalParentOptions();

  modal.classList.remove('hidden');
  setTimeout(() => {
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
  }, 50);
}

function closeCategoryModal() {
  const modal = document.getElementById('category-modal');
  const card = document.getElementById('category-modal-card');

  card.classList.remove('scale-100');
  card.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 150);
}

function adjustCategoryModalParentOptions() {
  const level = parseInt(document.getElementById('form-cat-level').value);
  const container = document.getElementById('form-cat-parent-container');
  const dropdown = document.getElementById('form-cat-parent');
  const label = document.getElementById('form-cat-parent-label');

  dropdown.innerHTML = '';

  if (level === 1) {
    container.classList.add('hidden');
    dropdown.removeAttribute('required');
  } else if (level === 2) {
    container.classList.remove('hidden');
    dropdown.setAttribute('required', 'required');
    label.innerText = 'Associating Level 1 Main Category *';

    const l1List = categories.filter(c => c.level === 1);
    l1List.forEach(c => {
      dropdown.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
  } else if (level === 3) {
    container.classList.remove('hidden');
    dropdown.setAttribute('required', 'required');
    label.innerText = 'Associating Level 2 Subcategory *';

    const l2List = categories.filter(c => c.level === 2);
    l2List.forEach(c => {
      const p1 = categories.find(parent => parent.id === c.parentId);
      dropdown.innerHTML += `<option value="${c.id}">${p1 ? p1.name : ''} > ${c.name}</option>`;
    });
  }
}

async function submitCategoryForm() {
  const form = document.getElementById('category-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  event.preventDefault();

  const name = document.getElementById('form-cat-name').value.trim();
  const level = parseInt(document.getElementById('form-cat-level').value);
  const parentId = level === 1 ? null : document.getElementById('form-cat-parent').value;

  const newId = `cat-user-gen-${Date.now()}`;

  categories.push({
    id: newId,
    name: name,
    level: level,
    parentId: parentId
  });

  await writeCategoriesToDatabase();
  renderCategoryHierarchyTree();
  renderDashboardOverview();
  syncCategoryDropdownOptions();
  closeCategoryModal();
  triggerNotification("Category Registered", `Linked "${name}" successfully inside Level ${level} framework.`);
}

// ==========================================
// PRODUCT TABLE (Admin)
// ==========================================
function renderAdminProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  const searchInput = document.getElementById('admin-search-products').value.trim().toUpperCase();
  const filterL1 = document.getElementById('admin-filter-main-cat').value;
  const countLabel = document.getElementById('admin-product-count');

  tbody.innerHTML = '';

  let list = [...products];

  if (filterL1 !== 'all') {
    list = list.filter(p => p.l1 === filterL1);
  }

  if (searchInput) {
    list = list.filter(p => p.productId.toUpperCase().includes(searchInput) || p.name.toUpperCase().includes(searchInput));
  }

  countLabel.innerText = `${list.length} catalog elements loaded`;

  list.forEach(p => {
    const l1 = categories.find(c => c.id === p.l1);
    const l2 = categories.find(c => c.id === p.l2);
    const l3 = categories.find(c => c.id === p.l3);

    const mainImg = p.images && p.images.length > 0 ? p.images[0] : SVG_TILES_1;

    const row = document.createElement('tr');
    row.className = "hover:bg-luxury-50 transition-all-300";
    row.innerHTML = `
      <td class="py-3 px-4">
        <div class="w-10 h-10 rounded-lg overflow-hidden bg-luxury-100 border border-luxury-200 flex items-center justify-center">
          <img src="${mainImg}" class="w-full h-full object-cover">
        </div>
      </td>
      <td class="py-3 px-4 font-extrabold text-luxury-900">${p.productId}</td>
      <td class="py-3 px-4 font-bold text-luxury-800">${p.name}</td>
      <td class="py-3 px-4 text-luxury-500 font-medium">
        <div class="flex items-center gap-1.5">
          <span>${l1 ? l1.name : '-'}</span>
          <i class="fa-solid fa-angle-right text-[10px] opacity-40"></i>
          <span>${l2 ? l2.name : '-'}</span>
          <i class="fa-solid fa-angle-right text-[10px] opacity-40"></i>
          <span>${l3 ? l3.name : '-'}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${p.stock <= 15 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'}">
          ${p.stock}
        </span>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-2.5">
          <button onclick="openProductModal('edit', '${p.productId}')" class="bg-luxury-100 hover:bg-luxury-200 text-luxury-800 hover:text-luxury-accent font-bold px-3 py-1.5 rounded-lg border border-luxury-200 transition-all-300">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProductTransaction('${p.productId}')" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-all-300">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-10 text-luxury-400 italic">No associated items found.</td>
      </tr>
    `;
  }
}

async function deleteProductTransaction(pId) {
  if (confirm(`Confirm deletion of product model ${pId}?`)) {
    products = products.filter(p => p.productId !== pId);
    await writeProductsToDatabase();
    renderAdminProductsTable();
    renderDashboardOverview();
    renderAdminStockTable();
    triggerNotification("Product Erased", `Catalog reference ${pId} deleted successfully.`);
  }
}

// ==========================================
// PRODUCT MODAL (ADD/EDIT)
// ==========================================
function openProductModal(mode, pId = null) {
  activeModalMode = mode;
  activeEditProductId = pId;

  const modal = document.getElementById('product-modal');
  const card = document.getElementById('product-modal-card');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');

  form.reset();
  modalImageBuffer = [];
  document.getElementById('modal-uploaded-thumbnails').innerHTML = '';

  syncCategoryDropdownOptions();

  if (mode === 'add') {
    title.innerText = "Register Premium Ceramic Model";
    document.getElementById('form-product-id').removeAttribute('disabled');
  } else {
    title.innerText = `Edit Specifications: ${pId}`;
    const prod = products.find(p => p.productId === pId);
    if (prod) {
      document.getElementById('form-product-id').value = prod.productId;
      document.getElementById('form-product-id').setAttribute('disabled', 'disabled');
      document.getElementById('form-product-name').value = prod.name;
      document.getElementById('form-product-stock').value = prod.stock;
      document.getElementById('form-product-desc').value = prod.desc || '';

      document.getElementById('form-product-l1').value = prod.l1;
      populateLevel2FormDropdown();

      document.getElementById('form-product-l2').value = prod.l2;
      populateLevel3FormDropdown();

      document.getElementById('form-product-l3').value = prod.l3;

      if (prod.images) {
        modalImageBuffer = [...prod.images];
        renderModalThumbnails();
      }
    }
  }

  modal.classList.remove('hidden');
  setTimeout(() => {
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
  }, 50);
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  const card = document.getElementById('product-modal-card');

  card.classList.remove('scale-100');
  card.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 150);
}

// ==========================================
// DROPDOWN SYNC
// ==========================================
function syncCategoryDropdownOptions() {
  const l1Dropdown = document.getElementById('form-product-l1');
  const adminFilterL1 = document.getElementById('admin-filter-main-cat');

  l1Dropdown.innerHTML = '<option value="">Select Level 1 Category</option>';
  adminFilterL1.innerHTML = '<option value="all">All Main Categories</option>';

  const l1List = categories.filter(c => c.level === 1);

  l1List.forEach(c => {
    l1Dropdown.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    adminFilterL1.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  document.getElementById('form-product-l2').innerHTML = '<option value="">Select Level 2 Category</option>';
  document.getElementById('form-product-l3').innerHTML = '<option value="">Select Level 3 Category</option>';
}

function populateLevel2FormDropdown() {
  const l1Id = document.getElementById('form-product-l1').value;
  const l2Dropdown = document.getElementById('form-product-l2');

  l2Dropdown.innerHTML = '<option value="">Select Level 2 Category</option>';
  document.getElementById('form-product-l3').innerHTML = '<option value="">Select Level 3 Category</option>';

  const l2List = categories.filter(c => c.parentId === l1Id);
  l2List.forEach(c => {
    l2Dropdown.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

function populateLevel3FormDropdown() {
  const l2Id = document.getElementById('form-product-l2').value;
  const l3Dropdown = document.getElementById('form-product-l3');

  l3Dropdown.innerHTML = '<option value="">Select Level 3 Category</option>';

  const l3List = categories.filter(c => c.parentId === l2Id);
  l3List.forEach(c => {
    l3Dropdown.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// ==========================================
// IMAGE UPLOAD HANDLER
// ==========================================
function handleModalImageUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      modalImageBuffer.push(e.target.result);
      renderModalThumbnails();
    };
    reader.readAsDataURL(file);
  });
}

function renderModalThumbnails() {
  const container = document.getElementById('modal-uploaded-thumbnails');
  container.innerHTML = '';

  modalImageBuffer.forEach((imgBase64, index) => {
    const thumb = document.createElement('div');
    thumb.className = "relative w-full aspect-square border border-luxury-200 rounded-lg overflow-hidden bg-luxury-50 group flex items-center justify-center";

    thumb.innerHTML = `
      <img src="${imgBase64}" class="w-full h-full object-cover">
      <button onclick="removeModalImage(${index})" type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded p-1 text-[9px] hover:bg-red-700 shadow flex items-center justify-center w-5 h-5"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(thumb);
  });
}

function removeModalImage(index) {
  modalImageBuffer.splice(index, 1);
  renderModalThumbnails();
}

// ==========================================
// SUBMIT PRODUCT FORM
// ==========================================
async function submitProductForm() {
  const form = document.getElementById('product-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const pId = document.getElementById('form-product-id').value.trim().toUpperCase();
  const name = document.getElementById('form-product-name').value.trim();
  const stock = parseInt(document.getElementById('form-product-stock').value || 0);
  const l1 = document.getElementById('form-product-l1').value;
  const l2 = document.getElementById('form-product-l2').value;
  const l3 = document.getElementById('form-product-l3').value;
  const desc = document.getElementById('form-product-desc').value.trim();

  if (modalImageBuffer.length === 0) {
    modalImageBuffer.push(SVG_TILES_1);
  }

  if (activeModalMode === 'add') {
    const duplicate = products.some(p => p.productId === pId);
    if (duplicate) {
      triggerNotification("Key Violation", `Product ID "${pId}" is already registered in showroom database.`, "error");
      return;
    }

    products.push({
      productId: pId,
      name: name,
      l1: l1,
      l2: l2,
      l3: l3,
      stock: stock,
      desc: desc,
      images: modalImageBuffer
    });

    triggerNotification("Product Registered", `${pId} registered successfully.`);
  } else {
    const idx = products.findIndex(p => p.productId === activeEditProductId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name: name,
        l1: l1,
        l2: l2,
        l3: l3,
        stock: stock,
        desc: desc,
        images: modalImageBuffer
      };
      triggerNotification("Product Edited", `Successfully committed updates to registry.`);
    }
  }

  await writeProductsToDatabase();
  renderAdminProductsTable();
  renderDashboardOverview();
  renderAdminStockTable();
  closeProductModal();
}

// ==========================================
// STOCK ROOM TABLE
// ==========================================
function renderAdminStockTable() {
  const tbody = document.getElementById('admin-stock-tbody');
  tbody.innerHTML = '';

  products.forEach(p => {
    const isLow = p.stock <= 15;
    const isOut = p.stock === 0;

    let levelClass = "bg-green-100 text-green-800 border-green-200";
    let levelText = "Optimal Stock";
    if (isOut) {
      levelClass = "bg-red-100 text-red-800 border-red-200";
      levelText = "OUT OF STOCK";
    } else if (isLow) {
      levelClass = "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";
      levelText = "LOW VOLUME";
    }

    const row = document.createElement('tr');
    row.className = "hover:bg-luxury-50 transition-all-300";
    row.innerHTML = `
      <td class="py-3.5 px-4 font-black text-luxury-900">${p.productId}</td>
      <td class="py-3.5 px-4 font-bold text-luxury-800">${p.name}</td>
      <td class="py-3.5 px-4 text-center">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${levelClass}">
          ${levelText}
        </span>
      </td>
      <td class="py-3.5 px-4">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="modifyStockValue('${p.productId}', -10)" class="w-8 h-8 rounded bg-luxury-100 text-luxury-700 hover:bg-luxury-accent hover:text-white transition-all-300 font-extrabold flex items-center justify-center">-10</button>
          <button onclick="modifyStockValue('${p.productId}', -1)" class="w-8 h-8 rounded bg-luxury-100 text-luxury-700 hover:bg-luxury-accent hover:text-white transition-all-300 font-extrabold flex items-center justify-center">-1</button>

          <input type="number" value="${p.stock}" min="0" onchange="adjustStockDirectly('${p.productId}', this.value)" class="w-16 bg-luxury-50 border border-luxury-200 text-center rounded py-1.5 font-bold text-xs focus:outline-none focus:border-luxury-accent text-luxury-900">

          <button onclick="modifyStockValue('${p.productId}', 1)" class="w-8 h-8 rounded bg-luxury-100 text-luxury-700 hover:bg-luxury-accent hover:text-white transition-all-300 font-extrabold flex items-center justify-center">+1</button>
          <button onclick="modifyStockValue('${p.productId}', 10)" class="w-8 h-8 rounded bg-luxury-100 text-luxury-700 hover:bg-luxury-accent hover:text-white transition-all-300 font-extrabold flex items-center justify-center">+10</button>
        </div>
      </td>
      <td class="py-3.5 px-4 text-right text-luxury-400 font-medium">${new Date().toLocaleTimeString()}</td>
    `;

    tbody.appendChild(row);
  });
}

async function modifyStockValue(pId, offset) {
  const idx = products.findIndex(p => p.productId === pId);
  if (idx !== -1) {
    let newStock = parseInt(products[idx].stock || 0) + offset;
    if (newStock < 0) newStock = 0;

    products[idx].stock = newStock;
    await writeProductsToDatabase();
    renderAdminStockTable();
    renderDashboardOverview();
    triggerNotification("Stock Level Tuned", `Product ID: ${pId} updated to ${newStock} units.`);
  }
}

async function adjustStockDirectly(pId, value) {
  let numeric = parseInt(value);
  if (isNaN(numeric) || numeric < 0) numeric = 0;

  const idx = products.findIndex(p => p.productId === pId);
  if (idx !== -1) {
    products[idx].stock = numeric;
    await writeProductsToDatabase();
    renderAdminStockTable();
    renderDashboardOverview();
    triggerNotification("Stock Value Corrected", `Directly assigned stock of ${numeric} to ${pId}.`);
  }
}

// ==========================================
// EXCEL / CSV IMPORT ENGINE (SheetJS)
// ==========================================
function downloadExcelTemplate() {
  const headers = [
    ["Product ID", "Product Name", "Main Category", "Level 2 Category", "Level 3 Category", "Stock Quantity", "Description"]
  ];

  const sampleRows = [
    ["T-4021", "Onyx Premium Glazed Tile", "Tiles", "Floor Tiles", "600x600", "150", "Elite microcrystalline polished glazed flooring tile."],
    ["S-5021", "Wave Wall Hung WC", "Sanitary", "Water Closets", "Wall Hung Closet", "24", "Stain free rimless smart wall hung water closet with dual wash."],
    ["F-6021", "Cascade Tall Tap", "Faucet", "Premium Mixers", "Basin Mixers", "85", "Sleek matte design black table top faucet."]
  ];

  const data = headers.concat(sampleRows);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 15 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Showroom Template Schema");
  XLSX.writeFile(wb, "arced_ceramic_template_schema.xlsx");
  triggerNotification("Template Downloaded", "Populate the worksheet schema following standard instructions.");
}

// DROP ZONE
function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('border-luxury-accent');

  const file = e.dataTransfer.files[0];
  if (file) parseFileImport(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) parseFileImport(file);
}

function parseFileImport(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawRows.length <= 1) {
        triggerNotification("Parsing Obstruction", "The spreadsheet lacks appropriate record data rows.", "error");
        return;
      }

      rawImportData = rawRows;
      processImportEvaluation(file.name);

    } catch (err) {
      console.error(err);
      triggerNotification("Format Unrecognized", "Ensure file matches valid excel worksheets.", "error");
    }
  };

  reader.readAsArrayBuffer(file);
}

function processImportEvaluation(filename) {
  const headers = rawImportData[0].map(h => String(h).trim().toLowerCase());

  const colIdIdx = headers.indexOf("product id");
  const colNameIdx = headers.indexOf("product name");
  const colL1Idx = headers.indexOf("main category");
  const colL2Idx = headers.indexOf("level 2 category");
  const colL3Idx = headers.indexOf("level 3 category");
  const colStockIdx = headers.indexOf("stock quantity");
  const colDescIdx = headers.indexOf("description");

  if (colIdIdx === -1 || colNameIdx === -1 || colL1Idx === -1 || colL2Idx === -1 || colL3Idx === -1 || colStockIdx === -1) {
    triggerNotification("Schema Validation Failed", "Excel columns do not match ARCED schema headers.", "error");
    return;
  }

  processedImportBatch = [];
  let validCount = 0;
  let invalidCount = 0;

  const evalTbody = document.getElementById('import-evaluation-tbody');
  evalTbody.innerHTML = '';

  for (let i = 1; i < rawImportData.length; i++) {
    const row = rawImportData[i];
    if (!row || row.length === 0) continue;

    const rawId = row[colIdIdx] ? String(row[colIdIdx]).trim().toUpperCase() : '';
    const rawName = row[colNameIdx] ? String(row[colNameIdx]).trim() : '';
    const rawL1 = row[colL1Idx] ? String(row[colL1Idx]).trim() : '';
    const rawL2 = row[colL2Idx] ? String(row[colL2Idx]).trim() : '';
    const rawL3 = row[colL3Idx] ? String(row[colL3Idx]).trim() : '';
    const rawStock = row[colStockIdx] !== undefined ? parseInt(row[colStockIdx]) : NaN;
    const rawDesc = colDescIdx !== -1 && row[colDescIdx] ? String(row[colDescIdx]).trim() : '';

    let parsedCorrectly = true;
    let diagnosticNote = "Ready to Sync";

    if (!rawId) {
      parsedCorrectly = false;
      diagnosticNote = "Row ID is blank";
    } else if (!rawName) {
      parsedCorrectly = false;
      diagnosticNote = "Title field empty";
    } else if (!rawL1 || !rawL2 || !rawL3) {
      parsedCorrectly = false;
      diagnosticNote = "Incomplete category path";
    } else if (isNaN(rawStock) || rawStock < 0) {
      parsedCorrectly = false;
      diagnosticNote = "Invalid stock volume";
    }

    if (parsedCorrectly) validCount++; else invalidCount++;

    processedImportBatch.push({
      rowNum: i + 1,
      productId: rawId,
      name: rawName,
      l1: rawL1,
      l2: rawL2,
      l3: rawL3,
      stock: isNaN(rawStock) ? 0 : rawStock,
      desc: rawDesc,
      valid: parsedCorrectly,
      diagnostic: diagnosticNote
    });

    const rEl = document.createElement('tr');
    rEl.className = parsedCorrectly ? "hover:bg-luxury-50" : "bg-red-50 hover:bg-red-100 text-red-900";
    rEl.innerHTML = `
      <td class="py-2 px-4 font-bold text-[11px]">#${i + 1}</td>
      <td class="py-2 px-4 font-black">${rawId || 'MISSING'}</td>
      <td class="py-2 px-4 font-bold">${rawName || 'MISSING'}</td>
      <td class="py-2 px-4">${rawL1} > ${rawL2} > ${rawL3}</td>
      <td class="py-2 px-4 font-bold">${isNaN(rawStock) ? 'ERR' : rawStock}</td>
      <td class="py-2 px-4 text-center">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${parsedCorrectly ? 'bg-green-100 text-green-800' : 'bg-red-200 text-red-950'}">
          ${diagnosticNote}
        </span>
      </td>
    `;
    evalTbody.appendChild(rEl);
  }

  document.getElementById('import-log-valid').innerText = validCount;
  document.getElementById('import-log-invalid').innerText = invalidCount;
  document.getElementById('import-meta-filename').innerText = filename;

  let updateCount = 0;
  let insertCount = 0;

  processedImportBatch.forEach(b => {
    if (!b.valid) return;
    const exists = products.some(p => p.productId === b.productId);
    if (exists) updateCount++; else insertCount++;
  });

  document.getElementById('import-meta-updates').innerText = `${updateCount} updates`;
  document.getElementById('import-meta-inserts').innerText = `${insertCount} inserts`;
  document.getElementById('import-meta-new-cats').innerText = `Sync Pending`;

  document.getElementById('import-summary-container').classList.remove('hidden');

  const execBtn = document.getElementById('import-execute-btn');
  if (validCount === 0) {
    execBtn.setAttribute('disabled', 'disabled');
    execBtn.className = "bg-luxury-300 text-luxury-500 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg cursor-not-allowed";
  } else {
    execBtn.removeAttribute('disabled');
    execBtn.className = "bg-luxury-accent hover:bg-luxury-accent/90 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all-300";
  }

  triggerNotification("Analysis Executed", `Processed spreadsheet file. Evaluated ${validCount} valid inputs.`);
}

function cancelImport() {
  rawImportData = [];
  processedImportBatch = [];
  document.getElementById('import-summary-container').classList.add('hidden');
  triggerNotification("Import Discarded", "Evaluation logs cleared.");
}

async function executeImportTransaction() {
  if (processedImportBatch.length === 0) return;

  let itemsSynced = 0;

  processedImportBatch.forEach(batchRow => {
    if (!batchRow.valid) return;

    const resolvedIds = autoResolveHierarchyPaths(batchRow.l1, batchRow.l2, batchRow.l3);

    const idx = products.findIndex(p => p.productId === batchRow.productId);

    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name: batchRow.name,
        l1: resolvedIds.l1,
        l2: resolvedIds.l2,
        l3: resolvedIds.l3,
        stock: batchRow.stock,
        desc: batchRow.desc || products[idx].desc
      };
    } else {
      products.push({
        productId: batchRow.productId,
        name: batchRow.name,
        l1: resolvedIds.l1,
        l2: resolvedIds.l2,
        l3: resolvedIds.l3,
        stock: batchRow.stock,
        desc: batchRow.desc,
        images: [SVG_TILES_1]
      });
    }

    itemsSynced++;
  });

  await writeCategoriesToDatabase();
  await writeProductsToDatabase();
  renderDashboardOverview();
  syncCategoryDropdownOptions();

  cancelImport();

  triggerNotification("Transactions Synced", `Successfully loaded and compiled ${itemsSynced} product profiles into active inventory database.`);
}
