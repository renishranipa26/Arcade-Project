/* ============================================
   ARCED CERAMIC — SHARED DATA LAYER
   SVG assets, seed data, localStorage helpers,
   notification system, and shared utilities.
   Used by both admin.js and user.js.
   ============================================ */

// ==========================================
// INLINE SVG DATA-URI PLACEHOLDERS
// ==========================================
const SVG_TILES_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23292524'/><path d='M0 0 L100 100 M100 0 L0 100' stroke='%2344403c' stroke-width='1'/><rect x='10' y='10' width='80' height='80' fill='none' stroke='%23C41E1E' stroke-width='0.5'/><circle cx='50' cy='50' r='5' fill='%23C41E1E'/></svg>";
const SVG_TILES_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e7e5e4'/><rect x='5' y='5' width='42' height='42' fill='%2378716c'/><rect x='53' y='5' width='42' height='42' fill='%23a8a29e'/><rect x='5' y='53' width='42' height='42' fill='%23d6d3d1'/><rect x='53' y='53' width='42' height='42' fill='%2357534e'/></svg>";
const SVG_SANITARY_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f5f5f4'/><ellipse cx='50' cy='45' rx='35' ry='25' fill='white' stroke='%2378716c' stroke-width='2'/><ellipse cx='50' cy='45' rx='25' ry='15' fill='none' stroke='%23a8a29e' stroke-width='1'/><circle cx='50' cy='45' r='3' fill='%23292524'/><rect x='42' y='70' width='16' height='25' fill='%23d6d3d1' rx='4'/></svg>";
const SVG_SANITARY_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23fafaf9'/><path d='M20 20 Q50 10 80 20 L75 80 Q50 90 25 80 Z' fill='white' stroke='%23a8a29e' stroke-width='2'/><circle cx='50' cy='30' r='4' fill='%23C41E1E'/></svg>";
const SVG_FAUCET_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231c1917'/><path d='M35 80 L35 40 Q35 20 60 20 L65 20 L65 30 L60 30 Q45 30 45 40 L45 80 Z' fill='%23fafaf9' stroke='%23C41E1E' stroke-width='1'/><circle cx='50' cy='85' r='12' fill='%2378716c'/></svg>";
const SVG_FAUCET_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23fafaf9'/><path d='M30 80 L40 30 Q45 15 70 20 L68 30 Q50 25 48 40 L48 80 Z' fill='%23a8a29e'/><circle cx='30' cy='30' r='8' fill='%23C41E1E'/></svg>";

// ==========================================
// SEED DATA (First-run defaults)
// ==========================================
const SEED_CATEGORIES = [
  // Level 1 Nodes
  { id: 'cat-l1-tiles', name: 'Tiles', level: 1, parentId: null },
  { id: 'cat-l1-sanitary', name: 'Sanitary', level: 1, parentId: null },
  { id: 'cat-l1-faucet', name: 'Faucet', level: 1, parentId: null },

  // Level 2 Nodes (Tiles subcategories)
  { id: 'cat-l2-floor-tiles', name: 'Floor Tiles', level: 2, parentId: 'cat-l1-tiles' },
  { id: 'cat-l2-wall-tiles', name: 'Wall Tiles', level: 2, parentId: 'cat-l1-tiles' },
  // Level 2 Nodes (Sanitary subcategories)
  { id: 'cat-l2-closets', name: 'Water Closets', level: 2, parentId: 'cat-l1-sanitary' },
  { id: 'cat-l2-basins', name: 'Wash Basins', level: 2, parentId: 'cat-l1-sanitary' },
  // Level 2 Nodes (Faucet subcategories)
  { id: 'cat-l2-mixers', name: 'Premium Mixers', level: 2, parentId: 'cat-l1-faucet' },
  { id: 'cat-l2-showers', name: 'Shower Systems', level: 2, parentId: 'cat-l1-faucet' },

  // Level 3 Nodes (Tiles)
  { id: 'cat-l3-tiles-600', name: '600x600', level: 3, parentId: 'cat-l2-floor-tiles' },
  { id: 'cat-l3-tiles-800', name: '800x800', level: 3, parentId: 'cat-l2-floor-tiles' },
  { id: 'cat-l3-tiles-wall-300', name: '300x600', level: 3, parentId: 'cat-l2-wall-tiles' },
  // Level 3 Nodes (Sanitary)
  { id: 'cat-l3-closets-onepiece', name: 'One-Piece Closets', level: 3, parentId: 'cat-l2-closets' },
  { id: 'cat-l3-basins-tabletop', name: 'Tabletop Basins', level: 3, parentId: 'cat-l2-basins' },
  // Level 3 Nodes (Faucets)
  { id: 'cat-l3-mixers-basin', name: 'Basin Mixers', level: 3, parentId: 'cat-l2-mixers' },
  { id: 'cat-l3-showers-rain', name: 'Rain Shower Panels', level: 3, parentId: 'cat-l2-showers' }
];

