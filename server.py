from flask import Flask, jsonify, request, send_from_directory
import os
import csv
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB max payload for multiple 10MB base64 images

PORT = int(os.environ.get("PORT", 8000))

CATEGORIES_CSV = os.path.join(BASE_DIR, 'categories.csv')
PRODUCTS_CSV = os.path.join(BASE_DIR, 'products.csv')

SVG_TILES_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23292524'/><path d='M0 0 L100 100 M100 0 L0 100' stroke='%2344403c' stroke-width='1'/><rect x='10' y='10' width='80' height='80' fill='none' stroke='%23C41E1E' stroke-width='0.5'/><circle cx='50' cy='50' r='5' fill='%23C41E1E'/></svg>"
SVG_TILES_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e7e5e4'/><rect x='5' y='5' width='42' height='42' fill='%2378716c'/><rect x='53' y='5' width='42' height='42' fill='%23a8a29e'/><rect x='5' y='53' width='42' height='42' fill='%23d6d3d1'/><rect x='53' y='53' width='42' height='42' fill='%2357534e'/></svg>"
SVG_SANITARY_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f5f5f4'/><ellipse cx='50' cy='45' rx='35' ry='25' fill='white' stroke='%2378716c' stroke-width='2'/><ellipse cx='50' cy='45' rx='25' ry='15' fill='none' stroke='%23a8a29e' stroke-width='1'/><circle cx='50' cy='45' r='3' fill='%23292524'/><rect x='42' y='70' width='16' height='25' fill='%23d6d3d1' rx='4'/></svg>"
SVG_SANITARY_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23fafaf9'/><path d='M20 20 Q50 10 80 20 L75 80 Q50 90 25 80 Z' fill='white' stroke='%23a8a29e' stroke-width='2'/><circle cx='50' cy='30' r='4' fill='%23C41E1E'/></svg>"
SVG_FAUCET_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231c1917'/><path d='M35 80 L35 40 Q35 20 60 20 L65 20 L65 30 L60 30 Q45 30 45 40 L45 80 Z' fill='%23fafaf9' stroke='%23C41E1E' stroke-width='1'/><circle cx='50' cy='85' r='12' fill='%2378716c'/></svg>"
SVG_FAUCET_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23fafaf9'/><path d='M30 80 L40 30 Q45 15 70 20 L68 30 Q50 25 48 40 L48 80 Z' fill='%23a8a29e'/><circle cx='30' cy='30' r='8' fill='%23C41E1E'/></svg>"

SEED_CATEGORIES = [
  { 'id': 'cat-l1-tiles', 'name': 'Tiles', 'level': 1, 'parentId': None },
  { 'id': 'cat-l1-sanitary', 'name': 'Sanitary', 'level': 1, 'parentId': None },
  { 'id': 'cat-l1-faucet', 'name': 'Faucet', 'level': 1, 'parentId': None },
  { 'id': 'cat-l2-floor-tiles', 'name': 'Floor Tiles', 'level': 2, 'parentId': 'cat-l1-tiles' },
  { 'id': 'cat-l2-wall-tiles', 'name': 'Wall Tiles', 'level': 2, 'parentId': 'cat-l1-tiles' },
  { 'id': 'cat-l2-closets', 'name': 'Water Closets', 'level': 2, 'parentId': 'cat-l1-sanitary' },
  { 'id': 'cat-l2-basins', 'name': 'Wash Basins', 'level': 2, 'parentId': 'cat-l1-sanitary' },
  { 'id': 'cat-l2-mixers', 'name': 'Premium Mixers', 'level': 2, 'parentId': 'cat-l1-faucet' },
  { 'id': 'cat-l2-showers', 'name': 'Shower Systems', 'level': 2, 'parentId': 'cat-l1-faucet' },
  { 'id': 'cat-l3-tiles-600', 'name': '600x600', 'level': 3, 'parentId': 'cat-l2-floor-tiles' },
  { 'id': 'cat-l3-tiles-800', 'name': '800x800', 'level': 3, 'parentId': 'cat-l2-floor-tiles' },
  { 'id': 'cat-l3-tiles-wall-300', 'name': '300x600', 'level': 3, 'parentId': 'cat-l2-wall-tiles' },
  { 'id': 'cat-l3-closets-onepiece', 'name': 'One-Piece Closets', 'level': 3, 'parentId': 'cat-l2-closets' },
  { 'id': 'cat-l3-basins-tabletop', 'name': 'Tabletop Basins', 'level': 3, 'parentId': 'cat-l2-basins' },
  { 'id': 'cat-l3-mixers-basin', 'name': 'Basin Mixers', 'level': 3, 'parentId': 'cat-l2-mixers' },
  { 'id': 'cat-l3-showers-rain', 'name': 'Rain Shower Panels', 'level': 3, 'parentId': 'cat-l2-showers' }
]

