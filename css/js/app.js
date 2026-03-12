// Main Application Logic
async initialize() {

    try {

        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (!hasCamera) {
            throw new Error("No camera found");
        }

        this.scanner = new Html5Qrcode("reader");

        return true;

    } catch (error) {

        console.error(error);

        return false;

    }

}


     // Language switcher
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                setLanguage(lang);
                this.updateLanguageActiveState();
            });
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', 
            debounce(this.handleSearch.bind(this), 500)
        );

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            sheetsAPI.exportToCSV();
        });

        // Product form
        document.getElementById('productForm').addEventListener('submit', 
            this.handleAddProduct.bind(this)
        );

        // Scanner controls
        document.getElementById('startScanBtn').addEventListener('click', () => {
            this.startScanner();
        });

        document.getElementById('stopScanBtn').addEventListener('click', () => {
            this.stopScanner();
        });

        // Online/Offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    initLanguageSupport() {
        setLanguage(currentLanguage);
        this.updateLanguageActiveState();
    }

    updateLanguageActiveState() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', lang === currentLanguage);
        });
    }

    async loadInitialData() {
        try {
            showLoading(true);
            
            // Try to load from cache first
            const cached = sheetsAPI.getLocalStorage('inventory');
            if (cached) {
                this.products = cached;
                this.renderInventory();
                this.updateDashboard();
            }

            // Then fetch fresh data
            this.products = await sheetsAPI.getAllProducts();
            this.renderInventory();
            this.updateDashboard();
            
            showLoading(false);
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast(t('connectionError'), 'error');
            showLoading(false);
        }
    }

    switchView(view) {
        // Update view classes
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        // Update hash
        window.location.hash = view;
        this.currentView = view;

        // Handle view-specific logic
        if (view === 'inventory') {
            this.renderInventory();
        } else if (view === 'dashboard') {
            this.updateDashboard();
        } else if (view === 'scanner') {
            // Initialize scanner when view is shown
            this.initScanner();
        }
    }

    initScanner() {
        if (!this.scanner) {
            this.scanner = new BarcodeScanner(
                this.handleScanSuccess.bind(this),
                this.handleScanError.bind(this)
            );
        }
    }

    async startScanner() {
        try {
            const initialized = await this.scanner.initialize();
            if (initialized) {
                await this.scanner.start();
            } else {
                showToast(t('cameraPermission'), 'error');
            }
        } catch (error) {
            console.error('Scanner start failed:', error);
            showToast(t('cameraPermission'), 'error');
        }
    }

    stopScanner() {
        if (this.scanner) {
            this.scanner.stop();
        }
    }

    async handleScanSuccess(barcode) {
        console.log('Scanned barcode:', barcode);
        
        // Show scanning result
        const resultDiv = document.getElementById('scanResult');
        resultDiv.innerHTML = `<div class="spinner"></div> ${t('scanning')}`;

        try {
            // Search for product
            const product = await sheetsAPI.getProductByBarcode(barcode);
            
            if (product) {
                // Product exists - increase quantity
                await this.updateProductQuantity(barcode, 1);
                resultDiv.innerHTML = `
                    <div class="success-message">
                        ✅ ${t('productFound')}: ${product['Product Name']}
                        <br>${t('quantity')}: ${product.Quantity + 1}
                    </div>
                `;
            } else {
                // Product doesn't exist - show add modal
                resultDiv.innerHTML = `
                    <div class="warning-message">
                        ⚠️ ${t('productNotFound')}
                    </div>
                `;
                this.showAddProductModal(barcode);
            }
        } catch (error) {
            console.error('Scan handling failed:', error);
            resultDiv.innerHTML = `
                <div class="error-message">
                    ❌ ${t('connectionError')}
                </div>
            `;
        }
    }

    handleScanError(error) {
        console.log('Scan error (ignored):', error);
    }

    showAddProductModal(barcode) {
        const modal = document.getElementById('productModal');
        document.getElementById('modalBarcode').value = barcode;
        document.getElementById('modalBarcodeDisplay').value = barcode;
        document.getElementById('productName').value = '';
        document.getElementById('initialQuantity').value = '0';
        document.getElementById('notes').value = '';
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    async handleAddProduct(e) {
        e.preventDefault();
        
        const productData = {
            barcode: document.getElementById('modalBarcode').value,
            productName: document.getElementById('productName').value,
            quantity: document.getElementById('initialQuantity').value,
            notes: document.getElementById('notes').value
        };

        try {
            await sheetsAPI.addProduct(productData);
            this.closeModal();
            await this.loadInitialData();
            showToast(t('addProduct') + ' ' + t('success'), 'success');
            
            // Switch to inventory view
            this.switchView('inventory');
        } catch (error) {
            console.error('Failed to add product:', error);
            showToast(t('connectionError'), 'error');
        }
    }

    async updateProductQuantity(barcode, change) {
        try {
            const result = await sheetsAPI.updateQuantity(barcode, change);
            
            if (result.success) {
                // Update local data
                const product = this.products.find(p => p.Barcode === barcode);
                if (product) {
                    product.Quantity = parseInt(product.Quantity) + change;
                }
                
                this.renderInventory();
                this.updateDashboard();
                showToast(`Quantity updated: ${change > 0 ? '+' : ''}${change}`, 'success');
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
            showToast(t('connectionError'), 'error');
        }
    }

    renderInventory() {
        const container = document.getElementById('inventoryList');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        let filteredProducts = this.products;
        if (searchTerm) {
            filteredProducts = this.products.filter(p => 
                (p['Product Name'] && p['Product Name'].toLowerCase().includes(searchTerm)) ||
                (p.Barcode && p.Barcode.toLowerCase().includes(searchTerm))
            );
        }

        if (filteredProducts.length === 0) {
            container.innerHTML = `<div class="no-products">${t('noProducts')}</div>`;
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="inventory-item ${product.Quantity <= 5 ? 'low-stock' : ''}">
                <div class="item-info">
                    <div class="item-name">${product['Product Name'] || 'Unknown'}</div>
                    <div class="item-barcode">${product.Barcode || 'No barcode'}</div>
                    <div class="item-quantity">${t('quantity')}: ${product.Quantity || 0}</div>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn decrease" onclick="app.updateProductQuantity('${product.Barcode}', -1)">−</button>
                    <button class="quantity-btn increase" onclick="app.updateProductQuantity('${product.Barcode}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }

    async handleSearch(e) {
        const query = e.target.value;
        
        if (query.length < 2) {
            this.renderInventory();
            return;
        }

        try {
            const results = await sheetsAPI.searchProducts(query);
            const container = document.getElementById('inventoryList');
            
            if (results.length === 0) {
                container.innerHTML = `<div class="no-products">${t('noProducts')}</div>`;
                return;
            }

            container.innerHTML = results.map(product => `
                <div class="inventory-item ${product.Quantity <= 5 ? 'low-stock' : ''}">
                    <div class="item-info">
                        <div class="item-name">${product['Product Name'] || 'Unknown'}</div>
                        <div class="item-barcode">${product.Barcode || 'No barcode'}</div>
                        <div class="item-quantity">${t('quantity')}: ${product.Quantity || 0}</div>
                    </div>
                    <div class="item-controls">
                        <button class="quantity-btn decrease" onclick="app.updateProductQuantity('${product.Barcode}', -1)">−</button>
                        <button class="quantity-btn increase" onclick="app.updateProductQuantity('${product.Barcode}', 1)">+</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    updateDashboard() {
        // Update stats
        document.getElementById('totalProducts').textContent = this.products.length;
        
        const lowStockCount = this.products.filter(p => p.Quantity <= 5).length;
        document.getElementById('lowStockCount').textContent = lowStockCount;

        // Update recent activity
        const activities = sheetsAPI.getRecentActivities();
        const activityList = document.getElementById('recentActivityList');
        
        if (activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity">No recent activity</div>';
            return;
        }

        activityList.innerHTML = activities.map(activity => {
            const time = new Date(activity.timestamp).toLocaleString();
            let description = '';
            
            switch(activity.type) {
                case 'add':
                    description = `➕ Added: ${activity.data.productName}`;
                    break;
                case 'update':
                    description = `📦 Updated: ${activity.data.barcode} (${activity.data.change > 0 ? '+' : ''}${activity.data.change})`;
                    break;
                case 'delete':
                    description = `🗑️ Deleted: ${activity.data.barcode}`;
                    break;
                default:
                    description = 'Unknown activity';
            }
            
            return `
                <div class="activity-item">
                    <div>${description}</div>
                    <div class="activity-time">${time}</div>
                </div>
            `;
        }).join('');
    }

    handleOnline() {
        updateConnectionStatus();
        sheetsAPI.syncOfflineData();
    }

    handleOffline() {
        updateConnectionStatus();
        showToast(t('offlineMode'), 'warning');
    }

    initPWAInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install banner
            const banner = document.createElement('div');
            banner.className = 'pwa-install-banner';
            banner.innerHTML = `
                <span>📱 ${t('installApp')}</span>
                <button class="install-btn">${t('installApp')}</button>
            `;
            
            document.querySelector('.app-header').after(banner);
            
            banner.querySelector('button').addEventListener('click', async () => {
                banner.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install outcome:', outcome);
                deferredPrompt = null;
            });
        });
    }
}

const scanner = new BarcodeScanner(
    (barcode) => {
        console.log("Scanned:", barcode);
    },
    (error) => {
        console.log("Scan error:", error);
    }
);

await scanner.initialize();

document.getElementById("startScanBtn").onclick = () => {
    scanner.start();
};

document.getElementById("stopScanBtn").onclick = () => {
    scanner.stop();
};





// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(show) {
    let loader = document.getElementById('global-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'spinner';
            document.body.appendChild(loader);
        }
    } else if (loader) {
        loader.remove();
    }
}

function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (navigator.onLine) {
        statusEl.textContent = '● Online';
        statusEl.className = 'connection-status online';
    } else {
        statusEl.textContent = '● Offline';
        statusEl.className = 'connection-status offline';
    }
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Initialize the app
const app = new InventoryApp();

// Make app global for onclick handlers
window.app = app;
window.closeModal = closeModal;
