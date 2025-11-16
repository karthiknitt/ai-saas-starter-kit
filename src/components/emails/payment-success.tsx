/**
 * Email template for successful payment
 * Sent when a payment is successfully processed
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PaymentSuccessEmailProps {
  username: string;
  planName: string;
  amount: string;
  paymentDate: string;
  invoiceUrl?: string;
}

export default function PaymentSuccessEmail({
  username,
  planName,
  amount,
  paymentDate,
  invoiceUrl,
}: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment received - Thank you for your payment!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Received ✓</Heading>

          <Text style={text}>Hi {username},</Text>

          <Text style={text}>
            We've successfully received your payment. Thank you for your
            continued subscription!
          </Text>

          <Section style={paymentDetails}>
            <Text style={detailLabel}>Payment Details:</Text>
            <Text style={detailInfo}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={detailInfo}>
              <strong>Amount Paid:</strong> {amount}
            </Text>
            <Text style={detailInfo}>
              <strong>Payment Date:</strong> {paymentDate}
            </Text>
          </Section>

          {invoiceUrl && (
            <Section style={buttonSection}>
              <Link href={invoiceUrl} style={button}>
                Download Invoice
              </Link>
            </Section>
          )}

          <Section style={buttonSection}>
            <Link
              href={`${process.env.BETTER_AUTH_URL}/billing`}
              style={secondaryButton}
            >
              View Billing Dashboard
            </Link>
          </Section>

          <Text style={text}>
            Your subscription will continue uninterrupted. You can view your
            payment history and manage your subscription from your billing
            dashboard.
          </Text>

          <Text style={footer}>
            Thank you for being a valued customer!
            <br />
            <br />
            Best regards,
            <br />
            The Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  margin: '16px 0',
};

const paymentDetails = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '24px',
  borderLeft: '4px solid #4caf50',
};

const detailLabel = {
  color: '#2e7d32',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  marginBottom: '16px',
};

const detailInfo = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const buttonSection = {
  padding: '0 48px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const secondaryButton = {
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '6px',
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '24px 0 16px',
};
