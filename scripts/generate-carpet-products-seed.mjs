/**
 * Generates supabase/migrations/027_carpet_products_seed.sql from embedded rows.
 * Run: node scripts/generate-carpet-products-seed.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function sqlStr(s) {
  if (s == null) return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function sqlNum(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return 'NULL'
  return String(Number(n))
}

/** Only set warranty when it is a plausible month count (integer 0–240). */
function warrantyVal(v) {
  if (v == null) return null
  const s = String(v).trim()
  if (!/^\d+$/.test(s)) return null
  const n = parseInt(s, 10)
  if (n > 240) return null
  return n
}

const rows = [
  {
    category: 'Collection / Carpets',
    name: 'Luxe Home Polyester Abstract Carpet – (5x7 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '2',
    width: '1',
    height: '1',
    net_weight: '5.21 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 2899.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/436yIuLRgF-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/GmoaK9lG84-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/_VqKdxHLDH-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/0AAtK2XdDJ-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/7jVUFyhOB3v-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/QxIL_cFAMDb-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/aZlL5ZdeuRH-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-abstract-carpet-5x7-feet-multicolor-tpr-9724515',
  },
  {
    category: 'Collection / Carpets',
    name: 'Rhett Dark Gray Abstract Hand-Tufted Viscose 8X5 Feet Carpet - Saraswati Global',
    brand: 'Duroflex',
    colour: 'Dark Grey',
    warranty_in_months: null,
    length: '2',
    width: '1',
    height: '1',
    net_weight: '18.00 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Fabric',
    price: 20160.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/y14iMSjoD-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/sNXvQJ7Jm3-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/NNatgeOOnc-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/7UNjgWAmOv-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/xN5O0LjgJ9-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/r7WFKN3Tz--6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/DpzoJ-SOue-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/rhett-dark-gray-abstract-hand-tufted-viscose-8x5-feet-carpet-9730805',
  },
  {
    category: 'Collection / Carpets',
    name: 'Textured Carpet 5 X 7 - The Woven Legacy',
    brand: 'Duroflex',
    colour: 'Beige / Cream',
    warranty_in_months: null,
    length: '1',
    width: '2',
    height: '1',
    net_weight: '14.00 kg',
    description:
      'Introduce texture and warmth to your space with the Textured Maze Modern Beige Rug. The design features a geometric layered-square pattern inspired by architectural forms, giving your interior a clean yet artistic look. The neutral beige and cream color palette blends effortlessly with modern, minimalist, Scandinavian, and contemporary décor styles. Its soft surface provides comfort underfoot, while the structured pattern brings depth and sophistication to living rooms, bedrooms, offices, and lounge spaces.',
    primary_material_type: 'Wool',
    price: 9700.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/PUSOfNNYN-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/iDxp6f7j7r-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/gixtT4CeOO-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/GQmBtcZlb--3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/7iv5_uSWQi-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/qwVRuhVRJx-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/SllPeEpyG7-7.jpg',
    product_url: 'https://www.urbanladder.com/product/textured-carpet-5-x-7-9657214',
  },
  {
    category: 'Collection / Carpets',
    name: 'Scandi Carpet 5 X 7 - The Woven Legacy',
    brand: 'Duroflex',
    colour: 'Beige / Cream',
    warranty_in_months: null,
    length: '1',
    width: '2',
    height: '1',
    net_weight: '14.00 kg',
    description:
      'Add a touch of quiet elegance to your home with this Scandi Patchwork Texture Rug, designed with a soothing arrangement of soft geometric square and panel shapes. The combination of raised and flat textures creates a subtle, handcrafted look that blends beautifully into modern, Japandi, and minimalist interiors. The warm beige and cream neutral palette makes this rug extremely versatile — perfect for creating a calm, cozy, and refined space.',
    primary_material_type: 'Wool',
    price: 9900.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/6McDRFBCZD-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/NzE01XKwOH-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/R-tLTWfUqU-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/W0ETFPL9uo-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/g-tB544az-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/9wLBJ1n26h-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/hCgybhBFcj-6.jpg',
    product_url: 'https://www.urbanladder.com/product/scandi-carpet-5-x-7-9657229',
  },
  {
    category: 'Collection / Carpets',
    name: 'Tribal Motif Carpet 5 X 7 - The Woven Legacy',
    brand: 'Duroflex',
    colour: 'Neutral / Monochrome',
    warranty_in_months: null,
    length: '1',
    width: '2',
    height: '1',
    net_weight: '13.00 kg',
    description:
      'This rug features a subtle, hand-loomed geometric pattern with softly raised texture that blends seamlessly into the background. Its design offers a calm, modern aesthetic while maintaining artisanal charm. The overall look is understated and elegant, making it a versatile choice for minimalist, Scandinavian, contemporary, and transitional interiors. Crafted with a muted monochromatic palette, the rug adds gentle depth without overwhelming a space.',
    primary_material_type: 'Wool',
    price: 9800.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/SLuN35925N-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/HSLKlQPqX3-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/9tS4LDSl_x-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/c2NYo1j9ht-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/lA8qJ3SrI6-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/jOImIV8KF4-5.jpg',
    product_url: 'https://www.urbanladder.com/product/tribal-motif-carpet-5-x-7-9657275',
  },
  {
    category: 'Collection / Carpets',
    name: 'Horizon Lines Carpet 5 X 7 - The Woven Legacy',
    brand: 'Duroflex',
    colour: 'Neutral',
    warranty_in_months: null,
    length: '1',
    width: '2',
    height: '1',
    net_weight: '14.00 kg',
    description:
      'The Horizon Lines rug captures the essence of modern design with its soft gradient stripes and calming neutral tones. Its layered horizontal pattern evokes a sense of movement and balance, perfect for creating a serene atmosphere in any living space. Crafted with precision, this rug features a plush texture and subtle sheen that enhances both comfort and sophistication. Ideal for modern apartments, luxury offices, or contemporary homes seeking understated elegance.',
    primary_material_type: 'Wool',
    price: 10800.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/1Z65caNkaf-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/ZFwbD6t3p--2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/V6xg3ZAec_-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/XV42Ul4UWD-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/2YGppEnBVZ-5.jpg',
    product_url: 'https://www.urbanladder.com/product/horizon-lines-carpet-5-x-7-9657295',
  },
  {
    category: 'Collection / Carpets',
    name: 'Luxe Home Polyester Abstract Carpet – (3x5 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '90',
    height: '1',
    net_weight: '2.44 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 1299.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/iGtrBSKGjrh-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/u4YU0I9Frus-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/idCWrFwem-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/MBhO7q2Ulk-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/z5A8sTmiz1-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/Ct-cjB5hSi-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/aNI5iDqn1W-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-abstract-carpet-3x5-feet-multicolor-tpr-9724466',
  },
  {
    category: 'Collection / Carpets',
    name: 'Earth-Tone Floral Cotton Rug 5x8 - Surya Living',
    brand: 'Duroflex',
    colour: 'Beige',
    warranty_in_months: 6,
    length: '1',
    width: '2',
    height: '1',
    net_weight: '17.00 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071 Telephone No.: 080-69807777 Email ID: hello@urbanladder.com',
    primary_material_type: 'Cotton',
    price: 8343.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/TSLhE52Aph-a.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/ypX1hweEGZ-b.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/vzduob3XWT-c.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/16R27fHmq7-d.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/ssg0JXUeDN-e.jpg',
    product_url: 'https://www.urbanladder.com/product/earth-tone-floral-cotton-rug-5x8-9334298',
  },
  {
    category: 'Collection / Carpets',
    name: 'Luxe Home Polyester Twilight Floral Carpet – (4x6 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '1',
    height: '1',
    net_weight: '3.65 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 1999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/5-7k5TvS3i-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/8099c6ScgE-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/Uo_Cb_yxNU-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/nR9REyNoXd-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/Ia6Wx-EHaI-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/upz6LZmGLY-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/TA8w9q0PSF-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-twilight-floral-carpet-4x6-feet-multicolor-tpr-9724547',
  },
  {
    category: 'Collection / Carpets',
    name: 'Luxe Home Polyester Persian Carpet – (4x6 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '1',
    height: '1',
    net_weight: '3.65 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 1999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/E-UlOgG8gf7-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/PvtA1-vepZK-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/4bfs2_Misss-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/AveW98osBFI-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/eCZyRfgPVv0-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/lJFarOL2-SS-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/KOspdSAnpQ_-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-persian-carpet-4x6-feet-multicolor-tpr-9724488',
  },
  {
    category: 'Collection / Carpets',
    name: 'Luxe Home Polyester Vintage Carpet – (4x6 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '1',
    height: '1',
    net_weight: '3.65 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 1999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/rzjlsiufZdu-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/_6uYpPW1Gsj-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/I5YuYiQJrmr-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/ZIQ3FOeG7D7-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/Ox1e5dRdX-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/AP0s929WQd-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/m3P8lhbCdQ-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-vintage-carpet-4x6-feet-multicolor-tpr-9724536',
  },
  {
    category: 'Collection / Carpets',
    name: 'Tribbiani 4X6 Feet Wool Carpets - Saraswati Global',
    brand: 'Duroflex',
    colour: 'Blue & Grey',
    warranty_in_months: null,
    length: '1',
    width: '1',
    height: '0',
    net_weight: '8.88 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Fabric',
    price: 10983.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/WKOpqyeHf1-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/UOkEWQZkKQ-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/n5Lo_Vs9in-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/IcZQ0U292_-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/cpH23-yAG8-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/MBv3Eqm60E-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/3vi01QQSGg-7.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/2TkiwdWFH--8.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/VnrQZLVRy-9.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/qAowwXG4e-10.jpg',
    product_url: 'https://www.urbanladder.com/product/tribbiani-4x6-feet-wool-carpets-9730662',
  },
  {
    category: 'Collection / Bath Mats',
    name: 'Bathmat 2500 GSM Microfiber Anti Skid Slip Water Absorbent Machine Washable and Quick Dry Jaricho Mats for Bathroom, Kitchen, Entrance - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Cherry',
    warranty_in_months: null,
    length: '44',
    width: '74',
    height: '3',
    net_weight: '10.00 kg',
    description:
      'Bathmat 2500 GSM Microfiber Anti Skid Slip Water Absorbent Machine Washable and Quick Dry Jaricho Mats for Bathroom, Kitchen, Entrance',
    primary_material_type: 'Micro Fiber',
    price: 563.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/HdV4OYHjf3M-00Baseimage-(1).jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/foTxLX6_9AW-VDBABM29BG75391_1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/1uoo2HC9xbd-VDBABM29BG75391_2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/XI44o0BIL4E-VDBABM29BG75391_3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/1uzEDN6ij-VDBABM29BG75391_6.jpg',
    product_url:
      'https://www.urbanladder.com/product/bathmat-2500-gsm-microfiber-anti-skid-slip-water-absorbent-machine-washable-and-quick-dry-jaricho-mats-for-bathroom-kitchen-entrance-8374310-8680787',
  },
  {
    category: 'Collection / Carpets And Rugs',
    name: 'Hanna Dhurrie - 6x4 - Urban Ladder',
    brand: 'Urban Ladder',
    colour: 'Red',
    warranty_in_months: null,
    length: '1',
    width: '1',
    height: '1',
    net_weight: '0.00 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Fabric',
    price: 999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/bMkKOPQQ6-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/ROdWrBuZ4T-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/jyqISbBKGC-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/6eNdn1JFpa-3.jpg',
    product_url:
      'https://www.urbanladder.com/product/hanna-dhurrie-6x4-7590138-8680527-9420721',
  },
  {
    category: 'Collection / Carpets And Rugs',
    name: 'Quin Dhurrie - 3x5 - Urban Ladder',
    brand: 'Urban Ladder',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '91',
    height: '1',
    net_weight: '0.00 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Cotton',
    price: 999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/8BaCfmqGmd-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/XqMKDTsQE-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/3RSvs1KzOq-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/cSTCriEuLQ-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/nfDQOAl-yw-4.jpg',
    product_url:
      'https://www.urbanladder.com/product/quin-dhurrie-3x5-7590137-8680512-9420722',
  },
  {
    category: 'Collection / Carpets And Rugs',
    name: 'Jude Dhurrie - 3x5 - Urban Ladder',
    brand: 'Urban Ladder',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '90',
    width: '1',
    height: '1',
    net_weight: '0.00 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Fabric',
    price: 999.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/IwQ_M5wGiG-0.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/lH4OmmhnF--1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/kRGk9WeeOz-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/iEKDSHrHq-3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/YklqdASk6F-4.jpg',
    product_url:
      'https://www.urbanladder.com/product/jude-dhurrie-3x5-7590135-8680511-9420720',
  },
  {
    category: 'Collection / Carpets And Rugs',
    name: 'Luxe Home Polyester Twilight Floral Runner(2x5 Feet, Multicolor, TPR) - Luxe Home International',
    brand: 'Duroflex',
    colour: 'Multicolor',
    warranty_in_months: null,
    length: '1',
    width: '60',
    height: '1',
    net_weight: '1.71 kg',
    description:
      'Reliance Retail Limited, 1st, 2nd & 3rd Floor, No. 259 and 276 Amarjyothi, Basaveshwara HBCS Layout, Domlur, Bengaluru, 560071, Telephone No.: 080-69807777, Email ID: hello@urbanladder.com',
    primary_material_type: 'Synthetic Fiber',
    price: 899.0,
    images_url:
      'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/8twXFjekqZC-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/xHDbw4sBsJQ-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/Pi_F2jrGQ9--3.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/9g2hNmCiObw-4.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/RQOu5KGWNDg-5.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/emf1DhALjLO-6.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/j0ZH9AtcDZT-7.jpg',
    product_url:
      'https://www.urbanladder.com/product/luxe-home-polyester-twilight-floral-runner-2x5-feet-multicolor-tpr-9724497',
  },
]

