/**
 * TIMEZONE UTILITY — WIB (UTC+7)
 *
 * Aturan:
 * - Semua data di Supabase disimpan dalam UTC
 * - Semua query filter harus kirim timestamp dengan offset +07:00
 * - Semua tampilan ke user harus dikonversi ke WIB
 *
 * JANGAN gunakan new Date().toISOString() langsung untuk filter —
 * itu akan kirim UTC tanpa offset, hasilnya beda hari.
 */

const WIB_OFFSET = '+07:00'

/**
 * Ambil range start–end hari ini dalam WIB, siap dipakai di query Supabase.
 * Contoh output: { start: "2026-07-02T00:00:00+07:00", end: "2026-07-02T23:59:59+07:00" }
 */
export function getTodayRangeWIB(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return {
    start: `${y}-${m}-${d}T00:00:00${WIB_OFFSET}`,
    end:   `${y}-${m}-${d}T23:59:59${WIB_OFFSET}`,
  }
}

/**
 * Ambil range start–end untuk tanggal tertentu (string "yyyy-MM-dd") dalam WIB.
 */
export function getDateRangeWIB(dateStr: string): { start: string; end: string } {
  return {
    start: `${dateStr}T00:00:00${WIB_OFFSET}`,
    end:   `${dateStr}T23:59:59${WIB_OFFSET}`,
  }
}

/**
 * Ambil range start–end untuk bulan tertentu dalam WIB.
 */
export function getMonthRangeWIB(year: number, month: number): { start: string; end: string } {
  const m = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const lastM = String(lastDay).padStart(2, '0')
  return {
    start: `${year}-${m}-01T00:00:00${WIB_OFFSET}`,
    end:   `${year}-${m}-${lastM}T23:59:59${WIB_OFFSET}`,
  }
}

/**
 * Format timestamp UTC dari Supabase ke tampilan WIB untuk user.
 * Contoh: "2026-07-01T17:30:00Z" → "02/07/2026 00:30"
 */
export function formatWIB(utcStr: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!utcStr) return '—'
  const date = new Date(utcStr)
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...opts,
  })
}

/**
 * Format hanya jam dalam WIB.
 */
export function formatTimeWIB(utcStr: string): string {
  if (!utcStr) return '—'
  return new Date(utcStr).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Ambil string tanggal hari ini dalam WIB untuk value input[type=date].
 * Contoh output: "2026-07-02"
 */
export function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}
