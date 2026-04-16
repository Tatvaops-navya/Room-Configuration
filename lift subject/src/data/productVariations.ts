/**
 * Product variations database by component type.
 * Used to show type-specific options (e.g. sofa → SOF-001 variations).
 */

import type { ComponentType, ProductVariation } from '../types'

export type { ComponentType, ProductVariation }

export const PRODUCT_VARIATIONS: ProductVariation[] = [
  // Sofa SOF-001
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-CHA-SMO-MAT', color: 'Charcoal Grey', material: 'Fabric', texture: 'Smooth', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-CHA-SMO-SAT', color: 'Charcoal Grey', material: 'Fabric', texture: 'Smooth', finish: 'Satin', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-CHA-WOV-MAT', color: 'Charcoal Grey', material: 'Fabric', texture: 'Woven', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-CHA-WOV-SAT', color: 'Charcoal Grey', material: 'Fabric', texture: 'Woven', finish: 'Satin', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-BEI-SMO-MAT', color: 'Beige Linen', material: 'Fabric', texture: 'Smooth', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-BEI-SMO-SAT', color: 'Beige Linen', material: 'Fabric', texture: 'Smooth', finish: 'Satin', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-BEI-WOV-MAT', color: 'Beige Linen', material: 'Fabric', texture: 'Woven', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-BEI-WOV-SAT', color: 'Beige Linen', material: 'Fabric', texture: 'Woven', finish: 'Satin', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-NAV-SMO-MAT', color: 'Navy Blue', material: 'Fabric', texture: 'Smooth', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-NAV-SMO-SAT', color: 'Navy Blue', material: 'Fabric', texture: 'Smooth', finish: 'Satin', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-NAV-WOV-MAT', color: 'Navy Blue', material: 'Fabric', texture: 'Woven', finish: 'Matte', size: '2-Seater' },
  { componentType: 'sofa', productCode: 'SOF-001', variationCode: 'SOF-001-NAV-WOV-SAT', color: 'Navy Blue', material: 'Fabric', texture: 'Woven', finish: 'Satin', size: '2-Seater' },
  // Wall WAL-001
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-WAR-SMO-MAT', color: 'Warm White', material: 'Paint', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-WAR-SMO-EGG', color: 'Warm White', material: 'Paint', texture: 'Smooth', finish: 'Eggshell', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-WAR-LIG-MAT', color: 'Warm White', material: 'Paint', texture: 'Light Texture', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-WAR-LIG-EGG', color: 'Warm White', material: 'Paint', texture: 'Light Texture', finish: 'Eggshell', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-SAG-SMO-MAT', color: 'Sage Green', material: 'Paint', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-SAG-SMO-EGG', color: 'Sage Green', material: 'Paint', texture: 'Smooth', finish: 'Eggshell', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-SAG-LIG-MAT', color: 'Sage Green', material: 'Paint', texture: 'Light Texture', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-SAG-LIG-EGG', color: 'Sage Green', material: 'Paint', texture: 'Light Texture', finish: 'Eggshell', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-TER-SMO-MAT', color: 'Terracotta', material: 'Paint', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-TER-SMO-EGG', color: 'Terracotta', material: 'Paint', texture: 'Smooth', finish: 'Eggshell', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-TER-LIG-MAT', color: 'Terracotta', material: 'Paint', texture: 'Light Texture', finish: 'Matte', size: 'Standard' },
  { componentType: 'wall', productCode: 'WAL-001', variationCode: 'WAL-001-TER-LIG-EGG', color: 'Terracotta', material: 'Paint', texture: 'Light Texture', finish: 'Eggshell', size: 'Standard' },
  // Door DOR-001
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WAL-SMO-MAT', color: 'Walnut Brown', material: 'Wood', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WAL-SMO-SEM', color: 'Walnut Brown', material: 'Wood', texture: 'Smooth', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WAL-WOO-MAT', color: 'Walnut Brown', material: 'Wood', texture: 'Wood Grain', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WAL-WOO-SEM', color: 'Walnut Brown', material: 'Wood', texture: 'Wood Grain', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-OAK-SMO-MAT', color: 'Oak Natural', material: 'Wood', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-OAK-SMO-SEM', color: 'Oak Natural', material: 'Wood', texture: 'Smooth', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-OAK-WOO-MAT', color: 'Oak Natural', material: 'Wood', texture: 'Wood Grain', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-OAK-WOO-SEM', color: 'Oak Natural', material: 'Wood', texture: 'Wood Grain', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WHI-SMO-MAT', color: 'White Matte', material: 'Wood', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WHI-SMO-SEM', color: 'White Matte', material: 'Wood', texture: 'Smooth', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WHI-WOO-MAT', color: 'White Matte', material: 'Wood', texture: 'Wood Grain', finish: 'Matte', size: 'Standard' },
  { componentType: 'door', productCode: 'DOR-001', variationCode: 'DOR-001-WHI-WOO-SEM', color: 'White Matte', material: 'Wood', texture: 'Wood Grain', finish: 'Semi-Gloss', size: 'Standard' },
  // Window WIN-001
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-MAT-SMO-GLO', color: 'Matte Black', material: 'Aluminum', texture: 'Smooth', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-MAT-SMO-MAT', color: 'Matte Black', material: 'Aluminum', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-MAT-BRU-GLO', color: 'Matte Black', material: 'Aluminum', texture: 'Brushed', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-MAT-BRU-MAT', color: 'Matte Black', material: 'Aluminum', texture: 'Brushed', finish: 'Matte', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-PUR-SMO-GLO', color: 'Pure White', material: 'Aluminum', texture: 'Smooth', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-PUR-SMO-MAT', color: 'Pure White', material: 'Aluminum', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-PUR-BRU-GLO', color: 'Pure White', material: 'Aluminum', texture: 'Brushed', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-PUR-BRU-MAT', color: 'Pure White', material: 'Aluminum', texture: 'Brushed', finish: 'Matte', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-SIL-SMO-GLO', color: 'Silver Grey', material: 'Aluminum', texture: 'Smooth', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-SIL-SMO-MAT', color: 'Silver Grey', material: 'Aluminum', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-SIL-BRU-GLO', color: 'Silver Grey', material: 'Aluminum', texture: 'Brushed', finish: 'Glossy', size: 'Standard' },
  { componentType: 'window', productCode: 'WIN-001', variationCode: 'WIN-001-SIL-BRU-MAT', color: 'Silver Grey', material: 'Aluminum', texture: 'Brushed', finish: 'Matte', size: 'Standard' },
  // Chair – fabric / leather
  { componentType: 'chair', productCode: 'CHR-001', variationCode: 'CHR-001-BEI-FAB-WOV', color: 'Beige Linen', material: 'Fabric', texture: 'Woven', finish: 'Matte', size: 'Standard' },
  { componentType: 'chair', productCode: 'CHR-001', variationCode: 'CHR-001-NAV-FAB-SMO', color: 'Navy Blue', material: 'Fabric', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'chair', productCode: 'CHR-001', variationCode: 'CHR-001-BLA-LEA-SMO', color: 'Black', material: 'Leather', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'chair', productCode: 'CHR-001', variationCode: 'CHR-001-TAN-LEA-SMO', color: 'Tan', material: 'Leather', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  { componentType: 'chair', productCode: 'CHR-001', variationCode: 'CHR-001-GRE-FAB-WOV', color: 'Grey', material: 'Fabric', texture: 'Woven', finish: 'Matte', size: 'Standard' },
  // Coffee Table – wood finishes
  { componentType: 'coffee_table', productCode: 'TBL-001', variationCode: 'TBL-001-WAL-WOD-MAT', color: 'Walnut', material: 'Wood', texture: 'Wood Grain', finish: 'Matte', size: 'Standard' },
  { componentType: 'coffee_table', productCode: 'TBL-001', variationCode: 'TBL-001-OAK-WOD-MAT', color: 'Oak Natural', material: 'Wood', texture: 'Wood Grain', finish: 'Matte', size: 'Standard' },
  { componentType: 'coffee_table', productCode: 'TBL-001', variationCode: 'TBL-001-WHI-WOD-SEM', color: 'White', material: 'Wood', texture: 'Smooth', finish: 'Semi-Gloss', size: 'Standard' },
  { componentType: 'coffee_table', productCode: 'TBL-001', variationCode: 'TBL-001-BLA-WOD-MAT', color: 'Black', material: 'Wood', texture: 'Smooth', finish: 'Matte', size: 'Standard' },
  // Glass Partition – glass tint
  { componentType: 'glass_partition', productCode: 'GLZ-001', variationCode: 'GLZ-001-CLR-GLS-CLE', color: 'Clear', material: 'Glass', texture: 'Smooth', finish: 'Glossy', size: 'Standard' },
  { componentType: 'glass_partition', productCode: 'GLZ-001', variationCode: 'GLZ-001-FRO-GLS-FRO', color: 'Frosted', material: 'Glass', texture: 'Frosted', finish: 'Matte', size: 'Standard' },
  { componentType: 'glass_partition', productCode: 'GLZ-001', variationCode: 'GLZ-001-TIN-GLS-SMO', color: 'Tinted Grey', material: 'Glass', texture: 'Smooth', finish: 'Glossy', size: 'Standard' },
]

export function getVariationsByComponentType(componentType: ComponentType): ProductVariation[] {
  return PRODUCT_VARIATIONS.filter((v) => v.componentType === componentType)
}

/** Color name → hex for UI swatches (aligned with canvas tint colors) */
export const COLOR_SWATCH_HEX: Record<string, string> = {
  'Charcoal Grey': '#46464b',
  'Beige Linen': '#dccdaf',
  'Navy Blue': '#284173',
  'Warm White': '#fcf5eb',
  'Sage Green': '#afbea5',
  'Terracotta': '#b45f46',
  'Walnut Brown': '#735537',
  'Oak Natural': '#c8a578',
  'White Matte': '#f5f2ee',
  'Matte Black': '#2d2d30',
  'Pure White': '#fffcf8',
  'Silver Grey': '#b9bcc0',
  'Grey': '#9ca3af',
  'Black': '#1f2937',
  'Tan': '#d4a574',
  'White': '#fafafa',
  'Frosted': '#e2e8f0',
  'Tinted Grey': '#94a3b8',
  'Clear': '#f8fafc',
}

export function getStyleName(v: ProductVariation): string {
  return `${v.color} ${v.material} ${v.texture} ${v.finish}`
}

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  sofa: 'Sofa',
  wall: 'Wall',
  door: 'Door',
  window: 'Window',
  chair: 'Chair',
  coffee_table: 'Coffee Table',
  glass_partition: 'Glass Partition',
}
