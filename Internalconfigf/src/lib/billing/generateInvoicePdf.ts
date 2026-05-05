import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import invoiceLogoSrc from '@/assets/tatvaops-invoice-logo.png?url'
import type { BillingInvoice } from './types'

/** 8pt grid */
const s8 = 8
const s16 = 16
const s24 = 24

const WHITE: [number, number, number] = [255, 255, 255]
const PAGE_BG = WHITE
const DIVIDER: [number, number, number] = [229, 231, 236]
const MUTED: [number, number, number] = [107, 114, 128]
const INK: [number, number, number] = [17, 24, 39]
const TABLE_HEAD: [number, number, number] = [243, 244, 246]
const ROW_ALT: [number, number, number] = [250, 250, 250]
const USAGE_CARD: [number, number, number] = [249, 250, 251]
const BADGE_BG: [number, number, number] = [220, 252, 231]
const BADGE_TEXT: [number, number, number] = [22, 101, 52]
const LINK: [number, number, number] = [37, 99, 235]

/** Target logo height (pt); width follows aspect ratio (no non-uniform stretch). */
const LOGO_TARGET_H = 32

/** Indian-style grouping with ASCII digits only (Helvetica / WinAnsi cannot render ₹ reliably). */
function formatInrInt(intStr: string): string {
  const s = intStr.replace(/^-/, '')
  const neg = intStr.startsWith('-')
  if (s.length <= 3) return (neg ? '-' : '') + s
  let tail = s.slice(-3)
  let rest = s.slice(0, -3)
  while (rest.length > 0) {
    tail = rest.slice(-2) + ',' + tail
    rest = rest.slice(0, -2)
  }
  return (neg ? '-' : '') + tail
}

/** ASCII-only; displays as e.g. Rs. 599.00 — avoids broken glyphs in PDF viewers. */
function formatInrFull(n: number): string {
  const sign = n < 0 ? '-' : ''
  const v = Math.abs(n)
  const [intPart, frac] = v.toFixed(2).split('.')
  return `${sign}Rs. ${formatInrInt(intPart)}.${frac}`
}

function formatLongDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function defaultBillingPeriodLabel(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00')
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const fmt = (x: Date) =>
      x.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  } catch {
    return iso
  }
}

function fileSlug(invoiceId: string): string {
  return invoiceId.replace(/^#/, '').replace(/\s+/g, '_')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Invoice logo failed to load (${src})`))
    img.src = src
  })
}

/**
 * Clears alpha on near-black pixels (letterboxed export) so the lockup sits on white.
 * Uses a tight RGB threshold so orange/purple/blue gradients stay intact.
 * Result is a canvas passed to jsPDF — avoids broken rendering from huge data URLs.
 */
