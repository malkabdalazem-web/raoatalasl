/*
  Rawat Alasal Tech Tricks - Order Logic
  - Product Lookup
  - Form Handling
  - WhatsApp Integration
*/

document.addEventListener('DOMContentLoaded', () => {
    loadProductOptions();
    checkUrlParams();
    setupOrderForm();
    if (localStorage.getItem('isAdmin') === 'true') {
        renderOrders();
    }
});

async function renderOrders() {
    console.log("Rendering orders...");
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري تحميل الطلبات...</td></tr>';

    try {
        const orders = await Storage.getOrders();
        tbody.innerHTML = '';

        // Sort by newest first
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">لا توجد طلبات.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding: 10px;">${new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                <td style="padding: 10px;">${order.name}</td>
                <td style="padding: 10px;">${order.phone}</td>
                <td style="padding: 10px;">${order.productTitle || '-'}</td>
                <td style="padding: 10px;">${order.quantity || 1}</td>
                <td style="padding: 10px;">
                    <button onclick="deleteOrder('${order.id}')" class="btn btn-danger btn-sm" style="padding: 5px 10px; font-size: 0.8rem;">حذف</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error rendering orders:", e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">حدث خطأ في تحميل الطلبات.</td></tr>';
    }
}

window.deleteOrder = async function (id) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب من السجل؟')) {
        await Storage.deleteOrder(id);
        renderOrders();
    }
};

let selectedProduct = null;
let availableProducts = [];

async function loadProductOptions() {
    try {
        availableProducts = await Storage.getProducts();

        const select = document.getElementById('order-product');
        // Clear existing options except placeholder
        select.innerHTML = '<option value="" disabled selected>اختر المنتج</option>';

        availableProducts.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.title} (${p.category})`;
            select.appendChild(option);
        });

        select.addEventListener('change', handleProductChange);

        // After loading products, check if we need to select one based on URL
        checkUrlParams();

    } catch (e) {
        console.error("Error loading products for order form", e);
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');

    if (productId && availableProducts.length > 0) {
        const select = document.getElementById('order-product');
        select.value = productId;

        // Trigger change event to update preview
        if (select.value === productId) {
            handleProductChange({ target: select });
        } else {
            // Product might be deleted
            // alert('المنتج المطلوب غير موجود أو تم حذفه.');
        }
    }
}

function handleProductChange(e) {
    const productId = e.target.value;
    selectedProduct = availableProducts.find(p => p.id === productId);

    const previewContainer = document.getElementById('product-preview');

    if (selectedProduct) {
        previewContainer.classList.remove('hidden');
        document.getElementById('preview-img').src = selectedProduct.imageDataUrl || '';
        document.getElementById('preview-title').textContent = selectedProduct.title;
        document.getElementById('preview-cat').textContent = selectedProduct.category;
    } else {
        previewContainer.classList.add('hidden');
    }
}

function setupOrderForm() {
    const form = document.getElementById('order-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('order-name').value;
        const phone = document.getElementById('order-phone').value;
        const address = document.getElementById('order-address').value;
        const quantity = document.getElementById('order-quantity').value;
        const notes = document.getElementById('order-notes').value;

        if (!selectedProduct) {
            alert('يرجى اختيار منتج.');
            return;
        }

        // Save Order locally
        const order = {
            id: Date.now().toString(),
            name,
            phone,
            address,
            productId: selectedProduct.id,
            productTitle: selectedProduct.title,
            category: selectedProduct.category,
            quantity: quantity,
            notes,
            createdAt: new Date().toISOString()
        };

        try {
            await Storage.saveOrder(order);
        } catch (err) {
            console.error("Failed to save order", err);
            // Continue to Whatsapp anyway? Yes.
        }

        // WhatsApp Redirect
        const msg = `طلب حجز جديد ✅%0A👤 الاسم: ${name}%0A📞 الهاتف: ${phone}%0A📍 العنوان: ${address}%0A📦 المنتج: ${selectedProduct.title}%0A🔢 العدد: ${quantity}%0A🧴 التصنيف: ${selectedProduct.category}%0A📝 ملاحظات: ${notes || 'لا يوجد'}%0A—%0Aشركة روعة العسل Tech Tricks`;

        window.open(`https://wa.me/9647713390381?text=${msg}`, '_blank');

        // Optional: Reset form or show success message on page
        form.reset();
        document.getElementById('product-preview').classList.add('hidden');

        // If admin is viewing, refresh table
        if (localStorage.getItem('isAdmin') === 'true') {
            renderOrders();
        }
    });
}
