/* ==========================================================================
   VALLUMMAS PICKLES - JAVASCRIPT LOGIC
   Features:
   - Dynamic weight & price switcher
   - Product image view toggle (Jar / Dish)
   - Cart management (add, update, delete, localStorage persist)
   - 1-Click WhatsApp Order compiler & direct checkout
   - FAQ Accordion
   - WhatsApp Floating widget & quick prompts
   - Toast notification feedback
   ========================================================================== */

const WHATSAPP_PHONE = "918139818893";

// Products Catalog Data
const PRODUCTS_DATA = {
  beef: {
    id: "beef",
    name: "Kerala Beef Pickle",
    subtitle: "Signature Malabar tender beef fried with roasted coconut bits & curry leaves",
    thumb: "assets/images/product-beef-jar.jpg",
    spice: "🌶️🌶️🌶️ Fiery Malabar",
    weights: {
      "250g": { price: 299, mrp: 350 },
      "400g": { price: 499, mrp: 580 },
      "1kg":  { price: 949, mrp: 1100 }
    },
    defaultWeight: "400g"
  },
  chicken: {
    id: "chicken",
    name: "Homestyle Chicken Pickle",
    subtitle: "Boneless succulent chicken slow-simmered in ginger-garlic-chili gravy",
    thumb: "assets/images/product-chicken-jar.jpg",
    spice: "🌶️🌶️ Medium-Hot",
    weights: {
      "250g": { price: 269, mrp: 320 },
      "400g": { price: 449, mrp: 520 },
      "1kg":  { price: 849, mrp: 990 }
    },
    defaultWeight: "400g"
  },
  fish: {
    id: "fish",
    name: "Traditional Fish Pickle",
    subtitle: "Premium King Fish (Neymeen) marinated in Malabar spices and vinegar brine",
    thumb: "assets/images/product-fish-jar.jpg",
    spice: "🌶️🌶️🌶️ Tangy & Spicy",
    weights: {
      "250g": { price: 349, mrp: 420 },
      "400g": { price: 579, mrp: 680 },
      "1kg":  { price: 1099, mrp: 1250 }
    },
    defaultWeight: "400g"
  }
};

// Current Card States (Weight, Qty)
const cardStates = {
  beef: { weight: "400g", qty: 1 },
  chicken: { weight: "400g", qty: 1 },
  fish: { weight: "400g", qty: 1 }
};

// Cart State (Persisted in localStorage)
let cart = [];

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem("vallumma_cart") || localStorage.getItem("vellumma_cart");
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Could not load cart from storage", e);
    cart = [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem("vallumma_cart", JSON.stringify(cart));
  } catch (e) {
    console.error("Could not save cart", e);
  }
}

// Format currency
function formatINR(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

/* ==========================================================================
   PRODUCT CARDS INTERACTION
   ========================================================================== */

function initProductCards() {
  // Setup weight buttons
  document.querySelectorAll(".product-card").forEach(card => {
    const productId = card.getAttribute("data-product-id");
    if (!productId || !PRODUCTS_DATA[productId]) return;

    const data = PRODUCTS_DATA[productId];
    const weightButtons = card.querySelectorAll(".weight-option-btn");
    const priceDisplay = card.querySelector(".price-current");
    const mrpDisplay = card.querySelector(".price-mrp-strike");
    const qtyDisplay = card.querySelector(".qty-display-num");
    const minusBtn = card.querySelector(".qty-btn-minus");
    const plusBtn = card.querySelector(".qty-btn-plus");
    const whatsappBtn = card.querySelector(".btn-card-whatsapp");
    const addCartBtn = card.querySelector(".btn-card-add-cart");

    // Weight switch
    weightButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        weightButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        const selectedWeight = btn.getAttribute("data-weight");
        cardStates[productId].weight = selectedWeight;
        updateCardPrice(productId, card);
      });
    });

    // Quantity controls
    if (minusBtn && plusBtn) {
      minusBtn.addEventListener("click", () => {
        if (cardStates[productId].qty > 1) {
          cardStates[productId].qty -= 1;
          qtyDisplay.textContent = cardStates[productId].qty;
          updateCardPrice(productId, card);
        }
      });

      plusBtn.addEventListener("click", () => {
        if (cardStates[productId].qty < 20) {
          cardStates[productId].qty += 1;
          qtyDisplay.textContent = cardStates[productId].qty;
          updateCardPrice(productId, card);
        }
      });
    }

    // Direct WhatsApp Button from Card
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", () => {
        const state = cardStates[productId];
        const weightConfig = data.weights[state.weight];
        const totalPrice = weightConfig.price * state.qty;

        const message = 
