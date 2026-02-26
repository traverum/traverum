import { NextResponse } from 'next/server'

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const MIN_SCORE = 0.5

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface VerifyBody {
  token: string
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

interface GoogleVerifyResponse {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

export async function POST(request: Request) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    console.warn('RECAPTCHA_SECRET_KEY is not set; signup reCAPTCHA verification is disabled')
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  }

  let body: VerifyBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
  }

  const { token } = body
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400, headers: corsHeaders })
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  })

  const res = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    return NextResponse.json({ success: false, error: 'Verification request failed' }, { status: 502, headers: corsHeaders })
  }

  const data = (await res.json()) as GoogleVerifyResponse

  if (!data.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed',
        errorCodes: data['error-codes'],
      },
      { status: 400, headers: corsHeaders }
    )
  }

  const score = data.score ?? 0
  if (score < MIN_SCORE) {
    return NextResponse.json({ success: false, score, error: 'Score too low' }, { status: 400, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, score }, { headers: corsHeaders })
}
