// Internationalization Module
const translations = {
    en: {
        appTitle: 'Inventory Scanner',
        dashboard: 'Dashboard',
        inventory: 'Inventory',
        scanner: 'Scanner',
        totalProducts: 'Total Products',
        lowStock: 'Low Stock',
        recentActivity: 'Recent Activity',
        searchPlaceholder: 'Search products...',
        export: 'Export CSV',
        startScan: 'Start Scanning',
        stopScan: 'Stop Scanning',
        addProduct: 'Add Product',
        barcode: 'Barcode',
        productName: 'Product Name',
        initialQuantity: 'Initial Quantity',
        notes: 'Notes',
        cancel: 'Cancel',
        save: 'Save',
        scanBarcode: 'Scan Barcode',
        quantity: 'Quantity',
        lastUpdated: 'Last Updated',
        lowStockWarning: 'Low Stock Warning',
        productFound: 'Product Found',
        productNotFound: 'Product Not Found',
        enterProductDetails: 'Enter Product Details',
        scanning: 'Scanning...',
        cameraPermission: 'Camera Permission Required',
        connectionError: 'Connection Error',
        syncComplete: 'Sync Complete',
        offlineMode: 'Offline Mode',
        onlineMode: 'Online Mode',
        installApp: 'Install App',
        scanButton: 'Scan',
        addButton: 'Add',
        removeButton: 'Remove',
        searchButton: 'Search',
        recentScans: 'Recent Scans',
        noProducts: 'No products found',
        loading: 'Loading...'
    },
    vi: {
        appTitle: 'Quét Mã Vạch Kho Hàng',
        dashboard: 'Tổng Quan',
        inventory: 'Kho Hàng',
        scanner: 'Quét Mã',
        totalProducts: 'Tổng Sản Phẩm',
        lowStock: 'Sắp Hết Hàng',
        recentActivity: 'Hoạt Động Gần Đây',
        searchPlaceholder: 'Tìm kiếm sản phẩm...',
        export: 'Xuất CSV',
        startScan: 'Bắt Đầu Quét',
        stopScan: 'Dừng Quét',
        addProduct: 'Thêm Sản Phẩm',
        barcode: 'Mã Vạch',
        productName: 'Tên Sản Phẩm',
        initialQuantity: 'Số Lượng Ban Đầu',
        notes: 'Ghi Chú',
        cancel: 'Hủy',
        save: 'Lưu',
        scanBarcode: 'Quét Mã Vạch',
        quantity: 'Số Lượng',
        lastUpdated: 'Cập Nhật Lần Cuối',
        lowStockWarning: 'Cảnh Báo Hàng Sắp Hết',
        productFound: 'Đã Tìm Thấy Sản Phẩm',
        productNotFound: 'Không Tìm Thấy Sản Phẩm',
        enterProductDetails: 'Nhập Thông Tin Sản Phẩm',
        scanning: 'Đang quét...',
        cameraPermission: 'Yêu Cầu Quyền Camera',
        connectionError: 'Lỗi Kết Nối',
        syncComplete: 'Đồng Bộ Hoàn Tất',
        offlineMode: 'Chế Độ Ngoại Tuyến',
        onlineMode: 'Chế Độ Trực Tuyến',
        installApp: 'Cài Đặt Ứng Dụng',
        scanButton: 'Quét',
        addButton: 'Thêm',
        removeButton: 'Xóa',
        searchButton: 'Tìm',
        recentScans: 'Lượt Quét Gần Đây',
        noProducts: 'Không tìm thấy sản phẩm',
        loading: 'Đang tải...'
    }
};

let currentLanguage = 'en';

function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        updateUILanguage();
        localStorage.setItem('preferredLanguage', lang);
    }
}

function updateUILanguage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

// Initialize language from localStorage
const savedLanguage = localStorage.getItem('preferredLanguage');
if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
}