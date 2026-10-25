# STUFF & PUFF — Standalone Cinematic Food Website Prototype

A standalone frontend prototype for the real street-food brand **STUFF & PUFF**, based in Chengalpattu, Tamil Nadu.

Created strictly for evaluating art direction, typography, Motion.dev animation components, responsive mobile ergonomics, and the complete customer ordering journey.

---

## 🚀 Running Locally

From this directory (`stuff-and-puff-prototype`):

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the local Vite development server
npm run dev

# Or to expose on local network for mobile phone testing:
npm run dev -- --host
```

Access the application in your browser:
- **Local:** `http://127.0.0.1:5173/` or `http://localhost:5173/`
- **On Mobile:** Connect your phone to the same Wi-Fi network and open the `http://<YOUR-LOCAL-IP>:5173/` address printed in the terminal.

---

## 🎨 Visual Identity & Art Direction

- **Color Palette:**
  - Background & Surfaces: Deep charcoal `#0D0D0F`, `#151518`, `#1E1E23`, `#28282F`
  - Warm Editorial Neutral: Warm cream `#F5EFEB`, `#D1C7BD`, `#9E9388`
  - Primary Street Accent: Restrained burnt orange `#DF4A18`, `#F25C26`
  - Warm Food Accent: Golden honey `#E5A93B`
- **Typography:**
  - Display Headlines: `Syne` (Bold, structural display typeface)
  - Interface & Body: `Outfit` (Clean, legible geometric sans)
  - Tokens & Metrics: `JetBrains Mono` (Numeric data, slot timing, prices)
- **Accessibility:**
  - Native `prefers-reduced-motion` integration via `motion/react`'s `useReducedMotion()`.

---

## 🥟 Authentic Menu & Prices (Zero Invented Products)

### 1. Momos
- **Veg Momos:** ₹70
- **Corn Momos:** ₹90
- **Paneer Momos:** ₹80
- **Chicken Momos:** ₹100
- **Mixed Momos:** ₹120

#### Pan-Fry Sauce Customization (+₹50 each)
1. **Dragon Blaze:** Sichuan wok toss, bird’s eye chili, dark soya, toasted sesame.
2. **Fiery Fusion:** Smoked chili paste reduction, garlic embers, spring onion.
3. **Cheese Volcano:** Molten cream cheese tossed with hot chili oil and peppercorn.
4. **Honey Garlic Cheese Blast:** Sweet amber honey glaze with roasted garlic bits and cheese.
5. **Garlic Cheese Blast:** Minced burnt garlic, bubbling mozzarella, red pepper flakes.
*(Option for Classic Steamed with no sauce surcharge is also provided).*

### 2. Waffles
- **Single Waffle (Single Piece):** ₹50
- **White:** ₹80
- **Milk:** ₹80
- **Dark:** ₹100
- **ButterScotch:** ₹100
- **Hazelnut:** ₹100
- **Double Choco:** ₹110
- **Triple Choco:** ₹120

### 3. Sweet Buns (Authentic South Indian Roadside Comfort — No Burgers!)
- **Bun Butter Jam:** ₹40
- **Bun Palkova (Pakova Bun):** ₹50
- **Bun Gulkand:** ₹50
- **Choco Bun:** ₹50

### Takeaway Parcel Charge
- **₹5.00 per item** automatically computed in subtotal and checkout.

---

## 🎬 Customer Journey Scenes

1. **Scene 01 — Short Intro:** 1.1s brand entrance with tap-to-enter skip.
2. **Scene 02 — Cinematic Hero:** Split composition on desktop, thumb-first layout on mobile, showcasing all three food worlds.
3. **Scene 03 — Brand Story:** "HOT. FRESH. MADE TO ORDER."
4. **Scene 04 — Three Food Worlds:**
   - Momos: Interactive 5-sauce wok explorer with spice ratings.
   - Waffles: Asymmetric golden cast-iron grid showcase.
   - Buns: Nostalgic tea-stall horizontal strip.
5. **Scene 05 — Practical Fast Menu:** Thumb-navigable category pills, clean row layout.
6. **Product Customization:** Bottom sheet for momos with real-time price updates.
7. **Cart & Sticky Bar:** Floating mobile pill dock and slide-over drawer with item management.
8. **Checkout:** Name & Indian mobile number validation, summary breakdown.
9. **Pickup Slot Selector:** 10-minute slots between 5:00 PM and 10:00 PM with 20-minute cooking buffer and booked slot states.
10. **Payment Simulation:** Simulated gateway roundtrip with unique token generation (e.g. `SP-1082`).
11. **Live Order Status:** 4-step stepper (`Confirmed` → `Preparing` → `Ready for Pickup` → `Completed`) with interactive step progression.
12. **Location:** Stylized cartographic vector map and takeaway instructions for GH Bus Stop, Chengalpattu.

---

## 📷 Photography Documentation (Rule 3 Compliance)

Zero AI-generated images were used. All imagery consists of genuine food photographs under commercial-use Unsplash licenses:

| Subject | Photographer | License | Source |
|---|---|---|---|
| Momos (Steamer) | Rathaphon Nanthapreecha | Unsplash License (Commercial Use) | `https://unsplash.com/photos/EB3h8rV4_gQ` |
| Momos (Pan-Fry / Sauce) | Mae Mu | Unsplash License (Commercial Use) | `https://unsplash.com/photos/W7OKvvbmsfM` |
| Waffles (Glaze & Berries) | Slashio Photography | Unsplash License (Commercial Use) | `https://unsplash.com/photos/UfETna4IUuY` |
| Waffles (Chocolate Drizzle) | Toa Heftiba | Unsplash License (Commercial Use) | `https://unsplash.com/photos/9-nN_1BvV3c` |
| Buns (Bakery Crust) | Wesual Click | Unsplash License (Commercial Use) | `https://unsplash.com/photos/qwtm3nzqJpU` |
| Buns (Butter & Jam) | Calum Lewis | Unsplash License (Commercial Use) | `https://unsplash.com/photos/9A8w2X678cQ` |