`🌶️ *ORDER INQUIRY - VALLUMMAS PICKLES*
----------------------------------------
Item: *${data.name}*
Weight: *${state.weight}*
Quantity: *${state.qty}*
Total Amount: *${formatINR(totalPrice)}*
----------------------------------------
📍 Destination: Edappal, Malappuram / Pan-India Delivery
Hello, I'd like to order this delicious homemade pickle. Please share payment details & delivery schedule!`;

        const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
      });
    }

    // Add to Cart Button from Card
    if (addCartBtn) {
      addCartBtn.addEventListener("click", () => {
        const state = cardStates[productId];
        addToCart(productId, state.weight, state.qty);
        showToast(`Added ${state.qty}x ${data.name} (${state.weight}) to cart!`);
      });
    }

    // Image view toggle (Jar vs Dish)
    const viewButtons = card.querySelectorAll(".view-btn");
    const mainImg = card.querySelector(".product-img");
    if (viewButtons.length && mainImg) {
      viewButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          viewButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const viewType = btn.getAttribute("data-view");
          const newSrc = mainImg.getAttribute(`data-src-${viewType}`);
          if (newSrc) {
            mainImg.style.opacity = "0.4";
            setTimeout(() => {
              mainImg.src = newSrc;
              mainImg.style.opacity = "1";
            }, 120);
          }
        });
      });
    }

    // Initialize initial price
    updateCardPrice(productId, card);
  });
}

function updateCardPrice(productId, card) {
  const data = PRODUCTS_DATA[productId];
  const state = cardStates[productId];
  const weightData = data.weights[state.weight];
  if (!weightData) return;

  const priceCurrent = card.querySelector(".price-current");
  const priceMrp = card.querySelector(".price-mrp-strike");

  const totalCurrent = weightData.price * state.qty;
  const totalMrp = weightData.mrp * state.qty;

  if (priceCurrent) priceCurrent.textContent = formatINR(totalCurrent);
  if (priceMrp) priceMrp.textContent = formatINR(totalMrp);
}

/* ==========================================================================
   CART OPERATIONS & MODAL DRAWER
   ========================================================================== */

function addToCart(productId, weight, qty) {
  const productData = PRODUCTS_DATA[productId];
  if (!productData) return;

  const existingIndex = cart.findIndex(item => item.productId === productId && item.weight === weight);

  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({
      productId,
      title: productData.name,
      thumb: productData.thumb,
      weight,
      unitPrice: productData.weights[weight].price,
      qty
    });
  }

  saveCartToStorage();
  updateCartUI();
}

function updateCartItemQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCartToStorage();
  updateCartUI();
}

function removeCartItem(index) {
  if (cart[index]) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
  }
}

function calculateCartSubtotal() {
  return cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
}

function getCartItemCount() {
  return cart.reduce((count, item) => count + item.qty, 0);
}

