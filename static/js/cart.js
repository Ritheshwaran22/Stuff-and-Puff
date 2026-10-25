/**
 * Stuff & Puff | Chengalpattu - Shopping Cart & Ordering Engine
 * Handles Cart persistence, multi-portion sauce customization, parcel calculation (₹5/item),
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
            name: item.name || '',
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity, 10) || 1,
            isParcel: Boolean(item.isParcel),
            addons: Array.isArray(item.addons) ? item.addons.map(a => {
              const aId = parseInt(a.id, 10);
              return {
                id: isNaN(aId) ? a.id : aId,
                name: a.name,
                price: parseFloat(a.price) || 0
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

  function removeLineByIndex(index) {
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);
      saveCart();
    }
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

  function getItemCountInCart(itemId) {
    const numId = parseInt(itemId, 10);
    const idToMatch = isNaN(numId) ? String(itemId) : numId;
    return cart.reduce((sum, item) => {
      if (item.id === idToMatch || String(item.id) === String(idToMatch)) {
        return sum + (parseInt(item.quantity, 10) || 0);
      }
      return sum;
    }, 0);
  }

  function updateMenuButtons() {
    document.querySelectorAll('.menu-card').forEach(card => {
      const btn = card.querySelector('.btn-add');
      const qtyWrap = card.querySelector('.menu-qty-control');
      if (!btn) return;

      const rawId = btn.dataset.itemId;
      if (!rawId) return;

      const count = getItemCountInCart(rawId);
      const isCustomizable = btn.classList.contains('js-customize-item');

      if (count > 0 && !btn.disabled) {
        if (!qtyWrap) {
          const newQtyWrap = document.createElement('div');
          newQtyWrap.className = 'menu-qty-control';
          newQtyWrap.innerHTML = `
            <button type="button" class="btn-qty-menu btn-qty-dec" data-item-id="${rawId}" aria-label="Decrease quantity">−</button>
            <span class="menu-qty-val">${count}</span>
            <button type="button" class="btn-qty-menu btn-qty-inc" data-item-id="${rawId}" aria-label="Increase quantity">+</button>
          `;
          btn.style.display = 'none';
          btn.parentNode.insertBefore(newQtyWrap, btn);
        } else {
          qtyWrap.style.display = 'inline-flex';
          const valSpan = qtyWrap.querySelector('.menu-qty-val');
          if (valSpan) valSpan.textContent = count;
          btn.style.display = 'none';
        }
      } else {
        if (qtyWrap) qtyWrap.style.display = 'none';
        btn.style.display = 'inline-flex';
      }
    });
  }

  function updateCartUI() {
    const summary = getCartSummary();
    const stickyBar = document.getElementById('stickyCartBar');
    const stickyCount = document.getElementById('stickyCartCount');
    const stickyTotal = document.getElementById('stickyCartTotal');
    const navCartBadge = document.getElementById('navCartBadge');
    const desktopCartBadge = document.getElementById('desktopCartBadge');

    // Toggle body class for mobile bottom padding reservation
    if (summary.totalItems > 0) {
      document.body.classList.add('has-cart-items');
    } else {
      document.body.classList.remove('has-cart-items');
    }

    if (navCartBadge) {
      navCartBadge.textContent = summary.totalItems;
      navCartBadge.style.display = summary.totalItems > 0 ? 'inline-block' : 'none';
    }

    if (desktopCartBadge) {
      desktopCartBadge.textContent = `${summary.totalItems} item${summary.totalItems === 1 ? '' : 's'}`;
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

    renderAllCartViews(summary);
    updateMenuButtons();
  }

  function renderAllCartViews(summary) {
    const modalList = document.getElementById('cartItemsList');
    const modalBreakdown = document.getElementById('cartPriceBreakdown');
    const modalCheckoutBtn = document.getElementById('cartModalCheckoutBtn');

    const desktopList = document.getElementById('desktopCartItemsList');
    const desktopBreakdown = document.getElementById('desktopCartPriceBreakdown');
    const desktopCheckoutBtn = document.getElementById('desktopCheckoutBtn');

    if (cart.length === 0) {
      const emptyHtml = `
        <div class="empty-cart-view" style="text-align:center; padding: 28px 14px;">
          <div style="font-size: 2rem; margin-bottom: 6px;">🛒</div>
          <p style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 2px;">Your cart is empty</p>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Add momos, waffles, or buns from the menu to start ordering!</p>
        </div>
      `;

      if (modalList) modalList.innerHTML = emptyHtml;
      if (modalBreakdown) modalBreakdown.style.display = 'none';
      if (modalCheckoutBtn) modalCheckoutBtn.disabled = true;

      if (desktopList) desktopList.innerHTML = emptyHtml;
      if (desktopBreakdown) desktopBreakdown.style.display = 'none';
      if (desktopCheckoutBtn) desktopCheckoutBtn.disabled = true;
      return;
    }

    let itemsHtml = '';
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

      itemsHtml += `
        <div class="cart-item-row" data-index="${index}">
          <div class="cart-item-main">
            <div>
              <div class="cart-item-title">${item.name}</div>
              ${addonNames.length > 0 ? `<div class="cart-item-addons">+ ${addonNames.join(', ')}</div>` : '<div class="cart-item-addons" style="color:var(--text-muted);">Classic / No Sauce</div>'}
              ${item.isParcel ? `<div class="cart-item-parcel-tag">Takeaway Parcel (+₹${parcelChargeForLine.toFixed(0)})</div>` : ''}
            </div>
            <div class="cart-item-price">₹${lineTotal.toFixed(2)}</div>
          </div>
          <div class="cart-item-actions">
            <label class="cart-parcel-toggle">
              <input type="checkbox" class="cart-parcel-cb" data-index="${index}" ${item.isParcel ? 'checked' : ''}>
              Takeaway packaging (+₹5/item)
            </label>
            <div class="qty-control">
              <button type="button" class="qty-btn btn-cart-dec" data-index="${index}" aria-label="Decrease quantity">−</button>
              <span class="qty-val">${q}</span>
              <button type="button" class="qty-btn btn-cart-inc" data-index="${index}" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      `;
    });

    const breakdownHtml = `
      <div class="price-row">
        <span>Items Subtotal</span>
        <span>₹${summary.itemsSubtotal.toFixed(2)}</span>
      </div>
      ${summary.addonsSubtotal > 0 ? `
        <div class="price-row">
          <span>Signature Sauces / Add-ons</span>
          <span>+₹${summary.addonsSubtotal.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="price-row highlight">
        <span>Parcel Packaging (${summary.totalParcelQty} × ₹5.00)</span>
        <span>₹${summary.parcelTotal.toFixed(2)}</span>
      </div>
      <div class="parcel-notice">
        Parcel charge is ₹5 per takeaway item quantity for sturdy, hygienic packaging.
      </div>
      <div class="price-row total">
        <span>Total To Pay</span>
        <span>₹${summary.grandTotal.toFixed(2)}</span>
      </div>
    `;

    // Render into modal
    if (modalList) modalList.innerHTML = itemsHtml;
    if (modalBreakdown) {
      modalBreakdown.innerHTML = breakdownHtml;
      modalBreakdown.style.display = 'flex';
    }
    if (modalCheckoutBtn) modalCheckoutBtn.disabled = false;

    // Render into desktop sidebar
    if (desktopList) desktopList.innerHTML = itemsHtml;
    if (desktopBreakdown) {
      desktopBreakdown.innerHTML = breakdownHtml;
      desktopBreakdown.style.display = 'flex';
    }
    if (desktopCheckoutBtn) desktopCheckoutBtn.disabled = false;
  }

  // Add Item to Cart
  function addToCart(item) {
    const numId = parseInt(item.id, 10);
    const normId = isNaN(numId) ? item.id : numId;
    const normAddons = (item.addons || []).map(a => {
      const aId = parseInt(a.id, 10);
      return {
        id: isNaN(aId) ? a.id : aId,
        name: a.name,
        price: parseFloat(a.price) || 0
      };
    });
    // Generate unique line key
    const addonIds = normAddons.map(a => a.id).sort().join('_');
    const parcelKey = item.isParcel ? 'parcel' : 'dine';
    const lineKey = `${normId}_${addonIds}_${parcelKey}`;

    const existing = cart.find(entry => entry.lineKey === lineKey);
    if (existing) {
      existing.quantity += parseInt(item.quantity, 10) || 1;
    } else {
      cart.push({
        id: normId,
        name: item.name,
        price: parseFloat(item.price) || 0,
        addons: normAddons,
        lineKey,
        isParcel: Boolean(item.isParcel),
        quantity: parseInt(item.quantity, 10) || 1
      });
    }
    saveCart();
  }

  // Global window functions for UI binding
  window.SPCart = {
    getCart: () => cart,
    getSummary: getCartSummary,
    getItemCount: getItemCountInCart,
    clearCart: () => {
      cart = [];
      saveCart();
    },
    removeItemById: (itemId) => {
      removeItemById(itemId);
    },
    removeLineByIndex: (index) => {
      removeLineByIndex(index);
    },
    addItem: (item) => {
      addToCart(item);
      openCartModal();
    },
    addMultiplePortions: (baseItem, portionsArray, isParcel) => {
      // Group portions by sauce ID
      const groups = {};
      portionsArray.forEach(p => {
        const sauceId = p.sauce ? p.sauce.id : 'nosauce';
        if (!groups[sauceId]) {
          groups[sauceId] = {
            sauce: p.sauce,
            qty: 0
          };
        }
        groups[sauceId].qty += 1;
      });

      Object.values(groups).forEach(g => {
        addToCart({
          id: baseItem.id,
          name: baseItem.name,
          price: baseItem.price,
          quantity: g.qty,
          isParcel: Boolean(isParcel),
          addons: g.sauce ? [g.sauce] : []
        });
      });

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

    // Delegate menu quantity buttons on cards
    document.addEventListener('click', (e) => {
      const incBtn = e.target.closest('.btn-qty-inc');
      const decBtn = e.target.closest('.btn-qty-dec');

      if (incBtn) {
        const rawId = incBtn.dataset.itemId;
        const card = incBtn.closest('.menu-card');
        const custBtn = card ? card.querySelector('.js-customize-item') : null;
        if (custBtn) {
          // Customizable item -> open customize sheet to configure new portion!
          custBtn.click();
        } else {
          // Non-customizable item -> directly increment in cart
          const existing = cart.find(it => String(it.id) === String(rawId));
          if (existing) {
            existing.quantity += 1;
            saveCart();
          }
        }
      } else if (decBtn) {
        const rawId = decBtn.dataset.itemId;
        // Find matching item lines in cart
        const matchingLines = [];
        cart.forEach((it, idx) => {
          if (String(it.id) === String(rawId)) {
            matchingLines.push(idx);
          }
        });

        if (matchingLines.length > 0) {
          // Decrement the last added line
          const lastIndex = matchingLines[matchingLines.length - 1];
          cart[lastIndex].quantity -= 1;
          if (cart[lastIndex].quantity <= 0) {
            cart.splice(lastIndex, 1);
          }
          saveCart();
        }
      }
    });

    // Delegate cart item interactions (+, -, parcel checkbox) for both modal and desktop sidebar
    document.addEventListener('click', (e) => {
      const incBtn = e.target.closest('.btn-cart-inc');
      const decBtn = e.target.closest('.btn-cart-dec');
      const desktopCheckout = e.target.closest('#desktopCheckoutBtn');

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
      } else if (desktopCheckout) {
        if (cart.length > 0) {
          window.location.href = '/checkout/';
        }
      }
    });

    document.addEventListener('change', (e) => {
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

    // Mobile Modal Checkout button click
    const checkoutBtn = document.getElementById('cartModalCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        window.location.href = '/checkout/';
      });
    }
  });

})();
