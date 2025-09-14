import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface EmailVerificationProps {
  username: string;
  verificationUrl: string;
}

const EmailVerification = (props: EmailVerificationProps) => {
  const { username, verificationUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          Verify your email address to complete your account setup
        </Preview>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[40px] shadow-sm">
            <Section>
              <Heading className="mb-[24px] text-center text-[28px] font-bold text-gray-900">
                Verify Your Email Address
              </Heading>

              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-700">
                Hi, {username || 'there!'}
              </Text>

              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-700">
                Thanks for signing up! To complete your account setup and start
                using our platform, please verify your email address by clicking
                the button below.
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  href={verificationUrl}
                  className="box-border rounded-[8px] bg-blue-600 px-[32px] py-[16px] text-[16px] font-semibold text-white no-underline"
                >
                  Verify Email Address
                </Button>
              </Section>

              <Text className="mb-[24px] text-[14px] leading-[20px] text-gray-600">
                If the button above doesn't work, you can also copy and paste
                the following link into your browser:
              </Text>

              <Text className="mb-[32px] text-[14px] break-all text-blue-600">
                <Link
                  href={verificationUrl}
                  className="text-blue-600 underline"
                >
                  {verificationUrl}
                </Link>
              </Text>

              <Text className="mb-[24px] text-[14px] leading-[20px] text-gray-600">
                This verification link will expire in 24 hours for security
                reasons. If you didn't create an account, you can safely ignore
                this email.
              </Text>

              <Text className="mb-[32px] text-[16px] leading-[24px] text-gray-700">
                Best regards,
                <br />
                The Team
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="m-0 mb-[8px] text-center text-[12px] text-gray-500">
                © 2024 Your Company Name. All rights reserved.
              </Text>
              <Text className="m-0 mb-[8px] text-center text-[12px] text-gray-500">
                123 Business Street, Suite 100, City, State 12345
              </Text>
              <Text className="m-0 text-center text-[12px] text-gray-500">
                <Link href="#" className="text-gray-500 underline">
                  Unsubscribe
                </Link>{' '}
                |
                <Link href="#" className="ml-[8px] text-gray-500 underline">
                  Privacy Policy
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

EmailVerification.PreviewProps = {
  userEmail: 'karthiknitt@gmail.com',
  verificationUrl: 'https://yourapp.com/verify-email?token=abc123xyz789',
};

export default EmailVerification;
