import { formatDate } from './api'

/**
 * Generate and download a styled Excel (.xls / SpreadsheetML) file
 * Complete with official report header, table borders, colored status pills,
 * column widths, zebra striping, and text wrapping.
 */
export function exportStyledExcel({ data, filterName = 'Semua Status' }) {
  const now = new Date()
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timeFormatted = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const statusStyles = {
    approved: {
      label: 'APPROVED (Disetujui)',
      bg: '#DCFCE7',
      color: '#166534',
      border: '#86EFAC',
    },
    pending: {
      label: 'PENDING (Menunggu)',
      bg: '#FEF3C7',
      color: '#92400E',
      border: '#FDE68A',
    },
    rejected: {
      label: 'REJECTED (Ditolak)',
      bg: '#FFE4E6',
      color: '#9F1239',
      border: '#FECDD3',
    },
  }

  const rowsHtml = data
    .map((item, index) => {
      const st = statusStyles[item.status] || {
        label: item.status,
        bg: '#F1F5F9',
        color: '#334155',
        border: '#CBD5E1',
      }

      const itemDate = new Date(item.created_at)
      const tgl = !isNaN(itemDate)
        ? itemDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-'
      const jam = !isNaN(itemDate)
        ? `${itemDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
        : '-'

      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

      // Escape HTML chars
      const safeText = (item.text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br/>')

      return `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #CBD5E1; padding: 10px 8px; text-align: center; font-family: 'Segoe UI', Calibri, Arial; font-size: 11pt; color: #475569;">
            ${index + 1}
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 10px 10px; font-family: Consolas, 'Courier New', monospace; font-size: 10pt; color: #334155; text-align: center;">
            ${item.id}
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 10px 14px; font-family: 'Segoe UI', Calibri, Arial; font-size: 11pt; color: #0F172A; line-height: 1.4; text-align: left;">
            ${safeText}
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 10px 8px; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: ${st.bg}; color: ${st.color}; border: 1px solid ${st.border}; padding: 4px 10px; border-radius: 12px; font-family: 'Segoe UI', Calibri, Arial; font-size: 10pt; font-weight: bold;">
              ${st.label}
            </span>
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 10px 10px; font-family: 'Segoe UI', Calibri, Arial; font-size: 11pt; color: #475569; text-align: center; white-space: nowrap;">
            ${tgl}
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 10px 10px; font-family: 'Segoe UI', Calibri, Arial; font-size: 11pt; color: #475569; text-align: center; white-space: nowrap;">
            ${jam}
          </td>
        </tr>
      `
    })
    .join('')

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Aspirasi</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:Print>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        .title-banner {
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          padding: 16px;
          border: 1px solid #0F172A;
        }
        .meta-label {
          font-family: 'Segoe UI', Calibri, Arial;
          font-size: 10pt;
          font-weight: bold;
          color: #475569;
          background-color: #F1F5F9;
          padding: 6px 10px;
          border: 1px solid #CBD5E1;
        }
        .meta-val {
          font-family: 'Segoe UI', Calibri, Arial;
          font-size: 10pt;
          color: #0F172A;
          background-color: #FFFFFF;
          padding: 6px 10px;
          border: 1px solid #CBD5E1;
        }
        .th-header {
          background-color: #1E293B;
          color: #FFFFFF;
          font-family: 'Segoe UI', Calibri, Arial;
          font-size: 11pt;
          font-weight: bold;
          padding: 12px 10px;
          text-align: center;
          border: 1px solid #0F172A;
        }
      </style>
    </head>
    <body>
      <table>
        <!-- Title Header Banner -->
        <tr>
          <th colspan="6" class="title-banner">
            LAPORAN REKAPITULASI ASPIRASI & MODERASI — DREAM WALL
          </th>
        </tr>
        <tr>
          <td colspan="6" style="height: 10px;"></td>
        </tr>

        <!-- Metadata Info Box -->
        <tr>
          <td class="meta-label">Waktu Unduh:</td>
          <td class="meta-val" colspan="2">${dateFormatted}, ${timeFormatted} WIB</td>
          <td class="meta-label">Cakupan Data:</td>
          <td class="meta-val" colspan="2">${filterName}</td>
        </tr>
        <tr>
          <td class="meta-label">Total Data Rekap:</td>
          <td class="meta-val" colspan="2">${data.length} Baris Aspirasi</td>
          <td class="meta-label">Sistem Sumber:</td>
          <td class="meta-val" colspan="2">Dream Wall Admin Console (v1.0)</td>
        </tr>
        <tr>
          <td colspan="6" style="height: 12px;"></td>
        </tr>

        <!-- Table Column Headers -->
        <thead>
          <tr>
            <th class="th-header" style="width: 50px;">No</th>
            <th class="th-header" style="width: 280px;">ID UUID</th>
            <th class="th-header" style="width: 450px;">Pesan Aspirasi Pengunjung</th>
            <th class="th-header" style="width: 170px;">Status Moderasi</th>
            <th class="th-header" style="width: 130px;">Tanggal Masuk</th>
            <th class="th-header" style="width: 100px;">Waktu</th>
          </tr>
        </thead>

        <!-- Table Body Rows -->
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob(['\uFEFF' + excelTemplate], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fileDateStr = now.toISOString().split('T')[0]
  link.href = url
  link.setAttribute('download', `Laporan_DreamWall_${filterName.replace(/[^a-zA-Z0-9]/g, '_')}_${fileDateStr}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