function updateCartUI() {
  const badgeCounts = document.querySelectorAll(".cart-badge-count");
  const totalCount = getCartItemCount();
  badgeCounts.forEach(badge => {
    badge.textContent = totalCount;
  });

  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartEmptyState = document.getElementById("cartEmptyState");
  const cartFooter = document.getElementById("cartDrawerFooter");
  const subtotalEl = document.getElementById("cartSubtotalAmount");
  const grandTotalEl = document.getElementById("cartGrandTotalAmount");

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "";
    if (cartEmptyState) cartEmptyState.style.display = "flex";
    if (cartFooter) cartFooter.style.display = "none";
  } else {
    if (cartEmptyState) cartEmptyState.style.display = "none";
    if (cartFooter) cartFooter.style.display = "block";

    const subtotal = calculateCartSubtotal();
    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (grandTotalEl) grandTotalEl.textContent = formatINR(subtotal);

    cartItemsContainer.innerHTML = cart.map((item, index) => {
      const lineTotal = item.unitPrice * item.qty;
      return `
        <div class="cart-item-card">
          <div class="cart-item-thumb">
            <img src="${item.thumb}" alt="${item.title}">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-weight">Net Wt: ${item.weight}</div>
            <div class="cart-item-price-row">
              <span class="cart-item-price">${formatINR(lineTotal)}</span>
              <div class="cart-item-qty">
                <button type="button" onclick="updateCartItemQty(${index}, -1)" aria-label="Decrease quantity">−</button>
                <span>${item.qty}</span>
                <button type="button" onclick="updateCartItemQty(${index}, 1)" aria-label="Increase quantity">+</button>
              </div>
            </div>
          </div>
          <button type="button" class="cart-item-remove-btn" onclick="removeCartItem(${index})" title="Remove item" aria-label="Remove item">✕</button>
        </div>
      `;
    }).join("");
  }
}

