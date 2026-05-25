interface TopLink {
  slug: string
  title: string | null
  destination_url: string
  clicks: number
}

interface WeeklyReportData {
  userName: string
  userEmail: string
  totalClicks: number
  uniqueClicks: number
  lastWeekTotal: number
  topLinks: TopLink[]
  weekStart: Date
  weekEnd: Date
  baseUrl: string
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function pctChange(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const pct = Math.round(((current - prev) / prev) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

export function buildWeeklyReportHtml(data: WeeklyReportData): string {
  const { userName, totalClicks, uniqueClicks, lastWeekTotal, topLinks, weekStart, weekEnd, baseUrl } = data
  const change = pctChange(totalClicks, lastWeekTotal)
  const changeColor = totalClicks >= lastWeekTotal ? '#16a34a' : '#dc2626'
  const dateRange = `${formatDate(weekStart)} – ${formatDate(weekEnd)}`

  const topLinksRows = topLinks.length > 0
    ? topLinks.map((l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <div style="font-size:13px;font-weight:600;color:#7c3aed;">${baseUrl}/${l.slug}</div>
          ${l.title ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${l.title}</div>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#0f172a;">${l.clicks.toLocaleString()}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" style="padding:16px 0;text-align:center;color:#94a3b8;font-size:13px;">No clicks recorded this week.</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Stackly Weekly Report</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">📊 Stackly Weekly Report</div>
              <div style="font-size:13px;color:#ddd6fe;margin-top:6px;">${dateRange}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <p style="margin:0 0 24px;font-size:15px;color:#334155;">Hi <strong>${userName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">Here's your link performance summary for the past 7 days.</p>

              <!-- Stats Row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="33%" style="background:#f5f3ff;border-radius:10px;padding:20px 16px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#7c3aed;">${totalClicks.toLocaleString()}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:500;">Total Clicks</div>
                  </td>
                  <td width="4%"></td>
                  <td width="30%" style="background:#f0fdf4;border-radius:10px;padding:20px 16px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#16a34a;">${uniqueClicks.toLocaleString()}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:500;">Unique Clicks</div>
                  </td>
                  <td width="4%"></td>
                  <td width="29%" style="background:#fff7ed;border-radius:10px;padding:20px 16px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:${changeColor};">${change}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:500;">vs Last Week</div>
                  </td>
                </tr>
              </table>

              <!-- Top Links -->
              <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">Top Links This Week</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th style="text-align:left;font-size:11px;color:#94a3b8;font-weight:600;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Link</th>
                  <th style="text-align:right;font-size:11px;color:#94a3b8;font-weight:600;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Clicks</th>
                </tr>
                ${topLinksRows}
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:36px;">
                <a href="${baseUrl}/dashboard/analytics" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">View Full Analytics →</a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                You're receiving this because you have a Stackly account.<br>
                <a href="${baseUrl}/dashboard/settings" style="color:#7c3aed;text-decoration:none;">Manage email preferences</a>
              </p>
              <p style="font-size:11px;color:#cbd5e1;margin:8px 0 0;">© ${new Date().getFullYear()} Stackly. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