const SEED_PRODUCTS = [
  {
    productId: 'T-1011',
    name: 'Carrara Gold Premium',
    l1: 'cat-l1-tiles',
    l2: 'cat-l2-floor-tiles',
    l3: 'cat-l3-tiles-600',
    stock: 320,
    stockA: 320,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'Double-charged, premium vitrified floor tile mirroring deep, natural Carrara marble patterns. Polished with scratch-resistant glazes.',
    images: [SVG_TILES_1, SVG_TILES_2]
  },
  {
    productId: 'T-1012',
    name: 'Basaltina Slate Dark',
    l1: 'cat-l1-tiles',
    l2: 'cat-l2-floor-tiles',
    l3: 'cat-l3-tiles-800',
    stock: 14,
    stockA: 14,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'Large architectural floor slab matching natural grey volcanic basalt rock. Perfect for heavy traffic showrooms.',
    images: [SVG_TILES_2, SVG_TILES_1]
  },
  {
    productId: 'S-2011',
    name: 'Monolith Silent WC',
    l1: 'cat-l1-sanitary',
    l2: 'cat-l2-closets',
    l3: 'cat-l3-closets-onepiece',
    stock: 45,
    stockA: 45,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'One-piece, ultra-efficient siphon jet flushing closet, integrated silently with nanoglaze anti-stain bowl protection.',
    images: [SVG_SANITARY_1, SVG_SANITARY_2]
  },
  {
    productId: 'S-2012',
    name: 'Aura Marble Bowl',
    l1: 'cat-l1-sanitary',
    l2: 'cat-l2-basins',
    l3: 'cat-l3-basins-tabletop',
    stock: 8,
    stockA: 8,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'Luxury tabletop wash basin formed using composite marble resins, smooth stain-resistant interior curves.',
    images: [SVG_SANITARY_2, SVG_SANITARY_1]
  },
  {
    productId: 'F-3011',
    name: 'Cascade Gold Basin Mixer',
    l1: 'cat-l1-faucet',
    l2: 'cat-l2-mixers',
    l3: 'cat-l3-mixers-basin',
    stock: 125,
    stockA: 125,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'Sculptured basin mixer constructed from solid brass. Electroplated using multi-layered premium warm gold elements.',
    images: [SVG_FAUCET_1, SVG_FAUCET_2]
  },
  {
    productId: 'F-3012',
    name: 'Thermostat Multi Rain',
    l1: 'cat-l1-faucet',
    l2: 'cat-l2-showers',
    l3: 'cat-l3-showers-rain',
    stock: 62,
    stockA: 62,
    stockB: 0,
    stockC: 0,
    stockD: 0,
    desc: 'Smart, thermostatic multi-spray overhead panel with hand-held accessories. Sleek dark-slate electroplate casing.',
    images: [SVG_FAUCET_2, SVG_FAUCET_1]
  }
];

// ==========================================
// IN-MEMORY DATA STORES
// ==========================================
let products = [];
let categories = [];

// ==========================================
// LOCALSTORAGE HELPERS & API ENDPOINTS
// ==========================================
async function initializeDatabase() {
  await loadFromDatabase();
}

async function loadFromDatabase() {
  try {
    const resCats = await fetch('/api/categories');
    if (!resCats.ok) throw new Error("Failed to fetch categories");
    const serverCats = await resCats.json();
    categories = serverCats;
    localStorage.setItem('arcade_categories', JSON.stringify(categories));

    const resProds = await fetch('/api/products');
    if (!resProds.ok) throw new Error("Failed to fetch products");
    const serverProds = await resProds.json();
    products = serverProds.map(p => {
      const stock = parseInt(p.stock || 0);
      const stockA = p.stockA !== undefined ? parseInt(p.stockA) : stock;
      const stockB = p.stockB !== undefined ? parseInt(p.stockB) : 0;
      const stockC = p.stockC !== undefined ? parseInt(p.stockC) : 0;
      const stockD = p.stockD !== undefined ? parseInt(p.stockD) : 0;
      return {
        ...p,
        stock: stockA + stockB + stockC + stockD,
        stockA,
        stockB,
        stockC,
        stockD
      };
    });
    localStorage.setItem('arcade_products', JSON.stringify(products));
  } catch (err) {
    console.warn("Backend CSV server offline or failed, falling back to local storage cache:", err);
    if (!localStorage.getItem('arcade_categories')) {
      localStorage.setItem('arcade_categories', JSON.stringify(SEED_CATEGORIES));
    }
    if (!localStorage.getItem('arcade_products')) {
      localStorage.setItem('arcade_products', JSON.stringify(SEED_PRODUCTS));
    }
    categories = JSON.parse(localStorage.getItem('arcade_categories')) || [];
    const localProds = JSON.parse(localStorage.getItem('arcade_products')) || [];
    products = localProds.map(p => {
      const stock = parseInt(p.stock || 0);
      const stockA = p.stockA !== undefined ? parseInt(p.stockA) : stock;
      const stockB = p.stockB !== undefined ? parseInt(p.stockB) : 0;
      const stockC = p.stockC !== undefined ? parseInt(p.stockC) : 0;
      const stockD = p.stockD !== undefined ? parseInt(p.stockD) : 0;
      return {
        ...p,
        stock: stockA + stockB + stockC + stockD,
        stockA,
        stockB,
        stockC,
        stockD
      };
    });
  }
}

