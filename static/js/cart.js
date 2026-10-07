/**
 * Stuff & Puff | Chengalpattu - Shopping Cart & Ordering Engine
 * Handles Cart persistence, add-on selection, parcel calculation (₹5/item),
 * and checkout handoff.
 */

(function() {
  const STORAGE_KEY = 'sp_chengalpattu_cart_v1';
  const PARCEL_UNIT_RATE = 5.0; // ₹5 per parcel item quantity

  let cart = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        cart = parsed.map(item => {
          if (!item) return null;
          const numId = parseInt(item.id, 10);
          const normalizedItem = {
            ...item,
            id: isNaN(numId) ? item.id : numId,
            quantity: parseInt(item.quantity, 10) || 1,
            addons: Array.isArray(item.addons) ? item.addons.map(a => {
              const aId = parseInt(a.id, 10);
              return {
                ...a,
                id: isNaN(aId) ? a.id : aId
              };
            }) : []
          };
          const addonIds = (normalizedItem.addons || []).map(a => a.id).sort().join('_');
          const parcelKey = normalizedItem.isParcel ? 'parcel' : 'dine';
          normalizedItem.lineKey = `${normalizedItem.id}_${addonIds}_${parcelKey}`;
          return normalizedItem;
        }).filter(Boolean);
      }
    }
  } catch (e) {
    cart = [];
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
    updateCartUI();
  }

  function removeItemById(itemId) {
    if (itemId === null || itemId === undefined) return;
    const idStr = String(itemId);
    cart = cart.filter(item => String(item.id) !== idStr);
    saveCart();
  }

  function getCartSummary() {
    let totalItems = 0;
    let itemsSubtotal = 0;
    let addonsSubtotal = 0;
    let totalParcelQty = 0;

    cart.forEach(item => {
      const q = parseInt(item.quantity, 10) || 1;
      totalItems += q;
      itemsSubtotal += (parseFloat(item.price) || 0) * q;

      let itemAddonPriceSum = 0;
      if (item.addons && Array.isArray(item.addons)) {
        item.addons.forEach(a => {
          itemAddonPriceSum += parseFloat(a.price) || 0;
        });
      }
      addonsSubtotal += itemAddonPriceSum * q;

      if (item.isParcel) {
        totalParcelQty += q;
      }
    });

    const parcelTotal = totalParcelQty * PARCEL_UNIT_RATE;
    const grandTotal = itemsSubtotal + addonsSubtotal + parcelTotal;

    return {
      totalItems,
      itemsSubtotal,
      addonsSubtotal,
      totalParcelQty,
      parcelTotal,
      grandTotal
    };
  }

  function updateCartUI() {
    const summary = getCartSummary();
    const stickyBar = document.getElementById('stickyCartBar');
    const stickyCount = document.getElementById('stickyCartCount');
    const stickyTotal = document.getElementById('stickyCartTotal');
    const navCartBadge = document.getElementById('navCartBadge');

    if (navCartBadge) {
      navCartBadge.textContent = summary.totalItems;
      navCartBadge.style.display = summary.totalItems > 0 ? 'inline-block' : 'none';
    }

    if (stickyBar) {
      if (summary.totalItems > 0) {
        stickyBar.classList.remove('hidden');
        if (stickyCount) {
          stickyCount.textContent = `${summary.totalItems} item${summary.totalItems > 1 ? 's' : ''}`;
        }
        if (stickyTotal) {
          stickyTotal.textContent = `₹${summary.grandTotal.toFixed(2)}`;
        }
      } else {
        stickyBar.classList.add('hidden');
      }
    }

    renderCartModalItems(summary);
  }

  function renderCartModalItems(summary) {
    const listContainer = document.getElementById('cartItemsList');
    if (!listContainer) return;

    if (cart.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding: 32px 16px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🛒</div>
          <p style="font-weight: 600;">Your cart is empty</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">Select fresh momos, waffles, or buns from the menu to get started!</p>
        </div>
      `;
      const checkoutBtn = document.getElementById('cartModalCheckoutBtn');
      if (checkoutBtn) checkoutBtn.disabled = true;

      const breakdown = document.getElementById('cartPriceBreakdown');
      if (breakdown) breakdown.style.display = 'none';
      return;
    }

    let html = '';
    cart.forEach((item, index) => {
      const q = parseInt(item.quantity, 10) || 1;
      const basePrice = (parseFloat(item.price) || 0) * q;
      let addonPriceSum = 0;
      let addonNames = [];

      if (item.addons && item.addons.length > 0) {
        item.addons.forEach(a => {
          addonPriceSum += (parseFloat(a.price) || 0) * q;
          addonNames.push(a.name);
        });
      }

      const lineTotal = basePrice + addonPriceSum;
      const parcelChargeForLine = item.isParcel ? (q * PARCEL_UNIT_RATE) : 0;

      html += `
        <div class="cart-item-row" data-index="${index}">
          <div class="cart-item-main">
            <div>
              <div class="cart-item-title">${item.name}</div>
              ${addonNames.length > 0 ? `<div class="cart-item-addons">+ ${addonNames.join(', ')}</div>` : ''}
              ${item.isParcel ? `<div style="font-size:0.75rem; color:#E8590C; font-weight:600;">Parcel (+₹${parcelChargeForLine.toFixed(0)})</div>` : ''}
            </div>
            <div class="cart-item-price">₹${lineTotal.toFixed(2)}</div>
          </div>
          <div class="cart-item-actions">
            <label class="cart-parcel-toggle">
              <input type="checkbox" class="cart-parcel-cb" data-index="${index}" ${item.isParcel ? 'checked' : ''}>
              Pack for Parcel (+₹5/item)
            </label>
            <div class="qty-control">
              <button type="button" class="qty-btn btn-cart-dec" data-index="${index}">−</button>
              <span class="qty-val">${q}</span>
              <button type="button" class="qty-btn btn-cart-inc" data-index="${index}">+</button>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    const breakdown = document.getElementById('cartPriceBreakdown');
    if (breakdown) {
      breakdown.style.display = 'flex';
      breakdown.innerHTML = `
        <div class="price-row">
          <span>Items Subtotal</span>
          <span>₹${summary.itemsSubtotal.toFixed(2)}</span>
        </div>
        ${summary.addonsSubtotal > 0 ? `
          <div class="price-row">
            <span>Add-ons / Sauces</span>
            <span>+₹${summary.addonsSubtotal.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="price-row highlight">
          <span>Parcel Charges (${summary.totalParcelQty} × ₹5.00)</span>
          <span>₹${summary.parcelTotal.toFixed(2)}</span>
        </div>
        <div class="parcel-notice">
          Parcel charge is ₹5 per quantity of takeaway items to ensure safe packaging.
        </div>
        <div class="price-row total">
          <span>To Pay</span>
          <span>₹${summary.grandTotal.toFixed(2)}</span>
        </div>
      `;
    }

    const checkoutBtn = document.getElementById('cartModalCheckoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = false;
  }

  // Add Item to Cart
  function addToCart(item) {
    const numId = parseInt(item.id, 10);
    const normId = isNaN(numId) ? item.id : numId;
    const normAddons = (item.addons || []).map(a => {
      const aId = parseInt(a.id, 10);
      return {
        ...a,
        id: isNaN(aId) ? a.id : aId
      };
    });
    // Generate a unique line key based on itemId, selected addons, and parcel state
    const addonIds = normAddons.map(a => a.id).sort().join('_');
    const parcelKey = item.isParcel ? 'parcel' : 'dine';
    const lineKey = `${normId}_${addonIds}_${parcelKey}`;

    const existing = cart.find(entry => entry.lineKey === lineKey);
    if (existing) {
      existing.quantity += parseInt(item.quantity, 10) || 1;
    } else {
      cart.push({
        ...item,
        id: normId,
        addons: normAddons,
        lineKey,
        quantity: parseInt(item.quantity, 10) || 1
      });
    }
    saveCart();
  }

  // Global window functions for UI binding
  window.SPCart = {
    getCart: () => cart,
    getSummary: getCartSummary,
    clearCart: () => {
      cart = [];
      saveCart();
    },
    removeItemById: (itemId) => {
      removeItemById(itemId);
    },
    addItem: (item) => {
      addToCart(item);
      openCartModal();
    },
    openModal: () => openCartModal(),
    closeModal: () => closeCartModal(),
  };

  function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
      updateCartUI();
      modal.classList.add('active');
    }
  }

  function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.remove('active');
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // Open Cart buttons
    document.querySelectorAll('.js-open-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartModal();
      });
    });

    // Close Modal buttons
    document.querySelectorAll('.js-close-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeCartModal();
      });
    });

    // Modal background click
    const modal = document.getElementById('cartModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCartModal();
      });
    }

    // Delegate cart item interactions (+, -, parcel checkbox)
    const listContainer = document.getElementById('cartItemsList');
    if (listContainer) {
      listContainer.addEventListener('click', (e) => {
        const incBtn = e.target.closest('.btn-cart-inc');
        const decBtn = e.target.closest('.btn-cart-dec');

        if (incBtn) {
          const index = parseInt(incBtn.dataset.index, 10);
          if (cart[index]) {
            cart[index].quantity += 1;
            saveCart();
          }
        } else if (decBtn) {
          const index = parseInt(decBtn.dataset.index, 10);
          if (cart[index]) {
            cart[index].quantity -= 1;
            if (cart[index].quantity <= 0) {
              cart.splice(index, 1);
            }
            saveCart();
          }
        }
      });

      listContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('cart-parcel-cb')) {
          const index = parseInt(e.target.dataset.index, 10);
          if (cart[index]) {
            cart[index].isParcel = e.target.checked;
            // Update lineKey
            const addonIds = (cart[index].addons || []).map(a => a.id).sort().join('_');
            const parcelKey = cart[index].isParcel ? 'parcel' : 'dine';
            cart[index].lineKey = `${cart[index].id}_${addonIds}_${parcelKey}`;
            saveCart();
          }
        }
      });
    }

    // Checkout button click
    const checkoutBtn = document.getElementById('cartModalCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        window.location.href = '/checkout/';
      });
    }
  });

})();
