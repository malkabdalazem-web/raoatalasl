/*
  Rawat Alasal Tech Tricks - Products Logic
  - CRUD Products
  - Filtering
  - Booking Integration
*/

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupFilters();
    setupAdminActions();
});

let currentProducts = [];
let editingId = null;

async function loadProducts() {
    try {
        currentProducts = await Storage.getProducts();

        // Seed data if empty
        if (currentProducts.length === 0) {
            await seedData();
            currentProducts = await Storage.getProducts();
        }

        // Ensure Specific Care Product Exists (User Request)
        const careSetId = 'care-set-1';
        if (!currentProducts.some(p => p.id === careSetId)) {
            const careProduct = {
                id: careSetId,
                title: 'مجموعة العناية المتكاملة',
                category: 'مجموعة العناية',
                desc: 'مجموعة متكاملة للعناية بالبشرة، تحتوي على غسول، سيروم، كريم ليلي ونهاري لترطيب ونضارة فائقة.',
                imageDataUrl: 'assets/care_collection_set.png',
                createdAt: new Date().toISOString()
            };
            await Storage.saveProduct(careProduct);
            currentProducts = await Storage.getProducts();
        }
    } catch (e) {
        console.error("Failed to load products", e);
        currentProducts = [];
    }
    renderProducts(currentProducts);
}

async function seedData() {
    const seeds = [
        {
            id: '1',
            title: 'كريم مرطب فاخر',
            category: 'كريمات',
            desc: 'كريم مرطب عميق للبشرة الجافة والحساسة، بخلاصة العسل.',
            imageDataUrl: '', // Placeholder will be used
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            title: 'سيروم للشعر',
            category: 'الشعر',
            desc: 'سيروم مغذي ومقوي لبصيلات الشعر.',
            imageDataUrl: '',
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            title: 'غسول الوجه الرغوي',
            category: 'غسول',
            desc: 'ينظف البشرة بعمق ويزيل الشوائب.',
            imageDataUrl: '',
            createdAt: new Date().toISOString()
        }
    ];

    for (const p of seeds) {
        await Storage.saveProduct(p);
    }
}

function setupFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            if (category === 'all') {
                renderProducts(currentProducts);
            } else {
                const filtered = currentProducts.filter(p => p.category === category);
                renderProducts(filtered);
            }
        });
    });
}

function renderProducts(products) {
    const container = document.getElementById('products-grid');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; width:100%;">لا توجد منتجات حالياً.</p>';
        return;
    }

    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';
        // Check if image exists, use placeholder if not
        const imgParams = product.imageDataUrl ? `src="${product.imageDataUrl}"` : 'style="background:#eee"';

        // Admin buttons
        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <div class="admin-actions">
                    <button class="btn btn-outline btn-sm" onclick="editProduct('${product.id}')">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">حذف</button>
                </div>
            `;
        }

        const whatsappMsg = `السلام عليكم 👋%0Aأريد حجز المنتج التالي:%0A📦 المنتج: ${encodeURIComponent(product.title)}%0A🧴 التصنيف: ${encodeURIComponent(product.category)}%0A—%0Aمرسل من موقع شركة روعة العسل`;

        card.innerHTML = `
            <img class="card-img" ${imgParams} alt="${product.title}">
            <div class="card-content">
                <div>
                    <span class="card-category text-primary">${product.category}</span>
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-desc">${product.desc || ''}</p>
                </div>
                
                <div>
                    <div class="card-actions">
                        <a href="order.html?productId=${product.id}" class="btn btn-primary">حجز الآن</a>
                        <a href="https://wa.me/9647713390381?text=${whatsappMsg}" target="_blank" class="btn btn-whatsapp">
                             واتساب <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                    ${adminControls}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/* Admin Functions */
function setupAdminActions() {
    const addBtn = document.getElementById('add-product-btn');
    const clearBtn = document.getElementById('clear-all-btn');
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('product-form');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal();
            editingId = null;
            document.getElementById('modal-title').textContent = 'إضافة منتج جديد';
            form.reset();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من حذف جميع المنتجات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                await Storage.clearProducts();
                loadProducts();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === document.querySelector('.modal-overlay')) {
            closeModal();
        }
    });

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function openModal() {
    document.querySelector('.modal-overlay').classList.add('open');
    document.querySelector('.modal-overlay').setAttribute('aria-hidden', 'false');
}

function closeModal() {
    document.querySelector('.modal-overlay').classList.remove('open');
    document.querySelector('.modal-overlay').setAttribute('aria-hidden', 'true');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('p-title').value;
    const category = document.getElementById('p-category').value;
    const desc = document.getElementById('p-desc').value;
    const fileInput = document.getElementById('p-image');

    let imageDataUrl = '';

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        imageDataUrl = await new Promise(resolve => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(fileInput.files[0]);
        });
    } else if (editingId) {
        // Keep existing image if editing and no new file select
        const p = currentProducts.find(x => x.id === editingId);
        if (p) imageDataUrl = p.imageDataUrl;
    }

    const product = {
        id: editingId || Date.now().toString(),
        title,
        category,
        desc,
        imageDataUrl,
        createdAt: new Date().toISOString()
    };

    // Save single product to DB
    await Storage.saveProduct(product);

    closeModal();
    loadProducts(); // Reload all from DB
}

/* Global Scope for inline onclick handlers */
window.deleteProduct = async function (id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        await Storage.deleteProduct(id);
        loadProducts();
    }
};

window.editProduct = function (id) {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('p-title').value = product.title;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-desc').value = product.desc;

    // Note: Can't set file input value for security, user must re-upload if they want to change it.
    // If they leave it empty, we keep the old dataURL in handleFormSubmit.

    document.getElementById('modal-title').textContent = 'تعديل المنتج';
    openModal();
};
