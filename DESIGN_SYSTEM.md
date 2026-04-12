# The Design System: Editorial Kawaii & The Curated Home
 
## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Sanctuary"**
 
This design system moves away from the clinical "tech" aesthetic of standard home management apps and toward a sophisticated, editorial interpretation of *Kawaii*. It is a celebration of soft geometry and high-contrast tonal layering. By combining the friendliness of rounded forms with the rigor of a high-end magazine layout, we create an environment that feels premium yet deeply approachable.
 
The system breaks the "standard grid" through **Intentional Asymmetry**—using generous, uneven whitespace and overlapping elements to create a sense of organic movement. We treat the screen not as a digital interface, but as a series of physical, soft-touch surfaces stacked in a well-lit room.
 
---
 
## 2. Colors: Tonal Depth without Lines
The palette is a sophisticated mix of warmth (Cream/Coral) and grounded serenity (Navy/Teal). 
 
### The "No-Line" Rule
**Traditional 1px borders are strictly prohibited.** To define sections, use background color shifts. A `surface-container-low` section sitting on a `surface` background provides all the structural definition required. This creates a "soft-edge" world that feels expansive rather than boxed in.
 
### Surface Hierarchy & Nesting
Depth is achieved through the physical stacking of tiers. 
- **Base Level:** `surface` (#fefcf4) is your canvas.
- **Middle Level:** Use `surface-container` (#f5f4eb) for large content areas.
- **Top Level:** Use `surface-container-lowest` (#ffffff) for high-priority interactive cards to create a "bright" lift.
 
### Signature Textures & The "Glass" Exception
While the user requested "flat," a premium experience requires "visual soul." 
- **The Modern Matte:** For floating navigation or modal overlays, use a `surface` color at 85% opacity with a `backdrop-filter: blur(20px)`. This creates a frosted-glass effect that feels "Kawaii-Premium" rather than "Web 2.0."
- **Soft Glows:** Instead of gradients, use large, blurred "blobs" of `primary_fixed` (#91eed9) or `tertiary_fixed` (#cab4f3) in the background of hero sections to provide warmth and depth.
 
---
 
## 3. Typography: The Editorial Nunito
While the typeface is friendly, the application must be authoritative. We use a high-contrast scale to ensure the "Kawaii" roundedness of Nunito doesn't feel juvenile.
 
*   **Display (L/M/S):** Used for "Daily Highlights" or big home-stat numbers. These should have -2% letter spacing to feel tight and custom.
*   **Headlines:** Your primary storytelling tool. Use `on_surface` (#383833) for maximum readability.
*   **Body:** `body-lg` (1rem) is the workhorse. Ensure line height is set to 1.6x to maintain a "breezy," premium feel.
*   **Minimum Threshold:** Never drop below **11px** (`label-sm`). Accessibility is the foundation of a premium experience.
 
---
 
## 4. Elevation & Depth: Tonal Layering
Since shadows are forbidden in this flat aesthetic, we use **Tonal Layering** to communicate hierarchy.
 
*   **The Layering Principle:** Place a `surface-container-highest` (#e9e9de) element inside a `surface` (#fefcf4) container to denote a "pressed" or "inset" state. Place a `surface-container-lowest` (#ffffff) element on top of anything to denote an "active" or "floating" card.
*   **The "Ghost Border" Fallback:** In rare cases where contrast is insufficient (e.g., an image on a light background), use a "Ghost Border": `outline_variant` at 15% opacity. It should feel like a suggestion of a boundary, not a hard stop.
*   **Interactivity:** When a user hovers or taps, transition the background from `surface-container` to `surface-bright`. The change should be subtle—a "breathing" sensation.
 
---
 
## 5. Components: Soft & Purposeful
 
### Buttons (The "Pill" Standard)
All buttons use the `xl` (3rem) corner radius for a friendly, pill-shaped look.
*   **Primary:** `primary` (#007261) background with `on_primary` (#ffffff) text. Flat, bold, and centered.
*   **Secondary:** `primary_container` (#91eed9) background. High friendliness, lower urgency.
*   **Tertiary:** No background. Use `primary` text.
 
### Cards & Lists
*   **Rule:** No dividers. Use **Vertical Spacing** (2rem - 3rem) to separate list items.
*   **Layout:** Use asymmetrical padding (e.g., 24px on top, 32px on the bottom) to give a "weighted" editorial feel to cards.
 
### Input Fields
Avoid the "box" look. Use a `surface_container_high` background with a `full` corner radius. The label should sit above the field in `label-md` using the `secondary` (#9d4b53) color for a pop of personality.
 
### The "Home Heart" Component
A unique component for this app: A large, soft-yellow (`tertiary_container`) organic shape that houses the "Main Home Action." It should use the `xl` radius and sit off-center to break the symmetry of the dashboard.
 
---
 
## 6. Do’s and Don’ts
 
### Do
*   **Do** use `secondary` (Coral) for alerts and "Blush" accents—it adds a human, warm touch.
*   **Do** embrace extreme whitespace. If a section feels crowded, double the padding.
*   **Do** use `Nunito` in Semi-Bold for titles to ensure the rounded edges feel intentional and strong.
*   **Do** overlap elements. A card slightly overlapping a hero image creates a "scrapbook" premium feel.
 
### Don’t
*   **Don’t** use black (#000000). Use `Navy` (`on_background`: #383833) for all "dark" elements to keep the palette soft.
*   **Don’t** use a border-radius smaller than `md` (1.5rem) for main UI containers. Sharp corners break the Kawaii-Premium immersion.
*   **Don’t** use icons with thin lines. Use thick, rounded-cap icons that match the weight of the Nunito typeface.