interface DownLink {
  slug: string
  title: string | null
  destination_url: string
  http_status: number | null
  error_message: string | null
}

interface HealthAlertData {
  userName: string
  downLinks: DownLink[]
  baseUrl: string
}

export function buildHealthAlertHtml({ userName, downLinks, baseUrl }: HealthAlertData): string {
  const linkRows = downLinks.map((l) => {
    const statusBadge = l.http_status
      ? `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${l.http_status}</span>`
      : `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">Unreachable</span>`
    const shortUrl = `${baseUrl}/${l.slug}`
    const displayTitle = l.title || l.slug
    const truncDest = l.destination_url.length > 55
      ? l.destination_url.slice(0, 52) + '…'
      : l.destination_url
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:600;font-size:14px;color:#0f172a;">${displayTitle}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${shortUrl}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;font-family:monospace;">${truncDest}</div>
          ${l.error_message ? `<div style="font-size:11px;color:#ef4444;margin-top:3px;">${l.error_message}</div>` : ''}
        </td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;vertical-align:top;">
          ${statusBadge}
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;">⚠️ Link Health Alert</div>
            <div style="font-size:14px;color:#fecaca;margin-top:4px;">
              ${downLinks.length} link${downLinks.length !== 1 ? 's' : ''} detected as down
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;color:#334155;font-size:15px;">
              Hi ${userName}, your Stackly health monitor detected the following link${downLinks.length !== 1 ? 's are' : ' is'} currently unreachable:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${linkRows}
            </table>

            <div style="margin-top:24px;padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">
              <p style="margin:0;font-size:13px;color:#9a3412;">
                <strong>What to do:</strong> Check if the destination URL is still valid. If it's a temporary outage, the link will automatically be marked healthy again on the next check.
              </p>
            </div>

            <div style="margin-top:24px;text-align:center;">
              <a href="${baseUrl}/dashboard/links" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
                Manage Links →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You're receiving this because you have active links on <a href="${baseUrl}" style="color:#6366f1;text-decoration:none;">Stackly</a>.
              Health checks run every hour.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