async function writeCategoriesToDatabase() {
  localStorage.setItem('arcade_categories', JSON.stringify(categories));
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categories)
    });
    if (!res.ok) throw new Error("Server rejected save");
  } catch (err) {
    console.error("Failed to persist categories to server:", err);
  }
}

async function writeProductsToDatabase() {
  localStorage.setItem('arcade_products', JSON.stringify(products));
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });
    if (!res.ok) throw new Error("Server rejected save");
  } catch (err) {
    console.error("Failed to persist products to server:", err);
  }
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
function triggerNotification(title, msg, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const card = document.createElement('div');

  const config = {
    success: { bg: 'bg-white', border: 'border-green-200', text: 'text-green-800', icon: 'fa-circle-check text-green-500' },
    warning: { bg: 'bg-white', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'fa-circle-exclamation text-yellow-500' },
    error: { bg: 'bg-white', border: 'border-red-200', text: 'text-red-800', icon: 'fa-circle-xmark text-red-500' }
  };

  const style = config[type] || config.success;

  card.className = `pointer-events-auto p-4 rounded-xl border ${style.bg} ${style.border} flex items-start gap-3 shadow-xl transition-all-300 transform translate-x-10 opacity-0`;
  card.innerHTML = `
    <div class="text-lg mt-0.5"><i class="fa-solid ${style.icon}"></i></div>
    <div class="flex-grow">
      <h4 class="text-xs font-extrabold uppercase tracking-wider ${style.text}">${title}</h4>
      <p class="text-[11px] text-luxury-500 mt-0.5 leading-normal">${msg}</p>
    </div>
  `;

  container.appendChild(card);

  // Animate entry
  setTimeout(() => {
    card.classList.remove('translate-x-10', 'opacity-0');
  }, 50);

  // Dismiss timer
  setTimeout(() => {
    card.classList.add('translate-x-10', 'opacity-0');
    setTimeout(() => card.remove(), 300);
  }, 4000);
}

// ==========================================
// SHARED UTILITY FUNCTIONS
// ==========================================
function getCategoryIcon(name) {
  if (name.toLowerCase().includes('tile')) return 'fa-grip';
  if (name.toLowerCase().includes('sanitary')) return 'fa-sink';
  if (name.toLowerCase().includes('faucet')) return 'fa-faucet';
  return 'fa-layer-group';
}

function getL3Count(l3Id) {
  return products.filter(p => p.l3 === l3Id).length;
}

function getBreadcrumbStringShort(p) {
  const parent1 = categories.find(c => c.id === p.l1);
  const parent3 = categories.find(c => c.id === p.l3);
  if (parent1 && parent3) {
    return `${parent1.name} / ${parent3.name}`;
  }
  return 'Premium Range';
}

// AUTO-RESOLVE CATEGORY SYSTEM PATTERNS (used by import engine)
function autoResolveHierarchyPaths(l1Name, l2Name, l3Name) {
  let l1 = categories.find(c => c.level === 1 && c.name.toLowerCase() === l1Name.toLowerCase());
  if (!l1) {
    const newId = `cat-auto-l1-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    l1 = { id: newId, name: l1Name, level: 1, parentId: null };
    categories.push(l1);
  }

  let l2 = categories.find(c => c.level === 2 && c.parentId === l1.id && c.name.toLowerCase() === l2Name.toLowerCase());
  if (!l2) {
    const newId = `cat-auto-l2-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    l2 = { id: newId, name: l2Name, level: 2, parentId: l1.id };
    categories.push(l2);
  }

  let l3 = categories.find(c => c.level === 3 && c.parentId === l2.id && c.name.toLowerCase() === l3Name.toLowerCase());
  if (!l3) {
    const newId = `cat-auto-l3-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    l3 = { id: newId, name: l3Name, level: 3, parentId: l2.id };
    categories.push(l3);
  }

  return { l1: l1.id, l2: l2.id, l3: l3.id };
}
