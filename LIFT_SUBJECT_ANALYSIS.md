# Lift Subject – Analysis & Fit Check

## Overview

**Lift Subject** is a cutout-based component extraction and editing tool (Vite + React).  
**Room Configuration** is an AI room design generator with mask-based inpainting (Next.js).

---

## Lift Subject – What It Is

| Aspect | Details |
|--------|---------|
| **Stack** | Vite 7, React 19, Tailwind 4, TypeScript |
| **Purpose** | Edit room images by detecting, extracting, and modifying individual components (furniture, walls, etc.) |
| **Detection** | Grounding DINO (object detection) + SAM (segmentation); optional Auto Detect mode |
| **Selection** | Rectangle, Click, Hover, Auto Detect, Material Replace |
| **Editing** | Preset (visual effects), AI (Gemini), Replace (catalog/stock/upload) |
| **Output** | Cutout compositing – modified cutouts are composited back onto the original image |

### Core Concepts

- **DetectedComponent**: id, region (bbox), cutoutDataUrl, maskDataUrl, modifications
- **Product types**: sofa, wall, door, window, chair, coffee_table, glass_partition
- **Replace flow**: Catalog (sofa database), Stock items, Upload, AI-generated
- **Preview → Apply**: Changes apply to the cutout; user then “Apply To Main Image”

---

## Room Configuration – What It Is

| Aspect | Details |
|--------|---------|
| **Stack** | Next.js 14, React |
| **Purpose** | Generate and customize room images via AI (layout, style, colors, components) |
| **Modes** | Edit, Add, Replace, Erase – all mask-based |
| **Selection** | Drag-to-select rectangular area (no click-to-object or auto-detect) |
| **Editing** | StyleSelector, ColorPaletteSelector, material presets, text prompts |
| **Output** | Masked inpainting via Gemini – AI fills/modifies masked regions |

### Core Concepts

- **Selection**: normalized bounding box + mask (white = change, black = keep)
- **Product variations**: from Supabase (tiles, sofas, doors, etc.)
- **Flow**: Select area → Configure → Generate Preview → Apply/Cancel

---

## Fit Analysis

### Overlap (Shared Domain)

1. **Component types** – Both use sofa, wall, door, window, chair, glass_partition, etc.
2. **Edit/Replace** – Both support editing and replacing components.
3. **Product catalogs** – Both use product variations (sofa databases, tile options).
4. **Room images** – Both work on room/interior images.

### Differences

| Dimension | Lift Subject | Room Configuration |
|-----------|--------------|--------------------|
| **Detection** | DINO + SAM (exact objects, masks) | User-drawn rectangle only |
| **Selection** | Click/hover/rectangle/auto | Drag rectangle only |
| **Modification** | Cutout compositing | AI inpainting on mask |
| **Backend** | External DINO/SAM APIs, Gemini optional | Next.js API routes, Gemini inpainting |
| **Framework** | Vite (SPA) | Next.js (SSR/API) |
| **State** | useReducer (AppState) | Zustand (room editor store) |

### Fit Assessment

| Use Case | Fit | Notes |
|----------|-----|-------|
| **Merge lift subject into room config** | Medium | Different stacks and runtimes; would need significant refactor |
| **Reuse concepts (modes, panels)** | High | Edit/Replace/Preset structure is reusable as reference |
| **Reuse detection** | High | DINO + SAM could replace manual rectangle selection in room config |
| **Share product data** | High | Same Supabase/product variation concepts |
| **Run as separate tool** | High | Can live side by side for different workflows |

---

## Recommendations

### 1. Use Lift Subject Detection in Room Configuration

- Replace manual rectangle with click-to-object:
  - Use DINO + SAM (or similar) to get object masks.
  - Map selection to room editor’s `Selection` with `boundingBox` + `maskDataUrl`.
- **Benefit**: More precise selection per object instead of rough rectangles.
- **Effort**: New API routes (or integrate DINO/SAM), wiring into `CanvasInteraction`.

### 2. Align Mode Naming and Panels

- Lift Subject: Preset, AI, Replace  
- Room Configuration: Edit, Add, Replace, Erase  
- Edit in room config ≈ Preset + AI in lift subject  
- Add in room config ≈ Replace with “new object” logic  
- Replace in room config ≈ Replace in lift subject  
- **Action**: Standardize labels and panel layouts where possible.

### 3. Share Product/Catalog Data

- Both use sofas, walls, doors, etc.
- Room config: Supabase (`sofa_products`, `mytyles_vitrified_tiles`, …)
- Lift subject: `SOFA_DATABASE`, `productVariations`
- **Action**: Point lift subject at Supabase or a shared API instead of local mock data.

### 4. Keep Separate Apps (Recommended Short Term)

- Lift Subject: Object-level editing, cutouts, catalog-driven replace.
- Room Configuration: Full-room generation, style/palette, inpainting.
- Different UX and backends; better to keep them as distinct tools.

### 5. Long-Term Integration

If a single app is desired:

- Use Next.js as the main app.
- Integrate lift subject as an embedded editor (e.g. iframe or micro-frontend) when “Direct edit” is used.
- Or port lift subject’s detection and cutout logic into Next.js API routes and React components.

---

## Summary

| Question | Answer |
|----------|--------|
| **Are they compatible?** | Conceptually yes; technically different stacks and flows. |
| **Can detection be reused?** | Yes – DINO + SAM would improve room config selection. |
| **Can they share data?** | Yes – product catalogs and variation schemas can be shared. |
| **Should they merge?** | Not required; they target different workflows. |
| **Best next step?** | Add click-to-object detection to room config (optionally using lift subject’s DINO/SAM setup) or share product data APIs. |