SEED_PRODUCTS = [
  {
    'productId': 'T-1011',
    'name': 'Carrara Gold Premium',
    'l1': 'cat-l1-tiles',
    'l2': 'cat-l2-floor-tiles',
    'l3': 'cat-l3-tiles-600',
    'stock': 320,
    'stockA': 320,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'Double-charged, premium vitrified floor tile mirroring deep, natural Carrara marble patterns. Polished with scratch-resistant glazes.',
    'images': [SVG_TILES_1, SVG_TILES_2]
  },
  {
    'productId': 'T-1012',
    'name': 'Basaltina Slate Dark',
    'l1': 'cat-l1-tiles',
    'l2': 'cat-l2-floor-tiles',
    'l3': 'cat-l3-tiles-800',
    'stock': 14,
    'stockA': 14,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'Large architectural floor slab matching natural grey volcanic basalt rock. Perfect for heavy traffic showrooms.',
    'images': [SVG_TILES_2, SVG_TILES_1]
  },
  {
    'productId': 'S-2011',
    'name': 'Monolith Silent WC',
    'l1': 'cat-l1-sanitary',
    'l2': 'cat-l2-closets',
    'l3': 'cat-l3-closets-onepiece',
    'stock': 45,
    'stockA': 45,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'One-piece, ultra-efficient siphon jet flushing closet, integrated silently with nanoglaze anti-stain bowl protection.',
    'images': [SVG_SANITARY_1, SVG_SANITARY_2]
  },
  {
    'productId': 'S-2012',
    'name': 'Aura Marble Bowl',
    'l1': 'cat-l1-sanitary',
    'l2': 'cat-l2-basins',
    'l3': 'cat-l3-basins-tabletop',
    'stock': 8,
    'stockA': 8,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'Luxury tabletop wash basin formed using composite marble resins, smooth stain-resistant interior curves.',
    'images': [SVG_SANITARY_2, SVG_SANITARY_1]
  },
  {
    'productId': 'F-3011',
    'name': 'Cascade Gold Basin Mixer',
    'l1': 'cat-l1-faucet',
    'l2': 'cat-l2-mixers',
    'l3': 'cat-l3-mixers-basin',
    'stock': 125,
    'stockA': 125,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'Sculptured basin mixer constructed from solid brass. Electroplated using multi-layered premium warm gold elements.',
    'images': [SVG_FAUCET_1, SVG_FAUCET_2]
  },
  {
    'productId': 'F-3012',
    'name': 'Thermostat Multi Rain',
    'l1': 'cat-l1-faucet',
    'l2': 'cat-l2-showers',
    'l3': 'cat-l3-showers-rain',
    'stock': 62,
    'stockA': 62,
    'stockB': 0,
    'stockC': 0,
    'stockD': 0,
    'desc': 'Smart, thermostatic multi-spray overhead panel with hand-held accessories. Sleek dark-slate electroplate casing.',
    'images': [SVG_FAUCET_2, SVG_FAUCET_1]
  }
]

