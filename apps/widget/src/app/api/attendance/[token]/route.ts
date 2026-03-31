import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { formatEmailDate } from '@/lib/email/index'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params

  const supabase = createAdminClient()

  const { data: verification } = await supabase
    .from('attendance_verifications')
    .select(`
      *,
      booking:bookings(
        *,
        reservation:reservations(
          guest_name,
          guest_email,
          requested_date,
          session:experience_sessions(session_date),
          experience:experiences(title)
        )
      )
    `)
    .eq('verification_token', token)
    .single()

  if (!verification) {
    return renderPage('error', 'Invalid Link', 'This verification link is invalid or has already been used.')
  }

  const v = verification as any
  const booking = v.booking
  const reservation = booking?.reservation
  const experience = reservation?.experience
  const experienceDate = reservation?.session?.session_date || reservation?.requested_date || ''

  if (v.outcome !== 'pending') {
    const outcomeMessages: Record<string, string> = {
      guest_overridden: 'You confirmed that you attended this experience. The booking has been marked as completed.',
      supplier_upheld: 'This verification has been resolved. The booking has been cancelled.',
    }
    return renderPage('info', 'Already Resolved', outcomeMessages[v.outcome] || 'This verification has already been resolved.')
  }

  if (new Date(v.deadline) < new Date()) {
    return renderPage('info', 'Verification Expired', 'The deadline to respond has passed. The provider\'s report has been upheld.')
  }

  return renderVerificationPage({
    experienceTitle: experience?.title || 'Unknown Experience',
    guestName: reservation?.guest_name || 'Guest',
    date: experienceDate,
    token,
  })
}

function renderVerificationPage(data: {
  experienceTitle: string
  guestName: string
  date: string
  token: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Attendance Verification</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4EFE6; color: rgb(55, 53, 47); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #FEFCF9; border-radius: 12px; padding: 40px 36px; max-width: 480px; width: 100%; border: 1px solid rgba(55, 53, 47, 0.09); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        h1 { font-size: 22px; font-weight: 300; color: #5D4631; text-align: center; margin-bottom: 24px; letter-spacing: -0.01em; }
        p { font-size: 15px; line-height: 1.6; font-weight: 300; margin-bottom: 16px; }
        .info-box { background: rgba(244, 239, 230, 0.5); border-radius: 6px; padding: 4px 20px; margin: 24px 0; }
        .info-row { padding: 14px 0; border-bottom: 1px solid rgba(55, 53, 47, 0.06); }
        .info-row:last-child { border-bottom: none; }
        .info-label { display: block; color: rgba(55, 53, 47, 0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; font-weight: 500; }
        .info-value { display: block; font-weight: 500; font-size: 15px; }
        .buttons { display: flex; gap: 12px; margin-top: 28px; }
        .btn { flex: 1; padding: 14px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        .btn:hover { opacity: 0.85; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-attended { background: #5A6B4E; color: white; }
        .btn-not-attended { background: rgba(55, 53, 47, 0.35); color: white; }
        .footer { text-align: center; margin-top: 24px; color: rgba(55, 53, 47, 0.3); font-size: 12px; }
        .result { display: none; text-align: center; padding: 20px 0; }
        .result.show { display: block; }
        .result-icon { width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .result-icon.success { background: #dcfce7; }
        .result-icon.error { background: #fee2e2; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Did You Attend This Experience?</h1>
        <p>Hi ${escapeForHtml(data.guestName)},</p>
        <p>The experience provider has reported that this experience did not take place. Please let us know whether you attended.</p>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Experience</span>
            <span class="info-value">${escapeForHtml(data.experienceTitle)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${formatEmailDate(data.date)}</span>
          </div>
        </div>
        
        <div id="buttons-section">
          <div class="buttons">
            <button class="btn btn-attended" onclick="respond('attended')" id="btn-attended">Yes, I Attended</button>
            <button class="btn btn-not-attended" onclick="respond('not_attended')" id="btn-not-attended">No, I Didn't</button>
          </div>
        </div>
        
        <div id="result" class="result"></div>
        
        <div class="footer">
          <p>Powered by Veyond</p>
        </div>
      </div>
      
      <script>
        async function respond(response) {
          const btnAttended = document.getElementById('btn-attended');
          const btnNotAttended = document.getElementById('btn-not-attended');
          btnAttended.disabled = true;
          btnNotAttended.disabled = true;
          
          try {
            const res = await fetch('/api/attendance/${data.token}/respond', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ response }),
            });
            
            const result = await res.json();
            
            const buttonsSection = document.getElementById('buttons-section');
            const resultDiv = document.getElementById('result');
            buttonsSection.style.display = 'none';
            resultDiv.classList.add('show');
            
            if (res.ok) {
              resultDiv.innerHTML = '<div class="result-icon success"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div><p style="font-weight:500;">' + (result.message || 'Thank you for your response.') + '</p>';
            } else {
              resultDiv.innerHTML = '<div class="result-icon error"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#dc2626"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></div><p>' + (result.error || 'Something went wrong. Please try again.') + '</p>';
              btnAttended.disabled = false;
              btnNotAttended.disabled = false;
              buttonsSection.style.display = 'block';
              resultDiv.classList.remove('show');
            }
          } catch (err) {
            btnAttended.disabled = false;
            btnNotAttended.disabled = false;
          }
        }
      </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function renderPage(type: 'error' | 'info', title: string, message: string) {
  const colors = {
    error: { bg: '#fee2e2', stroke: '#dc2626' },
    info: { bg: '#fef3c7', stroke: '#d97706' },
  }

  const icons = {
    error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
    info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F4EFE6; }
        .card { background: #FEFCF9; padding: 48px; border-radius: 12px; text-align: center; max-width: 400px; border: 1px solid rgba(55, 53, 47, 0.09); }
        .icon { width: 64px; height: 64px; background: ${colors[type].bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; }
        h1 { margin: 0 0 12px; font-size: 22px; font-weight: 300; color: #5D4631; }
        p { margin: 0; color: rgba(55, 53, 47, 0.7); line-height: 1.6; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="${colors[type].stroke}">${icons[type]}</svg>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    status: type === 'error' ? 400 : 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function escapeForHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