function logoCanvasWithoutBlackPlate(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, w)
  canvas.height = Math.max(1, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.drawImage(img, 0, 0)
  if (!w || !h) return canvas

  const imageData = ctx.getImageData(0, 0, w, h)
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    // Slightly loose so anti-aliased black edges disappear; brand colours stay saturated.
    if (r <= 28 && g <= 28 && b <= 28) {
      data[i + 3] = 0
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export type InvoicePdfInput = {
  invoice: BillingInvoice
  planName: string
  billingCycle: 'monthly' | 'yearly'
  paymentBrand: string
  paymentLast4: string
  billToName?: string
  billToEmail?: string
  usage: {
    roomsUsed: number
    roomsLimit: number
    generationsUsed: number
    generationsLimit: number
  }
}

/**
 * Generates TatvaOps invoice PDF (A4, 40pt margins, strict grid).
 * Logo: bundled asset + canvas knock-out for black plate; embedded via canvas (not data URL).
 */
export async function downloadTatvaOpsInvoicePdf(input: InvoicePdfInput): Promise<void> {
  const {
    invoice,
    planName,
    billingCycle,
    paymentBrand,
    paymentLast4,
    billToName = 'Madhunala Navya',
    billToEmail = 'billing@tatvaops.com',
    usage,
  } = input

  const logoImg = await loadImage(invoiceLogoSrc)
  const logoCanvas = logoCanvasWithoutBlackPlate(logoImg)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  })
  doc.setProperties({ title: `Invoice ${invoice.id}`, subject: 'TatvaOps billing', creator: 'TatvaOps' })

  const pageW = doc.internal.pageSize.getWidth()
  const m = 40
  let y = m

  doc.setFillColor(...PAGE_BG)
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F')

  const hr = (yy: number) => {
    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.75)
    doc.line(m, yy, pageW - m, yy)
  }

  // ─── HEADER ────────────────────────────────────────────────────
  const invoiceReserve = 200
  const logoMaxW = Math.max(80, pageW - 2 * m - invoiceReserve)
  const nw = logoImg.naturalWidth || 1
  const nh = logoImg.naturalHeight || 1
  let logoDrawH = LOGO_TARGET_H
  let logoDrawW = LOGO_TARGET_H * (nw / nh)
  if (logoDrawW > logoMaxW) {
    logoDrawW = logoMaxW
    logoDrawH = logoMaxW * (nh / nw)
  }

  doc.addImage(logoCanvas, 'PNG', m, y, logoDrawW, logoDrawH)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const tagY = y + logoDrawH + s8
  doc.text('AI Interior Design Platform', m, tagY)

  const invId = `#${invoice.id.replace(/^#/, '')}`
  const invDate = formatLongDate(invoice.date)
  const rightX = pageW - m
  let invY = y + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...INK)
  doc.text('INVOICE', rightX, invY, { align: 'right' })
  invY += 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  doc.text(`Invoice ID: ${invId}`, rightX, invY, { align: 'right' })
  invY += s8 + 4
  doc.text(`Date: ${invDate}`, rightX, invY, { align: 'right' })

  const headerBottom = Math.max(tagY + 12, invY + 6)
  y = headerBottom + s8
  hr(y)
  y += s24

  // ─── BILL TO + PAYMENT (strict 2-col grid, same baselines) ─────
  const colGap = s24
  const colW = (pageW - 2 * m - colGap) / 2
  const xL = m
  const xR = m + colW + colGap
  const rowGap = 8
  const bodyLh = 14

  const ySectionTitles = y
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text('Bill To', xL, ySectionTitles)
  doc.text('Payment Details', xR, ySectionTitles)

  const yRow0 = ySectionTitles + s16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...INK)
  doc.text(billToName, xL, yRow0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${paymentBrand} \u2022\u2022\u2022\u2022 ${paymentLast4}`, xR, yRow0)

  const yRow1 = yRow0 + bodyLh + rowGap
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  doc.text(billToEmail, xL, yRow1)

  const statusLabel = invoice.status === 'paid' ? 'Paid' : invoice.status === 'failed' ? 'Failed' : 'Pending'
  const badgeH = 18
  let yAfterBadge = yRow1

  if (invoice.status === 'paid') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    const badgeW = Math.max(44, doc.getTextWidth(statusLabel) + s16)
    const badgeTop = yRow1 - 10
    doc.setFillColor(...BADGE_BG)
    doc.roundedRect(xR, badgeTop, badgeW, badgeH, 4, 4, 'F')
    doc.setTextColor(...BADGE_TEXT)
    doc.text(statusLabel, xR + badgeW / 2, badgeTop + badgeH / 2 + 3, { align: 'center' })
    yAfterBadge = badgeTop + badgeH + rowGap
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(invoice.status === 'failed' ? 220 : 202, invoice.status === 'failed' ? 38 : 138, invoice.status === 'failed' ? 38 : 4)
    doc.text(`Status: ${statusLabel}`, xR, yRow1)
    yAfterBadge = yRow1 + bodyLh + rowGap
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  const yRow2 = yAfterBadge
  doc.text(`Billing Cycle: ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`, xR, yRow2)

  const leftEnd = yRow1 + 4
  const rightEnd = yRow2 + 4
  y = Math.max(leftEnd, rightEnd) + s24
  hr(y)
  y += s24

  // ─── SUBSCRIPTION TABLE (full width) ────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('Subscription Details', m, y)
  y += s16

  const periodRow = invoice.billingPeriodLabel ?? defaultBillingPeriodLabel(invoice.date)
  const tableInnerW = pageW - 2 * m

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Value']],
    body: [
      ['Plan', planName],
      ['Billing Period', periodRow],
      ['Generations Included', String(usage.generationsLimit)],
      ['Rooms Included', String(usage.roomsLimit)],
    ],
    theme: 'plain',
    tableWidth: tableInnerW,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      textColor: INK,
      cellPadding: { top: 12, bottom: 12, left: 12, right: 12 },
      lineColor: DIVIDER,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: TABLE_HEAD,
      textColor: INK,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      0: { cellWidth: tableInnerW * 0.4, fontStyle: 'normal' },
      1: { cellWidth: tableInnerW * 0.6, halign: 'left', fontStyle: 'normal' },
    },
    margin: { left: m, right: m },
    tableLineWidth: 0,
  })

  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + s24

  // ─── TOTALS: fixed-width block, flush right, labels left / values right ─
  const blockW = 240
  const blockLeft = pageW - m - blockW
  const pad = s16
  const labelX = blockLeft + pad
  const valueX = blockLeft + blockW - pad
  const rowH = 16
  const dividerGap = 10

  const sub = invoice.amount
  const tax = 0
  const subStr = formatInrFull(sub)
  const taxStr = formatInrFull(tax)
  const totalStr = formatInrFull(sub)

  /** First baseline offset + 2 amount rows + gap + rule + gap + total row + bottom pad */
  const boxH = pad + 11 + rowH + rowH + 8 + 2 + dividerGap + 16 + pad
  const boxTop = y

  doc.setFillColor(252, 252, 253)
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.5)
  doc.roundedRect(blockLeft, boxTop, blockW, boxH, 8, 8, 'FD')

  let ty = boxTop + pad + 11
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text('Subtotal', labelX, ty)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.text(subStr, valueX, ty, { align: 'right' })
  ty += rowH

  doc.setTextColor(...MUTED)
  doc.text('Tax', labelX, ty)
  doc.setTextColor(...INK)
  doc.text(taxStr, valueX, ty, { align: 'right' })
  ty += rowH + 4

  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.75)
  doc.line(labelX, ty, valueX, ty)
  ty += dividerGap

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text('Total Paid', labelX, ty)
  doc.text(totalStr, valueX, ty, { align: 'right' })

  y = boxTop + boxH + s24

  // ─── USAGE CARD ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('Usage summary', m, y)
  y += s16

  const cardPad = s16
  const lineH = 14
  const cardH = cardPad * 2 + lineH + s8 + lineH
  doc.setFillColor(...USAGE_CARD)
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.4)
  doc.roundedRect(m, y, pageW - 2 * m, cardH, 8, 8, 'FD')

  let uy = y + cardPad + 11
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  doc.text(`Rooms Used: ${usage.roomsUsed} / ${usage.roomsLimit}`, m + cardPad, uy)
  uy += s8 + lineH
  doc.text(`Generations Used: ${usage.generationsUsed} / ${usage.generationsLimit}`, m + cardPad, uy)

  y += cardH + s24
  hr(y)
  y += s24

  // ─── FOOTER ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text('Thank you for using TatvaOps', m, y)
  y += s16

  const mail = 'support@tatvaops.com'
  const mailW = doc.getTextWidth(mail)
  doc.link(m, y - 9, mailW + 4, 14, { url: `mailto:${mail}` })
  doc.setTextColor(...LINK)
  doc.text(mail, m, y)
  y += s16 + s8

  doc.setTextColor(...MUTED)
  doc.setFontSize(8.5)
  doc.text('This is an auto-generated invoice.', m, y)

  doc.save(`invoice_${fileSlug(invoice.id)}.pdf`)
}
