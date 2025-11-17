/**
 * Workspace Invitation Email Template
 *
 * Sent when a user is invited to join a workspace.
 * Includes workspace details, inviter information, and acceptance link.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WorkspaceInvitationEmailProps {
  inviteeName: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  invitationUrl: string;
  expiresInDays: number;
}

export default function WorkspaceInvitationEmail({
  inviteeName = 'there',
  inviterName = 'Someone',
  workspaceName = 'Acme Corp',
  role = 'member',
  invitationUrl = 'https://example.com/accept-invitation',
  expiresInDays = 7,
}: WorkspaceInvitationEmailProps) {
  const roleDisplayNames: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };

  const roleDisplay = roleDisplayNames[role] || 'Member';

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {workspaceName} workspace
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're Invited! 🎉</Heading>

          <Text style={text}>Hi {inviteeName},</Text>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join the{' '}
            <strong>{workspaceName}</strong> workspace as a{' '}
            <strong>{roleDisplay}</strong>.
          </Text>

          <Section style={roleDescriptionSection}>
            <Text style={roleDescription}>{getRoleDescription(role)}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button href={invitationUrl} style={button}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          <Text style={link}>{invitationUrl}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            This invitation will expire in {expiresInDays} days. If you weren't
            expecting this invitation, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            If you have any questions, please contact the workspace
            administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner:
      'As an owner, you will have full control over the workspace, including billing, member management, and all workspace settings.',
    admin:
      'As an admin, you will be able to manage members, configure workspace settings, and access all workspace features.',
    member:
      'As a member, you will be able to collaborate with the team and use all workspace features.',
    viewer:
      'As a viewer, you will have read-only access to workspace content and can observe team activities.',
  };

  return descriptions[role] || descriptions.member;
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
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const roleDescriptionSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const roleDescription = {
  color: '#495057',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const link = {
  color: '#2563eb',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  padding: '0 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  margin: '8px 0',
};
