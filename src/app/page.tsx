'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    let inventory: any[] = [];
    let receiveHistory: any[] = [];
    let salesHistory: any[] = [];
    let users: any[] = [];
    let cart: any[] = [];
    let editingId: number | null = null;
    let currentTab = 'pos';
    let currentUser = { username: 'admin', fullName: 'ผู้ดูแลระบบ', role: 'admin' };
    let selectedCategory = '';
    let receiptNumber = 1;

    // Load data from localStorage
    function loadData() {
        const savedInventory = localStorage.getItem('autoPartsInventory');
        const savedReceive = localStorage.getItem('receiveHistory');
        const savedSales = localStorage.getItem('salesHistory');
        const savedUsers = localStorage.getItem('users');
        const savedReceiptNumber = localStorage.getItem('receiptNumber');
        
        if (savedInventory) {
            inventory = JSON.parse(savedInventory);
        }
        if (savedReceive) {
            receiveHistory = JSON.parse(savedReceive);
        }
        if (savedSales) {
            salesHistory = JSON.parse(savedSales);
        }
        if (savedUsers) {
            users = JSON.parse(savedUsers);
        } else {
            // Create default admin user
            users = [{
                id: 1,
                username: 'admin',
                password: 'admin123',
                fullName: 'ผู้ดูแลระบบ',
                role: 'admin',
                status: 'active',
                createdAt: new Date().toISOString()
            }];
            saveData();
        }
        if (savedReceiptNumber) {
            receiptNumber = parseInt(savedReceiptNumber);
        }
        
        renderInventory();
        updateTotalStock();
        updatePartSelects();
        updateBrandFilter();
        renderReceiveHistory();
        renderUsers();
        updateReports();
        renderPOSProducts();
        renderCategoryButtons();
        updateTodayTotal();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        (document.getElementById('receiveDate') as HTMLInputElement).value = today;
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem('autoPartsInventory', JSON.stringify(inventory));
        localStorage.setItem('receiveHistory', JSON.stringify(receiveHistory));
        localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('receiptNumber', receiptNumber.toString());
    }

    // Tab switching
    function switchTab(tabName: string) {
        // Check permissions
        if (!hasPermission(tabName)) {
            showNotification('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
            return;
        }

        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('[id^="tab-"]').forEach(tab => {
            tab.className = tab.className.replace('tab-active', 'tab-inactive');
        });
        
        // Show selected tab content
        document.getElementById(`content-${tabName}`)!.classList.remove('hidden');
        
        // Add active class to selected tab
        const tabElement = document.getElementById(`tab-${tabName}`)!;
        tabElement.className = tabElement.className.replace('tab-inactive', 'tab-active');
        
        currentTab = tabName;
        
        if (tabName === 'reports') {
            updateReports();
        } else if (tabName === 'pos') {
            renderPOSProducts();
            renderCategoryButtons();
        }
    }

    // Check user permissions
    function hasPermission(tabName: string) {
        const role = currentUser.role;
        
        switch (tabName) {
            case 'pos':
                return ['admin', 'cashier', 'staff'].includes(role);
            case 'inventory':
                return ['admin'].includes(role);
            case 'receive':
                return ['admin', 'staff'].includes(role);
            case 'reports':
                return ['admin'].includes(role);
            case 'users':
                return ['admin'].includes(role);
            default:
                return false;
        }
    }

    // POS Functions
    function renderCategoryButtons() {
        const categoryButtons = document.getElementById('categoryButtons');
        if (!categoryButtons) return;
        const categories = [...new Set(inventory.map(item => item.category))];
        
        categoryButtons.innerHTML = `
            <button id="cat-button-all" class="px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${selectedCategory === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                ทั้งหมด
            </button>
            ${categories.map(category => `
                <button id="cat-button-${category}" class="px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                    ${category}
                </button>
            `).join('')}
        `;
        document.getElementById('cat-button-all')?.addEventListener('click', () => selectCategory(''));
        categories.forEach(category => {
          document.getElementById(`cat-button-${category}`)?.addEventListener('click', () => selectCategory(category));
        });
    }

    function selectCategory(category: string) {
        selectedCategory = category;
        renderCategoryButtons();
        renderPOSProducts();
    }

    function renderPOSProducts() {
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) return;
        const searchTerm = (document.getElementById('posSearch') as HTMLInputElement).value.toLowerCase();
        
        let filteredProducts = inventory.filter(item => {
            const matchesSearch = item.partCode.toLowerCase().includes(searchTerm) || 
                                item.partName.toLowerCase().includes(searchTerm) ||
                                item.brand.toLowerCase().includes(searchTerm) ||
                                (item.barcode && item.barcode.toLowerCase().includes(searchTerm));
            const matchesCategory = !selectedCategory || item.category === selectedCategory;
            const hasStock = item.quantity > 0;
            
            return matchesSearch && matchesCategory && hasStock;
        });

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">ไม่พบสินค้าที่ค้นหา</div>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(item => `
            <div id="pos-item-${item.id}" class="pos-item bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg">
                <div class="text-sm font-medium text-gray-900 mb-1">${item.partCode}</div>
                <div class="text-sm text-gray-600 mb-2">${item.partName}</div>
                <div class="text-xs text-gray-500 mb-2">${item.brand} | ${item.carModel}</div>
                <div class="flex justify-between items-center">
                    <div class="text-lg font-bold text-blue-600">฿${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</div>
                    <div class="text-xs text-gray-500">คงเหลือ: ${item.quantity}</div>
                </div>
            </div>
        `).join('');

        filteredProducts.forEach(item => {
          document.getElementById(`pos-item-${item.id}`)?.addEventListener('click', () => addToCart(item.id));
        });
    }

    function clearPosSearch() {
        (document.getElementById('posSearch') as HTMLInputElement).value = '';
        renderPOSProducts();
    }

    function addToCart(itemId: number) {
        const item = inventory.find(i => i.id === itemId);
        if (!item || item.quantity <= 0) {
            showNotification('สินค้าหมดสต๊อก', 'error');
            return;
        }

        const existingCartItem = cart.find(c => c.id === itemId);
        if (existingCartItem) {
            if (existingCartItem.quantity >= item.quantity) {
                showNotification('จำนวนในตะกร้าเกินสต๊อกที่มี', 'error');
                return;
            }
            existingCartItem.quantity += 1;
        } else {
            cart.push({
                id: itemId,
                partCode: item.partCode,
                partName: item.partName,
                price: item.price,
                quantity: 1,
                maxQuantity: item.quantity
            });
        }

        renderCart();
        updateCartTotal();
    }

    function renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        if(!cartItems || !cartCount) return;
        
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0).toString();

        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="text-center text-gray-500 py-4">ตะกร้าว่าง</div>';
            (document.getElementById('checkoutBtn') as HTMLButtonElement).disabled = true;
            return;
        }

        (document.getElementById('checkoutBtn') as HTMLButtonElement).disabled = false;

        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div class="flex-1">
                    <div class="font-medium text-sm">${item.partCode}</div>
                    <div class="text-xs text-gray-600">${item.partName}</div>
                    <div class="text-sm font-bold text-blue-600">฿${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="cart-dec-${item.id}" class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs">-</button>
                    <span class="w-8 text-center text-sm font-semibold">${item.quantity}</span>
                    <button id="cart-inc-${item.id}" class="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded text-xs" ${item.quantity >= item.maxQuantity ? 'disabled' : ''}>+</button>
                    <button id="cart-rem-${item.id}" class="bg-gray-500 hover:bg-gray-600 text-white w-6 h-6 rounded text-xs ml-2">×</button>
                </div>
            </div>
        `).join('');

        cart.forEach(item => {
          document.getElementById(`cart-dec-${item.id}`)?.addEventListener('click', () => updateCartQuantity(item.id, item.quantity - 1));
          document.getElementById(`cart-inc-${item.id}`)?.addEventListener('click', () => updateCartQuantity(item.id, item.quantity + 1));
          document.getElementById(`cart-rem-${item.id}`)?.addEventListener('click', () => removeFromCart(item.id));
        });
    }

    function updateCartQuantity(itemId: number, newQuantity: number) {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        const cartItem = cart.find(c => c.id === itemId);
        if (cartItem && newQuantity <= cartItem.maxQuantity) {
            cartItem.quantity = newQuantity;
            renderCart();
            updateCartTotal();
        } else {
            showNotification('จำนวนเกินสต๊อกที่มี', 'error');
        }
    }

    function removeFromCart(itemId: number) {
        cart = cart.filter(c => c.id !== itemId);
        renderCart();
        updateCartTotal();
    }

    function clearCart() {
        cart = [];
        renderCart();
        updateCartTotal();
    }

    function updateCartTotal() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat((document.getElementById('discountPercent') as HTMLInputElement).value) || 0;
        const taxPercent = parseFloat((document.getElementById('taxPercent') as HTMLInputElement).value) || 0;
        
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const grandTotal = afterDiscount + taxAmount;

        document.getElementById('subtotal')!.textContent = `฿${subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
        document.getElementById('discountAmount')!.textContent = `฿${discountAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
        document.getElementById('taxAmount')!.textContent = `฿${taxAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
        document.getElementById('grandTotal')!.textContent = `฿${grandTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
    }

    function processPayment() {
        if (cart.length === 0) return;

        const grandTotal = parseFloat(document.getElementById('grandTotal')!.textContent!.replace('฿', '').replace(/,/g, ''));
        document.getElementById('paymentTotal')!.textContent = `฿${grandTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
        (document.getElementById('receivedAmount') as HTMLInputElement).value = '';
        document.getElementById('changeAmount')!.textContent = '฿0.00';
        (document.getElementById('customerName') as HTMLInputElement).value = '';
        
        document.getElementById('paymentModal')!.classList.remove('hidden');
        document.getElementById('paymentModal')!.classList.add('flex');
        document.getElementById('receivedAmount')!.focus();
    }

    function completeSale() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat((document.getElementById('discountPercent') as HTMLInputElement).value) || 0;
        const taxPercent = parseFloat((document.getElementById('taxPercent') as HTMLInputElement).value) || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const grandTotal = afterDiscount + taxAmount;
        const received = parseFloat((document.getElementById('receivedAmount') as HTMLInputElement).value);
        const change = received - grandTotal;
        const customerName = (document.getElementById('customerName') as HTMLInputElement).value || 'ลูกค้าทั่วไป';
        
        const saleRecord = {
            id: Date.now(),
            receiptNumber: receiptNumber,
            items: [...cart],
            subtotal: subtotal,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            taxPercent: taxPercent,
            taxAmount: taxAmount,
            grandTotal: grandTotal,
            received: received,
            change: change,
            customerName: customerName,
            cashier: currentUser.fullName,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        
        cart.forEach(cartItem => {
            const inventoryItem = inventory.find(i => i.id === cartItem.id);
            if (inventoryItem) {
                inventoryItem.quantity -= cartItem.quantity;
            }
        });
        
        salesHistory.push(saleRecord);
        receiptNumber++;
        
        saveData();
        updateTotalStock();
        updateTodayTotal();
        renderPOSProducts();
        
        showReceipt(saleRecord);
        
        clearCart();
        document.getElementById('paymentModal')!.classList.add('hidden');
        document.getElementById('paymentModal')!.classList.remove('flex');
        
        showNotification('ขายสำเร็จแล้ว', 'success');
    }

    function showReceipt(saleRecord: any) {
        const receiptContent = document.getElementById('receiptContent');
        if (!receiptContent) return;
        const now = new Date();
        
        receiptContent.innerHTML = `
            <div class="text-center mb-4">
                <h2 class="font-bold text-lg">ร้านอะไหล่รถยนต์</h2>
                <p class="text-sm">Auto Parts Shop</p>
                <p class="text-sm">โทร: 02-xxx-xxxx</p>
                <hr class="my-2">
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm">
                    <span>ใบเสร็จเลขที่:</span>
                    <span>${String(saleRecord.receiptNumber).padStart(6, '0')}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>วันที่:</span>
                    <span>${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>ลูกค้า:</span>
                    <span>${saleRecord.customerName}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>พนักงาน:</span>
                    <span>${saleRecord.cashier}</span>
                </div>
            </div>
            
            <hr class="my-2">
            
            <div class="mb-4">
                ${saleRecord.items.map((item: any) => `
                    <div class="flex justify-between text-sm mb-1">
                        <div class="flex-1">
                            <div>${item.partCode}</div>
                            <div class="text-xs text-gray-600">${item.partName}</div>
                            <div class="text-xs">${item.quantity} x ฿${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</div>
                        </div>
                        <div class="text-right">
                            ฿${(item.quantity * item.price).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <hr class="my-2">
            
            <div class="mb-4">
                <div class="flex justify-between text-sm">
                    <span>ยอดรวม:</span>
                    <span>฿${saleRecord.subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                </div>
                ${saleRecord.discountAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span>ส่วนลด (${saleRecord.discountPercent}%):</span>
                        <span>-฿${saleRecord.discountAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                    </div>
                ` : ''}
                ${saleRecord.taxAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span>ภาษี (${saleRecord.taxPercent}%):</span>
                        <span>฿${saleRecord.taxAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                    </div>
                ` : ''}
                <div class="flex justify-between font-bold">
                    <span>ยอดชำระ:</span>
                    <span>฿${saleRecord.grandTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>รับเงิน:</span>
                    <span>฿${saleRecord.received.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>เงินทอน:</span>
                    <span>฿${saleRecord.change.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            
            <hr class="my-2">
            <div class="text-center text-xs">
                <p>ขอบคุณที่ใช้บริการ</p>
                <p>Thank you for your business</p>
            </div>
        `;
        
        document.getElementById('receiptModal')!.classList.remove('hidden');
        document.getElementById('receiptModal')!.classList.add('flex');
    }

    function printReceipt() {
        window.print();
    }

    function closeReceiptModal() {
        document.getElementById('receiptModal')!.classList.add('hidden');
        document.getElementById('receiptModal')!.classList.remove('flex');
    }

    function switchUser() {
        (document.getElementById('loginUsername') as HTMLInputElement).value = '';
        (document.getElementById('loginPassword') as HTMLInputElement).value = '';
        document.getElementById('userSwitchModal')!.classList.remove('hidden');
        document.getElementById('userSwitchModal')!.classList.add('flex');
    }

    function login() {
        const username = (document.getElementById('loginUsername') as HTMLInputElement).value;
        const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
        
        const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
        
        if (user) {
            currentUser = user;
            document.getElementById('currentUser')!.textContent = user.fullName;
            closeUserSwitchModal();
            updateTabVisibility();
            showNotification(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${user.fullName}`, 'success');
            
            if (user.role === 'cashier' || user.role === 'staff') {
                switchTab('pos');
            } else {
                switchTab('pos');
            }
        } else {
            showNotification('ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง', 'error');
        }
    }

    function closeUserSwitchModal() {
        document.getElementById('userSwitchModal')!.classList.add('hidden');
        document.getElementById('userSwitchModal')!.classList.remove('flex');
    }

    function updateTabVisibility() {
        const tabs = ['pos', 'inventory', 'receive', 'reports', 'users'];
        
        tabs.forEach(tab => {
            const tabElement = document.getElementById(`tab-${tab}`) as HTMLElement;
            if (tabElement) {
              if (hasPermission(tab)) {
                  tabElement.style.display = 'flex';
              } else {
                  tabElement.style.display = 'none';
              }
            }
        });
    }

    function renderUsers() {
        const tbody = document.getElementById('usersTable');
        if(!tbody) return;
        
        tbody.innerHTML = users.map(user => {
            const roleText: {[key: string]: string} = {
                'admin': 'ผู้ดูแลระบบ',
                'cashier': 'พนักงานขาย',
                'staff': 'พนักงานทั่วไป'
            };
            
            const statusClass = user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const statusText = user.status === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน';
            
            return `
                <tr class="hover:bg-gray-50 fade-in">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.username}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.fullName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${roleText[user.role]}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(user.createdAt).toLocaleDateString('th-TH')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button id="toggle-user-${user.id}" class="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors duration-200">
                            ${user.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        ${user.username !== 'admin' ? `<button id="delete-user-${user.id}" class="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors duration-200">ลบ</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        users.forEach(user => {
          document.getElementById(`toggle-user-${user.id}`)?.addEventListener('click', () => toggleUserStatus(user.id));
          if (user.username !== 'admin') {
            document.getElementById(`delete-user-${user.id}`)?.addEventListener('click', () => deleteUser(user.id));
          }
        });
    }

    function toggleUserStatus(userId: number) {
        const user = users.find(u => u.id === userId);
        if (user && user.username !== 'admin') {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            saveData();
            renderUsers();
            showNotification(`${user.status === 'active' ? 'เปิด' : 'ปิด'}ใช้งานผู้ใช้ ${user.fullName} แล้ว`, 'success');
        }
    }

    function deleteUser(userId: number) {
        const user = users.find(u => u.id === userId);
        if (user && user.username !== 'admin') {
            const confirmDiv = document.createElement('div');
            confirmDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            confirmDiv.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">ยืนยันการลบผู้ใช้</h3>
                    <p class="text-gray-600 mb-6">คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${user.fullName}"? การกระทำนี้ไม่สามารถยกเลิกได้</p>
                    <div class="flex space-x-3">
                        <button id="confirm-delete-user-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ลบ</button>
                        <button id="cancel-delete-user-btn" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยกเลิก</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmDiv);

            document.getElementById('confirm-delete-user-btn')!.addEventListener('click', () => confirmDeleteUser(userId));
            document.getElementById('cancel-delete-user-btn')!.addEventListener('click', () => confirmDiv.remove());
        }
    }

    function confirmDeleteUser(userId: number) {
        users = users.filter(u => u.id !== userId);
        saveData();
        renderUsers();
        document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')?.remove();
        showNotification('ลบผู้ใช้สำเร็จแล้ว', 'success');
    }

    function updateTodayTotal() {
        const today = new Date().toISOString().split('T')[0];
        const todayTotal = salesHistory
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.grandTotal, 0);
        
        document.getElementById('todayTotal')!.textContent = todayTotal.toLocaleString('th-TH');
    }

    function updatePartSelects() {
        const receiveSelect = document.getElementById('receivePartSelect') as HTMLSelectElement;
        
        if(!receiveSelect) return;

        const options = inventory.map(item => 
            `<option value="${item.id}">${item.partCode} - ${item.partName} (คงเหลือ: ${item.quantity})</option>`
        ).join('');
        
        receiveSelect.innerHTML = '<option value="">เลือกอะไหล่</option>' + options;
    }

    function updateBrandFilter() {
        const brandFilter = document.getElementById('filterBrand') as HTMLSelectElement;
        if (!brandFilter) return;
        const brands = [...new Set(inventory.map(item => item.brand))].sort();
        
        brandFilter.innerHTML = '<option value="">ทุกยี่ห้อ</option>' + 
            brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
    }

    function renderInventory() {
        const tbody = document.getElementById('inventoryTable');
        const emptyState = document.getElementById('emptyState');
        if (!tbody || !emptyState) return;

        if (inventory.length === 0) {
            showEmptyState();
            return;
        }

        emptyState.classList.add('hidden');
        
        let filteredInventory = filterInventory();
        
        tbody.innerHTML = filteredInventory.map(item => {
            const status = getStockStatus(item);
            const statusClass: {[key: string]: string} = {
                'ปกติ': 'bg-green-100 text-green-800',
                'สต๊อกต่ำ': 'bg-yellow-100 text-yellow-800',
                'หมดสต๊อก': 'bg-red-100 text-red-800'
            };

            return `
                <tr class="hover:bg-gray-50 fade-in">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.partCode}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.partName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.brand}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.carModel}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${item.quantity.toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">฿${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass[status]}">
                            ${status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button id="edit-item-${item.id}" class="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors duration-200">แก้ไข</button>
                        <button id="delete-item-${item.id}" class="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors duration-200">ลบ</button>
                    </td>
                </tr>
            `;
        }).join('');

        filteredInventory.forEach(item => {
          document.getElementById(`edit-item-${item.id}`)?.addEventListener('click', () => editItem(item.id));
          document.getElementById(`delete-item-${item.id}`)?.addEventListener('click', () => deleteItem(item.id));
        });
    }

    function renderReceiveHistory() {
        const tbody = document.getElementById('receiveHistoryTable');
        if (!tbody) return;
        
        tbody.innerHTML = receiveHistory.slice(-20).reverse().map(record => `
            <tr class="hover:bg-gray-50 fade-in">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(record.date).toLocaleDateString('th-TH')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.partCode}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.partName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${record.quantity.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">฿${record.cost.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.supplier}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.note || '-'}</td>
            </tr>
        `).join('');
    }

    function updateReports() {
        // Low stock count
        const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint);
        document.getElementById('lowStockCount')!.textContent = lowStockItems.length.toString();
        
        // Today's sales
        const today = new Date().toISOString().split('T')[0];
        const todaySales = salesHistory
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.grandTotal, 0);
        document.getElementById('todaySales')!.textContent = `฿${todaySales.toLocaleString('th-TH')}`;
        
        // Total items
        document.getElementById('totalItems')!.textContent = inventory.length.toString();
        
        // Stock value
        const stockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        document.getElementById('stockValue')!.textContent = `฿${stockValue.toLocaleString('th-TH')}`;
        
        // Low stock alert
        const lowStockAlert = document.getElementById('lowStockAlert');
        if (!lowStockAlert) return;
        if (lowStockItems.length === 0) {
            lowStockAlert.innerHTML = '<p class="text-green-600 font-semibold">✅ ไม่มีสินค้าที่สต๊อกต่ำ</p>';
        } else {
            lowStockAlert.innerHTML = lowStockItems.map(item => `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-red-800">${item.partCode} - ${item.partName}</p>
                        <p class="text-red-600">คงเหลือ: ${item.quantity} ชิ้น (จุดสั่งซื้อ: ${item.reorderPoint} ชิ้น)</p>
                    </div>
                    <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">ต้องสั่งซื้อ</span>
                </div>
            `).join('');
        }
        
        // Best selling items (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const salesData: {[key: number]: any} = {};
        salesHistory
            .filter(sale => new Date(sale.date) >= sevenDaysAgo)
            .forEach(sale => {
                sale.items.forEach((item: any) => {
                    if (!salesData[item.id]) {
                        salesData[item.id] = {
                            partCode: item.partCode,
                            partName: item.partName,
                            quantity: 0,
                            amount: 0
                        };
                    }
                    salesData[item.id].quantity += item.quantity;
                    salesData[item.id].amount += item.quantity * item.price;
                });
            });
        
        const bestSelling = Object.values(salesData)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        const bestSellingTable = document.getElementById('bestSellingTable');
        if (!bestSellingTable) return;
        if (bestSelling.length === 0) {
            bestSellingTable.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">ไม่มีข้อมูลการขายใน 7 วันที่ผ่านมา</td></tr>';
        } else {
            bestSellingTable.innerHTML = bestSelling.map((item, index) => `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.partCode}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.partName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">฿${item.amount.toLocaleString('th-TH')}</td>
                </tr>
            `).join('');
        }
    }

    function filterInventory() {
        const searchTerm = (document.getElementById('searchInput') as HTMLInputElement).value.toLowerCase();
        const categoryFilter = (document.getElementById('filterCategory') as HTMLSelectElement).value;
        const brandFilter = (document.getElementById('filterBrand') as HTMLSelectElement).value;
        const statusFilter = (document.getElementById('filterStatus') as HTMLSelectElement).value;

        return inventory.filter(item => {
            const matchesSearch = item.partCode.toLowerCase().includes(searchTerm) || 
                                item.partName.toLowerCase().includes(searchTerm) ||
                                item.brand.toLowerCase().includes(searchTerm) ||
                                item.carModel.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesBrand = !brandFilter || item.brand === brandFilter;
            const matchesStatus = !statusFilter || getStatusKey(item) === statusFilter;

            return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
        });
    }

    function getStockStatus(item: any) {
        if (item.quantity === 0) return 'หมดสต๊อก';
        if (item.quantity <= item.reorderPoint) return 'สต๊อกต่ำ';
        return 'ปกติ';
    }

    function getStatusKey(item: any) {
        if (item.quantity === 0) return 'out';
        if (item.quantity <= item.reorderPoint) return 'low';
        return 'normal';
    }

    function editItem(id: number) {
        const item = inventory.find(i => i.id === id);
        if (item) {
            editingId = id;
            (document.getElementById('editQuantity') as HTMLInputElement).value = item.quantity;
            document.getElementById('editModal')!.classList.remove('hidden');
            document.getElementById('editModal')!.classList.add('flex');
        }
    }

    function deleteItem(id: number) {
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        confirmDiv.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">ยืนยันการลบ</h3>
                <p class="text-gray-600 mb-6">คุณแน่ใจหรือไม่ที่จะลบอะไหล่นี้? การกระทำนี้ไม่สามารถยกเลิกได้</p>
                <div class="flex space-x-3">
                    <button id="confirm-delete-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ลบ</button>
                    <button id="cancel-delete-btn" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยกเลิก</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDiv);

        document.getElementById('confirm-delete-btn')!.addEventListener('click', () => confirmDelete(id));
        document.getElementById('cancel-delete-btn')!.addEventListener('click', cancelDelete);
    }

    function confirmDelete(id: number) {
        inventory = inventory.filter(item => item.id !== id);
        saveData();
        renderInventory();
        updateTotalStock();
        updatePartSelects();
        updateBrandFilter();
        cancelDelete();
        showNotification('ลบอะไหล่เรียบร้อยแล้ว', 'success');
    }

    function cancelDelete() {
        const confirmDiv = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
        if (confirmDiv) {
            confirmDiv.remove();
        }
    }

    function closeModal() {
        document.getElementById('editModal')!.classList.add('hidden');
        document.getElementById('editModal')!.classList.remove('flex');
        editingId = null;
    }

    function updateTotalStock() {
        const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('totalStock')!.textContent = total.toLocaleString();
    }

    function showEmptyState() {
        document.getElementById('inventoryTable')!.innerHTML = '';
        document.getElementById('emptyState')!.classList.remove('hidden');
    }

    function showNotification(message: string, type: 'success' | 'error') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 fade-in ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Attaching event listeners
    document.getElementById('addItemForm')?.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const newItem = {
          id: Date.now(),
          partCode: (document.getElementById('partCode') as HTMLInputElement).value.toUpperCase(),
          partName: (document.getElementById('partName') as HTMLInputElement).value,
          brand: (document.getElementById('brand') as HTMLInputElement).value,
          carModel: (document.getElementById('carModel') as HTMLInputElement).value,
          oemCode: (document.getElementById('oemCode') as HTMLInputElement).value,
          category: (document.getElementById('category') as HTMLSelectElement).value,
          quantity: parseInt((document.getElementById('quantity') as HTMLInputElement).value),
          price: parseFloat((document.getElementById('price') as HTMLInputElement).value),
          reorderPoint: parseInt((document.getElementById('reorderPoint') as HTMLInputElement).value),
          createdAt: new Date().toISOString()
      };

      if (inventory.some(item => item.partCode === newItem.partCode)) {
          showNotification('รหัสอะไหล่นี้มีอยู่แล้วในระบบ', 'error');
          return;
      }

      inventory.push(newItem);
      saveData();
      renderInventory();
      updateTotalStock();
      updatePartSelects();
      updateBrandFilter();
      (this as HTMLFormElement).reset();
      
      showNotification('เพิ่มอะไหล่เรียบร้อยแล้ว', 'success');
    });

    document.getElementById('receiveForm')?.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const partId = parseInt((document.getElementById('receivePartSelect') as HTMLSelectElement).value);
      const quantity = parseInt((document.getElementById('receiveQuantity') as HTMLInputElement).value);
      const cost = parseFloat((document.getElementById('receiveCost') as HTMLInputElement).value);
      const supplier = (document.getElementById('supplier') as HTMLInputElement).value;
      const date = (document.getElementById('receiveDate') as HTMLInputElement).value;
      const note = (document.getElementById('receiveNote') as HTMLInputElement).value;
      
      const item = inventory.find(i => i.id === partId);
      if (!item) return;
      
      item.quantity += quantity;
      
      receiveHistory.push({
          id: Date.now(),
          partId: partId,
          partCode: item.partCode,
          partName: item.partName,
          quantity: quantity,
          cost: cost,
          supplier: supplier,
          date: date,
          note: note,
          timestamp: new Date().toISOString()
      });
      
      saveData();
      renderInventory();
      updateTotalStock();
      renderReceiveHistory();
      (this as HTMLFormElement).reset();
      
      const today = new Date().toISOString().split('T')[0];
      (document.getElementById('receiveDate') as HTMLInputElement).value = today;
      
      showNotification(`รับสินค้า ${item.partName} จำนวน ${quantity} ชิ้น เรียบร้อยแล้ว`, 'success');
    });

    document.getElementById('addUserForm')?.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = (document.getElementById('username') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
      const role = (document.getElementById('userRole') as HTMLSelectElement).value;
      
      if (users.some(user => user.username === username)) {
          showNotification('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'error');
          return;
      }
      
      const newUser = {
          id: Date.now(),
          username: username,
          password: password,
          fullName: fullName,
          role: role,
          status: 'active',
          createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      saveData();
      renderUsers();
      (this as HTMLFormElement).reset();
      
      showNotification('เพิ่มผู้ใช้งานเรียบร้อยแล้ว', 'success');
    });

    document.getElementById('receivedAmount')?.addEventListener('input', function() {
        const received = parseFloat((this as HTMLInputElement).value) || 0;
        const total = parseFloat(document.getElementById('paymentTotal')!.textContent!.replace('฿', '').replace(/,/g, ''));
        const change = received - total;
        
        document.getElementById('changeAmount')!.textContent = `฿${Math.max(0, change).toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
    });

    document.getElementById('confirmPayment')?.addEventListener('click', function() {
        const received = parseFloat((document.getElementById('receivedAmount') as HTMLInputElement).value) || 0;
        const total = parseFloat(document.getElementById('paymentTotal')!.textContent!.replace('฿', '').replace(/,/g, ''));
        
        if (received < total) {
            showNotification('จำนวนเงินที่รับไม่เพียงพอ', 'error');
            return;
        }
        
        completeSale();
    });

    document.getElementById('tab-pos')?.addEventListener('click', () => switchTab('pos'));
    document.getElementById('tab-inventory')?.addEventListener('click', () => switchTab('inventory'));
    document.getElementById('tab-receive')?.addEventListener('click', () => switchTab('receive'));
    document.getElementById('tab-reports')?.addEventListener('click', () => switchTab('reports'));
    document.getElementById('tab-users')?.addEventListener('click', () => switchTab('users'));
    document.getElementById('switchUserBtn')?.addEventListener('click', switchUser);
    document.getElementById('clearPosSearchBtn')?.addEventListener('click', clearPosSearch);
    document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', processPayment);
    document.getElementById('cancelPayment')?.addEventListener('click', () => {
        document.getElementById('paymentModal')!.classList.add('hidden');
        document.getElementById('paymentModal')!.classList.remove('flex');
    });
    document.getElementById('printReceiptBtn')?.addEventListener('click', printReceipt);
    document.getElementById('closeReceiptBtn')?.addEventListener('click', closeReceiptModal);
    document.getElementById('loginBtn')?.addEventListener('click', login);
    document.getElementById('closeUserSwitchBtn')?.addEventListener('click', closeUserSwitchModal);
    document.getElementById('saveEdit')?.addEventListener('click', () => {
        if (editingId) {
            const item = inventory.find(i => i.id === editingId);
            const newQuantity = parseInt((document.getElementById('editQuantity') as HTMLInputElement).value);
            
            if (item && newQuantity >= 0) {
                item.quantity = newQuantity;
                saveData();
                renderInventory();
                updateTotalStock();
                updatePartSelects();
                closeModal();
                showNotification('อัปเดตจำนวนสต๊อกเรียบร้อยแล้ว', 'success');
            }
        }
    });
    document.getElementById('cancelEdit')?.addEventListener('click', closeModal);
    document.getElementById('searchInput')?.addEventListener('input', renderInventory);
    document.getElementById('filterCategory')?.addEventListener('change', renderInventory);
    document.getElementById('filterBrand')?.addEventListener('change', renderInventory);
    document.getElementById('filterStatus')?.addEventListener('change', renderInventory);
    document.getElementById('posSearch')?.addEventListener('input', renderPOSProducts);
    document.getElementById('discountPercent')?.addEventListener('change', updateCartTotal);
    document.getElementById('taxPercent')?.addEventListener('change', updateCartTotal);


    // Initial setup
    loadData();
    updateTabVisibility();
    // Re-assign because loadData clears them
    document.getElementById('clearPosSearchBtn')?.addEventListener('click', clearPosSearch);
    document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);

  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-full">
    {/* Header */}
    <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-lg mr-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">POS ระบบขายอะไหล่</h1>
                        <p className="text-gray-600">ระบบจุดขายอะไหล่รถยนต์</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-green-100 px-4 py-2 rounded-lg">
                        <span className="text-green-800 font-semibold">สินค้าทั้งหมด: <span id="totalStock">0</span> ชิ้น</span>
                    </div>
                    <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                        <span className="text-yellow-800 font-semibold">ยอดขายวันนี้: ฿<span id="todayTotal">0</span></span>
                    </div>
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-blue-800 font-semibold">ผู้ใช้: <span id="currentUser">Admin</span></span>
                    </div>
                    <button id="switchUserBtn" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200">
                        เปลี่ยนผู้ใช้
                    </button>
                </div>
            </div>
        </div>
    </header>

    {/* Navigation Tabs */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-xl shadow-lg p-2">
            <nav className="flex space-x-2 overflow-x-auto">
                <button id="tab-pos" className="tab-active px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                    </svg>
                    หน้าจอขาย (POS)
                </button>
                <button id="tab-inventory" className="tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    จัดการสินค้า
                </button>
                <button id="tab-receive" className="tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    รับสินค้าเข้า
                </button>
                <button id="tab-reports" className="tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    รายงาน
                </button>
                <button id="tab-users" className="tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                    ผู้ใช้งาน
                </button>
            </nav>
        </div>
    </div>

    {/* Tab Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* POS Tab */}
        <div id="content-pos" className="tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Product Search & Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <input type="text" id="posSearch" className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ค้นหาด้วยรหัส, ชื่อ, หรือ Barcode..."/>
                            </div>
                            <button id="clearPosSearchBtn" className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                                ล้าง
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่สินค้า</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3" id="categoryButtons">
                            {/* Category buttons will be populated here */}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">รายการสินค้า</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="productGrid">
                            {/* Products will be populated here */}
                        </div>
                    </div>
                </div>

                {/* Right Side - Shopping Cart */}
                <div className="space-y-6">
                    {/* Cart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                            </svg>
                            ตะกร้าสินค้า (<span id="cartCount">0</span>)
                        </h3>
                        
                        <div id="cartItems" className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                            {/* Cart items will be populated here */}
                        </div>

                        {/* Cart Summary */}
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>ยอดรวม:</span>
                                <span id="subtotal">฿0.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">ส่วนลด (%):</span>
                                <input type="number" id="discountPercent" className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" min="0" max="100" defaultValue="0"/>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ส่วนลด:</span>
                                <span id="discountAmount">฿0.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">ภาษี (%):</span>
                                <input type="number" id="taxPercent" className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" min="0" max="100" defaultValue="7"/>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ภาษี:</span>
                                <span id="taxAmount">฿0.00</span>
                            </div>
                            <div className="border-t pt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>ยอดชำระ:</span>
                                    <span id="grandTotal">฿0.00</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                            <button id="clearCartBtn" className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                                ล้างตะกร้า
                            </button>
                            <button id="checkoutBtn" className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 disabled:bg-gray-300" disabled>
                                ชำระเงิน
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Inventory Tab */}
        <div id="content-inventory" className="tab-content hidden">
            {/* Add New Item Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">เพิ่มอะไหล่ใหม่</h2>
                <form id="addItemForm" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสอะไหล่</label>
                        <input type="text" id="partCode" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="เช่น ENG001" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่ออะไหล่</label>
                        <input type="text" id="partName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="เช่น กรองอากาศ" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ยี่ห้อ</label>
                        <input type="text" id="brand" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="เช่น Toyota, Honda" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รุ่นรถที่ใช้ได้</label>
                        <input type="text" id="carModel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="เช่น Vios, City, Civic" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OEM Code</label>
                        <input type="text" id="oemCode" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="รหัส OEM (ถ้ามี)"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <select id="category" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">เลือกหมวดหมู่</option>
                            <option value="เครื่องยนต์">เครื่องยนต์</option>
                            <option value="เบรก">เบรก</option>
                            <option value="ช่วงล่าง">ช่วงล่าง</option>
                            <option value="ไฟฟ้า">ไฟฟ้า</option>
                            <option value="ตัวถัง">ตัวถัง</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเริ่มต้น</label>
                        <input type="number" id="quantity" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" min="0" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ราคาขาย (บาท)</label>
                        <input type="number" id="price" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" step="0.01" min="0" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">จุดสั่งซื้อใหม่</label>
                        <input type="number" id="reorderPoint" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="10" min="0" required/>
                    </div>
                    <div className="md:col-span-3">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            เพิ่มอะไหล่
                        </button>
                    </div>
                </form>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ค้นหาและกรอง</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                        <input type="text" id="searchInput" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="รหัส, ชื่อ, ยี่ห้อ, รุ่นรถ"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <select id="filterCategory" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">ทุกหมวดหมู่</option>
                            <option value="เครื่องยนต์">เครื่องยนต์</option>
                            <option value="เบรก">เบรก</option>
                            <option value="ช่วงล่าง">ช่วงล่าง</option>
                            <option value="ไฟฟ้า">ไฟฟ้า</option>
                            <option value="ตัวถัง">ตัวถัง</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ยี่ห้อ</label>
                        <select id="filterBrand" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">ทุกยี่ห้อ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะสต๊อก</label>
                        <select id="filterStatus" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">ทุกสถานะ</option>
                            <option value="normal">ปกติ</option>
                            <option value="low">สต๊อกต่ำ</option>
                            <option value="out">หมดสต๊อก</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">รายการสต๊อกอะไหล่</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัส</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออะไหล่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยี่ห้อ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รุ่นรถ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTable" className="bg-white divide-y divide-gray-200">
                            {/* Items will be populated here */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            <div id="emptyState" className="text-center py-12 hidden">
                <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีอะไหล่ในระบบ</h3>
                <p className="mt-2 text-gray-500">เริ่มต้นโดยการเพิ่มอะไหล่รายการแรกของคุณ</p>
            </div>
        </div>

        {/* Receive Tab */}
        <div id="content-receive" className="tab-content hidden">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">รับสินค้าเข้าคลัง</h2>
                <form id="receiveForm" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกอะไหล่</label>
                        <select id="receivePartSelect" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">เลือกอะไหล่</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนที่รับเข้า</label>
                        <input type="number" id="receiveQuantity" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" min="1" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ราคาต้นทุน/ชิ้น</label>
                        <input type="number" id="receiveCost" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" step="0.01" min="0" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ซัพพลายเออร์</label>
                        <input type="text" id="supplier" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ชื่อร้านค้า/ซัพพลายเออร์" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่รับ</label>
                        <input type="date" id="receiveDate" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                        <input type="text" id="receiveNote" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="หมายเหตุเพิ่มเติม"/>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            บันทึกการรับสินค้า
                        </button>
                    </div>
                </form>
            </div>

            {/* Receive History */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">ประวัติการรับสินค้า</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสอะไหล่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออะไหล่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ต้นทุน/ชิ้น</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ซัพพลายเออร์</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody id="receiveHistoryTable" className="bg-white divide-y divide-gray-200">
                            {/* History will be populated here */}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>



        {/* Reports Tab */}
        <div id="content-reports" className="tab-content hidden">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-red-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">สต๊อกต่ำ</p>
                            <p className="text-2xl font-bold text-gray-900" id="lowStockCount">0</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">ยอดขายวันนี้</p>
                            <p className="text-2xl font-bold text-gray-900" id="todaySales">0</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">รายการทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-900" id="totalItems">0</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">มูลค่าสต๊อก</p>
                            <p className="text-2xl font-bold text-gray-900" id="stockValue">฿0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🚨 แจ้งเตือนสต๊อกต่ำ</h2>
                <div id="lowStockAlert" className="space-y-3">
                    {/* Low stock items will be populated here */}
                </div>
            </div>

            {/* Best Selling Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 อะไหล่ขายดี (7 วันที่ผ่านมา)</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อันดับ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัส</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออะไหล่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนขาย</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดขาย</th>
                            </tr>
                        </thead>
                        <tbody id="bestSellingTable" className="bg-white divide-y divide-gray-200">
                            {/* Best selling items will be populated here */}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Users Tab */}
        <div id="content-users" className="tab-content hidden">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">เพิ่มผู้ใช้งานใหม่</h2>
                <form id="addUserForm" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
                        <input type="text" id="username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ชื่อผู้ใช้" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                        <input type="password" id="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="รหัสผ่าน" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อจริง</label>
                        <input type="text" id="fullName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ชื่อ-นามสกุล" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ตำแหน่ง</label>
                        <select id="userRole" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">เลือกตำแหน่ง</option>
                            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                            <option value="cashier">พนักงานขาย (Cashier)</option>
                            <option value="staff">พนักงานทั่วไป (Staff)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            เพิ่มผู้ใช้งาน
                        </button>
                    </div>
                </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">รายการผู้ใช้งาน</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ใช้</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อจริง</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody id="usersTable" className="bg-white divide-y divide-gray-200">
                            {/* Users will be populated here */}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    {/* Payment Modal */}
    <div id="paymentModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">ชำระเงิน</h3>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <div className="text-center mb-4">
                        <p className="text-2xl font-bold text-gray-900">ยอดชำระ: <span id="paymentTotal">฿0.00</span></p>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงินที่รับ</label>
                    <input type="number" id="receivedAmount" className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.01" min="0"/>
                </div>
                <div className="mb-4">
                    <div className="flex justify-between text-lg">
                        <span>เงินทอน:</span>
                        <span id="changeAmount" className="font-bold">฿0.00</span>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อลูกค้า (ไม่บังคับ)</label>
                    <input type="text" id="customerName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ชื่อลูกค้า"/>
                </div>
                <div className="flex space-x-3">
                    <button id="confirmPayment" className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยืนยันการชำระ</button>
                    <button id="cancelPayment" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยกเลิก</button>
                </div>
            </div>
        </div>
    </div>

    {/* Receipt Modal */}
    <div id="receiptModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">ใบเสร็จรับเงิน</h3>
            </div>
            <div className="p-6">
                <div id="receiptContent" className="receipt-print">
                    {/* Receipt content will be populated here */}
                </div>
                <div className="flex space-x-3 mt-6">
                    <button id="printReceiptBtn" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">พิมพ์ใบเสร็จ</button>
                    <button id="closeReceiptBtn" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ปิด</button>
                </div>
            </div>
        </div>
    </div>

    {/* User Switch Modal */}
    <div id="userSwitchModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">เข้าสู่ระบบ</h3>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
                    <input type="text" id="loginUsername" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ชื่อผู้ใช้"/>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                    <input type="password" id="loginPassword" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="รหัสผ่าน"/>
                </div>
                <div className="flex space-x-3">
                    <button id="loginBtn" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">เข้าสู่ระบบ</button>
                    <button id="closeUserSwitchBtn" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยกเลิก</button>
                </div>
            </div>
        </div>
    </div>

    {/* Edit Modal */}
    <div id="editModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">แก้ไขจำนวนสต๊อก</h3>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนใหม่</label>
                    <input type="number" id="editQuantity" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" min="0"/>
                </div>
                <div className="flex space-x-3">
                    <button id="saveEdit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">บันทึก</button>
                    <button id="cancelEdit" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ยกเลิก</button>
                </div>
            </div>
        </div>
    </div>
  </div>
  );
}
