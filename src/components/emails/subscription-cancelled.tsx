/**
 * Email template for subscription cancellation
 * Sent when a user cancels their subscription
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

interface SubscriptionCancelledEmailProps {
  username: string;
  planName: string;
  endDate: string;
  cancellationReason?: string;
}

export default function SubscriptionCancelledEmail({
  username,
  planName,
  endDate,
  cancellationReason,
}: SubscriptionCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your subscription has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Subscription Cancelled</Heading>

          <Text style={text}>Hi {username},</Text>

          <Text style={text}>
            We're sorry to see you go! Your {planName} subscription has been
            cancelled as requested.
          </Text>

          <Section style={cancellationDetails}>
            <Text style={detailLabel}>Cancellation Details:</Text>
            <Text style={detailInfo}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={detailInfo}>
              <strong>Access Until:</strong> {endDate}
            </Text>
            {cancellationReason && (
              <Text style={detailInfo}>
                <strong>Reason:</strong> {cancellationReason}
              </Text>
            )}
          </Section>

          <Text style={text}>
            <strong>What happens next:</strong>
          </Text>

          <Section style={actionList}>
            <Text style={actionItem}>
              ✓ You'll continue to have access to {planName} features until{' '}
              {endDate}
            </Text>
            <Text style={actionItem}>
              ✓ No further payments will be charged
            </Text>
            <Text style={actionItem}>
              ✓ After {endDate}, your account will be downgraded to the Free
              plan
            </Text>
            <Text style={actionItem}>
              ✓ Your data will be preserved and accessible
            </Text>
          </Section>

          <Text style={text}>
            You can reactivate your subscription at any time from your billing
            dashboard.
          </Text>

          <Section style={buttonSection}>
            <Link
              href={`${process.env.BETTER_AUTH_URL}/dashboard/subscriptions`}
              style={button}
            >
              Reactivate Subscription
            </Link>
          </Section>

          <Section style={feedbackSection}>
            <Text style={feedbackText}>
              <strong>We'd love your feedback!</strong>
              <br />
              If you have a moment, please let us know why you cancelled. Your
              feedback helps us improve our service.
            </Text>
          </Section>

          <Text style={footer}>
            Thank you for being a customer. We hope to see you again soon!
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

const cancellationDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '24px',
  borderLeft: '4px solid #666',
};

const detailLabel = {
  color: '#666',
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

const actionList = {
  padding: '0 48px',
  margin: '16px 0',
};

const actionItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '4px 0',
};

const buttonSection = {
  padding: '0 48px',
  margin: '24px 0',
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

const feedbackSection = {
  backgroundColor: '#e3f2fd',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '20px',
};

const feedbackText = {
  color: '#1565c0',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '24px 0 16px',
};