const urls = rows.map((r) => r.product_url)

const valueLines = rows.map((r) => {
  const w = r.warranty_in_months != null ? warrantyVal(r.warranty_in_months) : null
  return `  (${sqlStr(r.category)}, ${sqlStr(r.name)}, ${sqlStr(r.brand)}, ${sqlStr(r.colour)}, ${w == null ? 'NULL' : w}, NULL, ${sqlStr(r.length)}, ${sqlStr(r.width)}, ${sqlStr(r.height)}, ${sqlStr(r.net_weight)}, ${sqlStr(r.description)}, NULL, ${sqlStr(r.primary_material_type)}, NULL, NULL, NULL, NULL, ${sqlNum(r.price)}, ${sqlStr(r.images_url)}, ${sqlStr(r.product_url)})`
})

const sql = `-- Carpet / rug / bath mat catalog (generated by scripts/generate-carpet-products-seed.mjs)
-- Run: node scripts/generate-carpet-products-seed.mjs

DELETE FROM carpet_products WHERE product_url IN (
${urls.map((u) => `  ${sqlStr(u)}`).join(',\n')}
);

INSERT INTO carpet_products (
  category, name, brand, colour, warranty_in_months, country_of_origin,
  length, width, height, net_weight, description, generic_name,
  primary_material_type, primary_material_subtype, primary_room, seating_capacity, product_model_name,
  price, images_url, product_url
) VALUES
${valueLines.join(',\n')};
`

const outPath = join(root, 'supabase', 'migrations', '027_carpet_products_seed.sql')
writeFileSync(outPath, sql, 'utf8')
console.log('Wrote', outPath, `(${rows.length} rows)`)
