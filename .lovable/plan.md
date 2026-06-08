Implement a high-quality visual overhaul for the Dog Food Game (/cachorro-racao) optimized for a 1080x1920 vertical totem.

### Visual Improvements
- **Environment**: Replace the plain blue background with a multi-layered pet exhibition scene.
  - **Sky Layer**: Gradient from RobustUS blue to a lighter shade.
  - **Floor Layer**: Grass green base with a "floor" perspective effect.
  - **Background Elements**: 
    - Floating brand shapes (white/orange).
    - Exhibition stands/booths represented by blurred rectangular elements with logos.
    - Vertical side banners with "RobustUS Nutrição Animal".
- **Dog Character**:
  - Use a high-quality dog asset.
  - Add a realistic basket carried by the dog (the actual capture zone).
  - Add a soft shadow beneath the dog that follows its movement.
  - Implement a "wobble" and "bounce" animation using Framer Motion.
- **Falling Items**:
  - Use real RobustUS product packaging images.
  - Add a subtle rotate animation as they fall.

### Feedback & Interaction
- **Catch Feedback**:
  - Show floating point indicators (+10, +25) that fade out upwards when an item is caught.
  - Add a "sparkle" or "glow" effect on the basket upon capture.
- **Controls**:
  - Add large semi-transparent Left/Right buttons at the bottom.
  - Improve drag sensitivity and smooth out movement.
  - Support keyboard arrows for desktop testing.
- **UI Header**:
  - Redesign score and timer into a compact, modern panel at the top.
  - Add a progress bar towards the winning score goal.

### Technical Details
- Use `AnimatePresence` for feedback elements.
- Manage `feedbacks` state to show multiple point popups.
- Refine collision detection to target the basket specifically rather than the whole dog.
- Use `object-fit: contain` for product images to ensure they look like real packaging.
- Ensure `overflow: hidden` on the container to prevent any scrollbars.
- Layout remains 1080x1920 aspect ratio within the `totem-wrapper`.

### Assets to Use
- Dog: `https://robustus.com.br/wp-content/uploads/2025/10/cao-mini-768x633.png`
- Logo: `https://robustus.com.br/wp-content/uploads/2025/03/logo.png`
- Product Images: Current `GAME_PRODUCTS` array urls.
- Basket: A high-quality PNG basket.