def load_categories():
    if not os.path.exists(CATEGORIES_CSV):
        return None
    categories = []
    with open(CATEGORIES_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            categories.append({
                'id': row['id'],
                'name': row['name'],
                'level': int(row['level']),
                'parentId': row['parentId'] if row['parentId'] else None
            })
    return categories

def save_categories(categories):
    with open(CATEGORIES_CSV, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name', 'level', 'parentId'])
        writer.writeheader()
        for cat in categories:
            writer.writerow({
                'id': cat['id'],
                'name': cat['name'],
                'level': cat['level'],
                'parentId': cat['parentId'] if cat.get('parentId') is not None else ''
            })

def load_products():
    if not os.path.exists(PRODUCTS_CSV):
        return None
    products = []
    with open(PRODUCTS_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            images = []
            if row.get('images'):
                try:
                    images = json.loads(row['images'])
                except Exception:
                    images = [row['images']] if row['images'] else []
            
            # Read batch stocks, fallback to total stock/0
            stock = int(row['stock']) if row.get('stock') else 0
            stockA = int(row['stockA']) if 'stockA' in row and row['stockA'] else stock
            stockB = int(row['stockB']) if 'stockB' in row and row['stockB'] else 0
            stockC = int(row['stockC']) if 'stockC' in row and row['stockC'] else 0
            stockD = int(row['stockD']) if 'stockD' in row and row['stockD'] else 0
            
            products.append({
                'productId': row['productId'],
                'name': row['name'],
                'l1': row['l1'],
                'l2': row['l2'],
                'l3': row['l3'],
                'stock': stockA + stockB + stockC + stockD,
                'stockA': stockA,
                'stockB': stockB,
                'stockC': stockC,
                'stockD': stockD,
                'desc': row.get('desc', ''),
                'link': row.get('link', ''),
                'images': images
            })
    return products

def save_products(products):
    with open(PRODUCTS_CSV, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['productId', 'name', 'l1', 'l2', 'l3', 'stock', 'stockA', 'stockB', 'stockC', 'stockD', 'desc', 'link', 'images'])
        writer.writeheader()
        for prod in products:
            stockA = int(prod.get('stockA', prod.get('stock', 0)))
            stockB = int(prod.get('stockB', 0))
            stockC = int(prod.get('stockC', 0))
            stockD = int(prod.get('stockD', 0))
            writer.writerow({
                'productId': prod['productId'],
                'name': prod['name'],
                'l1': prod['l1'],
                'l2': prod['l2'],
                'l3': prod['l3'],
                'stock': stockA + stockB + stockC + stockD,
                'stockA': stockA,
                'stockB': stockB,
                'stockC': stockC,
                'stockD': stockD,
                'desc': prod.get('desc', ''),
                'link': prod.get('link', ''),
                'images': json.dumps(prod.get('images', []))
            })

# Seed immediately on startup if files don't exist
if not os.path.exists(CATEGORIES_CSV):
    save_categories(SEED_CATEGORIES)
if not os.path.exists(PRODUCTS_CSV):
    save_products(SEED_PRODUCTS)

# Maintain in-memory products and set of original product IDs
IN_MEMORY_PRODUCTS = load_products()
if IN_MEMORY_PRODUCTS is None:
    IN_MEMORY_PRODUCTS = SEED_PRODUCTS.copy()

INITIAL_PRODUCT_IDS = {prod['productId'] for prod in IN_MEMORY_PRODUCTS}

@app.route('/')
def index_route():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/admin.html')
def admin_route():
    return send_from_directory(BASE_DIR, 'admin.html')

@app.route('/api/categories', methods=['GET', 'POST', 'OPTIONS'])
def categories_api():
    if request.method == 'OPTIONS':
        return '', 200
    if request.method == 'GET':
        categories = load_categories()
        if categories is None:
            categories = SEED_CATEGORIES
            save_categories(categories)
        return jsonify(categories)
    elif request.method == 'POST':
        try:
            categories = request.get_json()
            save_categories(categories)
            return jsonify({'status': 'success'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/products', methods=['GET', 'POST', 'OPTIONS'])
def products_api():
    global IN_MEMORY_PRODUCTS
    if request.method == 'OPTIONS':
        return '', 200
    if request.method == 'GET':
        return jsonify(IN_MEMORY_PRODUCTS)
    elif request.method == 'POST':
        try:
            IN_MEMORY_PRODUCTS = request.get_json()
            save_products(IN_MEMORY_PRODUCTS)
            return jsonify({'status': 'success'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(BASE_DIR, path)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    print(f"Starting Flask server on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=False)
