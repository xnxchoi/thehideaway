# Brevo Email Service Setup Guide

## Overview
This guide will help you set up Brevo (formerly Sendinblue) for sending emails from your PayloadCMS application.

## Benefits of Brevo
- **300 emails/day FREE** forever
- Professional transactional email service
- Good deliverability rates
- Easy SMTP integration
- No credit card required for free tier

## Setup Steps

### 1. Create Brevo Account
1. Go to [Brevo.com](https://www.brevo.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get SMTP Credentials
1. Log into your Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Find your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (recommended) or `465`
   - **Login**: Your Brevo login email
   - **Password**: Generate an SMTP password (not your account password)

### 3. Configure Environment Variables
Update your `.env.local` file (create if it doesn't exist):

```bash
# Email Configuration (Brevo SMTP)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=The Hideaway
BREVO_SMTP_USER=your_brevo_login_email@example.com
BREVO_SMTP_PASS=your_generated_smtp_password
```

**Important Notes:**
- Replace `your_brevo_login_email@example.com` with your actual Brevo account email
- Use the SMTP password generated in Brevo dashboard, NOT your account password
- Update `EMAIL_FROM` to match your domain or use a Brevo-verified sender

### 4. Domain Verification (Optional but Recommended)
1. In Brevo dashboard, go to **Senders & IP**
2. Add your domain for better deliverability
3. Follow DNS verification steps

## Testing Email Functionality

You can test the email service by using PayloadCMS's built-in email features or by creating a simple test endpoint.

### Test with PayloadCMS Admin
1. Start your development server: `pnpm dev`
2. Go to PayloadCMS admin panel
3. Try password reset or user invitation features

### Manual Test (Optional)
Create a test API route to send emails:

```typescript
// src/app/api/test-email/route.ts
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST() {
  const payload = await getPayload({ config })
  
  try {
    await payload.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Hello from The Hideaway!</h1>',
    })
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

## Troubleshooting

### Common Issues
1. **Authentication Failed**: Check SMTP credentials and use generated SMTP password
2. **Connection Timeout**: Verify port 587 is not blocked by firewall
3. **Sender Not Verified**: Add and verify your sender email in Brevo dashboard

### Rate Limits
- Free tier: 300 emails/day
- Monitor usage in Brevo dashboard
- Upgrade to paid plan if needed

## Production Deployment
For production, make sure to:
1. Use `.env.production` file with real credentials
2. Verify your sending domain in Brevo
3. Set up proper DNS records (SPF, DKIM)
4. Monitor email deliverability

## Support
- Brevo Documentation: https://developers.brevo.com/
- PayloadCMS Email Docs: https://payloadcms.com/docs/email/overview
