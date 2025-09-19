import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const computedSignature = hmac.update(body, 'utf8').digest('hex');
    const receivedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(receivedSignature),
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('polar-signature-256');

    if (!signature) {
      return new NextResponse('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.POLAR_WEBHOOK_SECRET!,
    );

    if (!isValid) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
        // Handle subscription created
        break;
      case 'subscription.updated':
        // Handle subscription updated
        break;
      case 'subscription.canceled':
        // Handle subscription canceled
        break;
      case 'order.created':
        // Handle payment/order created
        break;
      default:
        console.log('Unhandled event:', event.type);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