// Drawer Toggle Handlers
function openCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartDrawerOverlay");
  if (drawer && overlay) {
    drawer.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartDrawerOverlay");
  if (drawer && overlay) {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// 1-Click WhatsApp Order Compilation
function setupCartCheckout() {
  const checkoutBtn = document.getElementById("btnCheckoutWhatsApp");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Your cart is empty. Please add pickles!");
      return;
    }

    const nameInput = document.getElementById("cartCustomerName");
    const locationInput = document.getElementById("cartCustomerLocation");
    const notesInput = document.getElementById("cartCustomerNotes");

    const custName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Valued Customer";
    const custLoc = locationInput && locationInput.value.trim() ? locationInput.value.trim() : "Pan-India Address to be shared";
    const custNotes = notesInput && notesInput.value.trim() ? notesInput.value.trim() : "None";

    const subtotal = calculateCartSubtotal();

    let itemsList = "";
    cart.forEach((item, i) => {
      itemsList += `${i + 1}. *${item.title}* (${item.weight}) x ${item.qty} = ${formatINR(item.unitPrice * item.qty)}\n`;
    });

    const orderText = 
`🌶️ *NEW ORDER - VALLUMMAS PICKLES* 🌶️
-----------------------------------------
👤 *Customer:* ${custName}
📍 *Delivery To:* ${custLoc}
📝 *Notes:* ${custNotes}

📦 *ORDER ITEMS:*
${itemsList}
💰 *TOTAL AMOUNT:* *${formatINR(subtotal)}*
-----------------------------------------
🚚 *All India Fast Delivery Request*
Hello Vallumma's team! I have compiled my order on your website. Please confirm availability, shipping fee & share UPI / GPay payment details.`;

    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(orderText)}`;
    window.open(waUrl, "_blank");
  });
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question-btn");
    btn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      
      // Close all others
      faqItems.forEach(other => {
        other.classList.remove("active");
        other.querySelector(".faq-question-btn").setAttribute("aria-expanded", "false");
      });

      // Toggle current
      if (!isActive) {
        item.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ==========================================================================
   WHATSAPP FLOATING POPUP & WIDGET
   ========================================================================== */
function initWhatsAppWidget() {
  const floatingBtn = document.getElementById("waFloatingBtn");
  const chatCard = document.getElementById("waChatCardModal");
  const promptBubble = document.getElementById("waPromptBubble");
  const closeBubbleBtn = document.getElementById("waCloseBubbleBtn");

  if (floatingBtn && chatCard) {
    floatingBtn.addEventListener("click", () => {
      chatCard.classList.toggle("active");
    });
  }

  if (promptBubble && chatCard) {
    promptBubble.addEventListener("click", (e) => {
      if (e.target !== closeBubbleBtn) {
        chatCard.classList.add("active");
      }
    });
  }

  if (closeBubbleBtn && promptBubble) {
    closeBubbleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      promptBubble.style.display = "none";
    });
  }

  // Quick prompt buttons
  document.querySelectorAll(".wa-quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const promptQuery = btn.getAttribute("data-query");
      let message = "Hi Vallumma's Pickles, I would like to order pickles!";
      if (promptQuery === "beef") {
        message = "Hi Vallumma's Pickles! I'm craving your Kerala Beef Pickle. Can you tell me the available batch details and price?";
      } else if (promptQuery === "delivery") {
        message = "Hi Vallumma's team! How much does delivery cost for my pin code and what is the transit timeline?";
      } else if (promptQuery === "combo") {
        message = "Hi Vallumma's Pickles! Do you offer a combo of Beef, Chicken & Fish pickles?";
      }

      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, "_blank");
      if (chatCard) chatCard.classList.remove("active");
    });
  });
}

/* ==========================================================================
   MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const closeBtn = document.getElementById("mobileMenuClose");
  const drawer = document.getElementById("mobileNavDrawer");
  const overlay = document.getElementById("mobileNavOverlay");

  function openNav() {
    if (drawer && overlay) {
      drawer.classList.add("active");
      overlay.classList.add("active");
    }
  }

  function closeNav() {
    if (drawer && overlay) {
      drawer.classList.remove("active");
      overlay.classList.remove("active");
    }
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (overlay) overlay.addEventListener("click", closeNav);

  document.querySelectorAll(".mobile-nav-links a").forEach(link => {
    link.addEventListener("click", closeNav);
  });
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
let toastTimeout;
function showToast(message) {
  let toast = document.getElementById("toastNotice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotice";
    toast.className = "toast-notice";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>🌶️</span> <span>${message}</span>`;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* ==========================================================================
   SCROLL-BASED 3D PRODUCT ANIMATION HERO ENGINE
   - 240 Frame Scrubbing via Canvas (images z/ezgif-frame-XXX.png)
   - Smooth LERP interpolation & RAF render loop
   - Progressive preloader with priority buffering
   - Dynamic story chapter overlays & progress dot triggers
   ========================================================================== */
function initHeroScrollAnimation() {
  const container = document.querySelector(".hero-scroll-container");
  const canvas = document.getElementById("heroAnimCanvas");
  if (!container || !canvas) return;

  const ctx = canvas.getContext("2d");
  const loader = document.getElementById("heroAnimLoader");

  const TOTAL_FRAMES = 240;
  const frames = new Array(TOTAL_FRAMES);
  const loadedSet = new Set();

  function getFramePath(idx) {
    const pad = String(idx + 1).padStart(3, "0");
    return `images z/ezgif-frame-${pad}.png`;
  }

  // Handle Canvas Resizing for High-DPI
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    renderCurrentFrame();
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });

  // Draw specific frame maintaining 16:9 aspect ratio centered
  function drawImageScaled(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgW = 1920;
    const imgH = 1080;
    const imgRatio = imgW / imgH;
    const canvasRatio = canvas.width / canvas.height;

    let drawW, drawH, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawH = canvas.height;
      drawW = drawH * imgRatio;
      drawX = (canvas.width - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvas.width;
      drawH = drawW / imgRatio;
      drawX = 0;
      drawY = (canvas.height - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // State
  let targetProgress = 0;
  let currentProgress = 0;
  let currentFrameIndex = 0;
  let isLoopRunning = false;

  function findClosestLoadedFrame(targetIdx) {
    if (loadedSet.has(targetIdx)) return frames[targetIdx];
    // Search outwards
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      if (targetIdx - offset >= 0 && loadedSet.has(targetIdx - offset)) {
        return frames[targetIdx - offset];
      }
      if (targetIdx + offset < TOTAL_FRAMES && loadedSet.has(targetIdx + offset)) {
        return frames[targetIdx + offset];
      }
    }
    return frames[0];
  }

  function renderCurrentFrame() {
    const img = findClosestLoadedFrame(currentFrameIndex);
    if (img) {
      drawImageScaled(img);
    }
  }

  // Preloader with priority queue & fallback handling
  function preloadImages() {
    function createFrameImage(index, onLoaded) {
      const img = new Image();
      const pad = String(index + 1).padStart(3, "0");
      img.onload = () => {
        loadedSet.add(index);
        if (onLoaded) onLoaded();
      };
      img.onerror = () => {
        if (!img._failCount) {
          img._failCount = 1;
          img.src = `image z/ezgif-frame-${pad}.png`;
        } else if (img._failCount === 1) {
          img._failCount = 2;
          img.src = `assets/frames/ezgif-frame-${pad}.png`;
        }
      };
      img.src = getFramePath(index);
      return img;
    }

    // 1. First frame immediate priority
    frames[0] = createFrameImage(0, () => {
      resizeCanvas();
      renderCurrentFrame();
      if (loader) loader.classList.add("hidden");
    });

    // 2. Next 35 frames for immediate responsiveness
    for (let i = 1; i < Math.min(35, TOTAL_FRAMES); i++) {
      frames[i] = createFrameImage(i);
    }

    // 3. Stagger remaining frames in background idle chunks
    let nextChunkStart = 35;
    const chunkSize = 20;

    function loadNextChunk() {
      if (nextChunkStart >= TOTAL_FRAMES) return;
      const end = Math.min(nextChunkStart + chunkSize, TOTAL_FRAMES);
      for (let i = nextChunkStart; i < end; i++) {
        if (!frames[i]) {
          frames[i] = createFrameImage(i);
        }
      }
      nextChunkStart = end;
      if (nextChunkStart < TOTAL_FRAMES) {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(loadNextChunk, { timeout: 1000 });
        } else {
          setTimeout(loadNextChunk, 80);
        }
      }
    }

    setTimeout(loadNextChunk, 200);
  }

  // Scroll Progress Calculation
  function calculateScroll() {
    const rect = container.getBoundingClientRect();
    const scrollTrack = container.offsetHeight - window.innerHeight;
    if (scrollTrack <= 0) return;

    const scrolled = -rect.top;
    const rawProgress = Math.max(0, Math.min(1, scrolled / scrollTrack));
    targetProgress = rawProgress;

    if (!isLoopRunning) {
      isLoopRunning = true;
      requestAnimationFrame(animationLoop);
    }
  }

  window.addEventListener("scroll", calculateScroll, { passive: true });

  // Main RAF Animation Loop
  function animationLoop() {
    const delta = targetProgress - currentProgress;
    // Smooth LERP factor
    currentProgress += delta * 0.16;

    if (Math.abs(delta) < 0.0005) {
      currentProgress = targetProgress;
    }

    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(currentProgress * (TOTAL_FRAMES - 1)));
    if (frameIndex !== currentFrameIndex) {
      currentFrameIndex = frameIndex;
      renderCurrentFrame();
    }

    if (Math.abs(targetProgress - currentProgress) > 0.0005) {
      requestAnimationFrame(animationLoop);
    } else {
      isLoopRunning = false;
    }
  }

  // Start preloading and setup initial render
  preloadImages();
  resizeCanvas();
  calculateScroll();
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  initHeroScrollAnimation();
  initProductCards();
  initFaqAccordion();
  initWhatsAppWidget();
  initMobileNav();
  setupCartCheckout();
  updateCartUI();

  // Attach Cart Drawer Triggers
  document.querySelectorAll(".cart-trigger-btn").forEach(btn => {
    btn.addEventListener("click", openCartDrawer);
  });

  const cartCloseBtn = document.getElementById("btnCloseCart");
  const cartOverlay = document.getElementById("cartDrawerOverlay");
  if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);
});
