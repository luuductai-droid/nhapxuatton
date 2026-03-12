// Google Sheets API Integration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbJIf4wz7Gec8KFzQov3COnKxqpZYxLGeO6g-vkkYLJz5mpt4-pgUH-rLQKCzjlslM2g/exec';

class GoogleSheetsAPI {
    constructor() {
        this.cache = new Map();
        this.pendingOperations = [];
        this.isOnline = navigator.onLine;
        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
            updateConnectionStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            updateConnectionStatus();
        });
    }

    async request(action, params = {}) {
        const url = new URL(GOOGLE_APPS_SCRIPT_URL);
        url.searchParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Store operation for offline sync
            if (!this.isOnline) {
                this.pendingOperations.push({
                    action,
                    params,
                    timestamp: Date.now()
                });
                this.savePendingOperations();
                return { success: true, offline: true };
            }
            
            throw error;
        }
    }

    async getAllProducts() {
        const cacheKey = 'allProducts';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const result = await this.request('getAll');
        
        if (result.success) {
            this.cache.set(cacheKey, result.data);
            this.saveToLocalStorage('inventory', result.data);
        }
        
        return result.data || [];
    }

    async getProductByBarcode(barcode) {
        // Check cache first
        const allProducts = this.cache.get('allProducts') || [];
        const cachedProduct = allProducts.find(p => p.Barcode === barcode);
        
        if (cachedProduct) {
            return cachedProduct;
        }
        
        const result = await this.request('getByBarcode', { barcode });
        return result.data;
    }

    async addProduct(productData) {
        const result = await this.request('addProduct', productData);
        
        if (result.success) {
            // Invalidate cache
            this.cache.delete('allProducts');
            await this.logActivity('add', productData);
        }
        
        return result;
    }

    async updateQuantity(barcode, change) {
        const result = await this.request('updateQuantity', {
            barcode,
            change: change.toString()
        });
        
        if (result.success) {
            // Invalidate cache
            this.cache.delete('allProducts');
            await this.logActivity('update', { barcode, change });
        }
        
        return result;
    }

    async searchProducts(query) {
        const result = await this.request('search', { query });
        return result.data || [];
    }

    async deleteProduct(barcode) {
        const result = await this.request('deleteProduct', { barcode });
        
        if (result.success) {
            this.cache.delete('allProducts');
            await this.logActivity('delete', { barcode });
        }
        
        return result;
    }

    async logActivity(type, data) {
        const activities = this.getLocalStorage('activities') || [];
        activities.unshift({
            type,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.pop();
        }
        
        this.saveToLocalStorage('activities', activities);
    }

    getRecentActivities(limit = 10) {
        const activities = this.getLocalStorage('activities') || [];
        return activities.slice(0, limit);
    }

    // Local Storage helpers
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`inventory_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    getLocalStorage(key) {
        try {
            const data = localStorage.getItem(`inventory_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    }

    savePendingOperations() {
        this.saveToLocalStorage('pending_ops', this.pendingOperations);
    }

    async syncOfflineData() {
        const pendingOps = this.getLocalStorage('pending_ops') || [];
        
        for (const op of pendingOps) {
            try {
                await this.request(op.action, op.params);
            } catch (error) {
                console.error('Failed to sync operation:', error);
            }
        }
        
        this.pendingOperations = [];
        this.savePendingOperations();
        
        // Refresh data
        await this.getAllProducts();
        showToast(t('syncComplete'));
    }

    async exportToCSV() {
        const products = await this.getAllProducts();
        
        if (!products || products.length === 0) {
            showToast('No data to export');
            return;
        }
        
        const headers = ['Barcode', 'Product Name', 'Quantity', 'Last Updated', 'Notes'];
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add data rows
        for (const product of products) {
            const row = [
                `"${product.Barcode || ''}"`,
                `"${product['Product Name'] || ''}"`,
                product.Quantity || 0,
                `"${product['Last Updated'] || ''}"`,
                `"${product.Notes || ''}"`
            ];
            csvRows.push(row.join(','));
        }
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast('Export completed');
    }
}

// Initialize the API
const sheetsAPI = new GoogleSheetsAPI();
