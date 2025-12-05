import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface ForgotPasswordEmailProps {
  username: string;
  resetUrl: string;
  userEmail: string;
}

const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
  const { username, resetUrl, userEmail } = props;
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Reset your password - Action required</Preview>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white shadow-lg">
            {/* Header */}
            <Section className="rounded-t-[8px] bg-blue-600 px-[40px] py-[32px] text-center">
              <Heading className="m-0 mb-[8px] text-[28px] font-bold text-white">
                Password Reset
              </Heading>
              <Text className="m-0 text-[16px] text-white">
                Secure your account with a new password
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="px-[40px] py-[32px]">
              <Text className="mt-0 mb-[16px] text-[18px] font-semibold text-gray-900">
                Hello, {username || 'there'},
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-gray-800">
                We received a request to reset the password for your account
                associated with <strong>{userEmail}</strong>. Don't worry, it
                happens to the best of us!
              </Text>

              <Text className="mt-0 mb-[32px] text-[16px] leading-[24px] text-gray-800">
                Click the button below to create a new password. This link will
                expire in 24 hours for security reasons.
              </Text>

              {/* Reset Button */}
              <Section className="mb-[32px] text-center">
                <Button
                  href={resetUrl}
                  className="box-border inline-block rounded-[8px] bg-blue-600 px-[32px] py-[16px] text-[16px] font-semibold text-white no-underline"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Reset My Password
                </Button>
              </Section>

              {/* Alternative Link */}
              <Section className="mb-[24px] rounded-[8px] bg-gray-50 p-[24px]">
                <Text className="mt-0 mb-[8px] text-[14px] font-medium text-gray-800">
                  Button not working? Copy and paste this link into your
                  browser:
                </Text>
                <Text className="m-0 text-[14px] font-medium break-all text-blue-600">
                  {resetUrl}
                </Text>
              </Section>

              {/* Security Notice */}
              <Section className="mb-[24px] border-l-[4px] border-solid border-orange-400 bg-orange-50 py-[16px] pl-[16px]">
                <Text className="mt-0 mb-[8px] text-[14px] font-bold text-orange-900">
                  🔒 Security Notice
                </Text>
                <Text className="m-0 text-[14px] leading-[20px] text-orange-800">
                  If you didn't request this password reset, please ignore this
                  email. Your password will remain unchanged and your account
                  stays secure.
                </Text>
              </Section>

              <Text className="mt-0 mb-[8px] text-[16px] leading-[24px] text-gray-800">
                Need help? Our support team is always ready to assist you.
              </Text>

              <Text className="m-0 text-[16px] leading-[24px] text-gray-800">
                Best regards,
                <br />
                <strong>The Security Team</strong>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="rounded-b-[8px] border-t border-solid border-gray-200 bg-gray-50 px-[40px] py-[24px]">
              <Text className="m-0 mb-[8px] text-center text-[12px] leading-[16px] text-gray-700">
                This email was sent to {userEmail}
              </Text>
              <Text className="m-0 mb-[8px] text-center text-[12px] leading-[16px] text-gray-700">
                123 Security Street, Digital City, DC 12345
              </Text>
              <Text className="m-0 text-center text-[12px] leading-[16px] text-gray-700">
                © 2025 Your Company Name. All rights reserved. |
                {/* biome-ignore lint/a11y/useValidAnchor: Placeholder link for email template */}
                <a href="#" className="ml-[4px] text-blue-600 no-underline">
                  Unsubscribe
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ForgotPasswordEmail.PreviewProps = {
  userEmail: 'user@example.com',
  resetLink: 'https://yourapp.com/reset-password?token=abc123xyz',
};

export default ForgotPasswordEmail;
