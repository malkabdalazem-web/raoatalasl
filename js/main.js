/*
  Rawat Alasal Tech Tricks - Main Logic
  - Shared helpers
  - Mobile Menu
  - Admin State Management
*/

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.innerHTML = navMenu.classList.contains('active') ? '&#10005;' : '&#9776;';
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.innerHTML = '&#9776;';
        }));
    }

    // Check Admin Status
    checkAdminStatus();

    // Highlight Active Link
    highlightActiveLink();
});

function checkAdminStatus() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminElements = document.querySelectorAll('.admin-only');
    const adminBadge = document.getElementById('admin-badge');

    if (isAdmin) {
        // Show admin controls
        adminElements.forEach(el => el.classList.remove('hidden'));

        // Add Admin Badge if not exists
        if (!adminBadge) {
            const badge = document.createElement('div');
            badge.id = 'admin-badge';
            badge.innerHTML = `
                <span>وضع الأدمن مفعل</span>
                <button onclick="logoutAdmin()" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer; text-decoration:underline;">خروج</button>
            `;
            document.body.appendChild(badge);
        }
    } else {
        // Hide admin controls
        adminElements.forEach(el => el.classList.add('hidden'));
        if (adminBadge) adminBadge.remove();
    }
}

function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج من وضع الأدمن؟')) {
        localStorage.removeItem('isAdmin');
        window.location.reload();
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Data Helpers
// IndexedDB Wrapper
const DB_NAME = 'RawatAlasalDB';
const DB_VERSION = 1;

const DB = {
    open: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject(event.target.error);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('orders')) {
                    db.createObjectStore('orders', { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => resolve(event.target.result);
        });
    },
    getAll: async (storeName) => {
        const db = await DB.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },
    save: async (storeName, item) => {
        const db = await DB.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },
    delete: async (storeName, id) => {
        const db = await DB.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },
    clear: async (storeName) => {
        const db = await DB.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
};

// Data Helpers (Async now)
const Storage = {
    getProducts: async () => {
        // Migrate from localStorage if exists
        const local = localStorage.getItem('products');
        if (local) {
            try {
                const products = JSON.parse(local);
                if (Array.isArray(products) && products.length > 0) {
                    for (const p of products) await DB.save('products', p);
                }
                localStorage.removeItem('products');
            } catch (e) {
                console.error("Migration error", e);
            }
        }
        return await DB.getAll('products');
    },
    saveProduct: async (product) => await DB.save('products', product),
    deleteProduct: async (id) => await DB.delete('products', id),
    clearProducts: async () => await DB.clear('products'),

    getOrders: async () => {
        // Migrate orders
        const local = localStorage.getItem('orders');
        if (local) {
            try {
                const orders = JSON.parse(local);
                if (Array.isArray(orders) && orders.length > 0) {
                    for (const o of orders) await DB.save('orders', o);
                }
                localStorage.removeItem('orders');
            } catch (e) {
                console.error("Migration error", e);
            }
        }
        return await DB.getAll('orders');
    },
    saveOrder: async (order) => await DB.save('orders', order),
    deleteOrder: async (id) => await DB.delete('orders', id)
};

// Image to Base64 Helper
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/* Whatsapp Helper */
const WhatsApp = {
    PHONE: '9647713390381',
    open: (message) => {
        const url = `https://wa.me/${WhatsApp.PHONE}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
};
