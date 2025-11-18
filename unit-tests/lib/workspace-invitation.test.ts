import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptWorkspaceInvitation,
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  declineWorkspaceInvitation,
  expireOldInvitations,
  getInvitationByToken,
  getWorkspaceInvitations,
} from '@/lib/workspace-invitation';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      user: {
        findFirst: vi.fn(),
      },
      workspaceMember: {
        findFirst: vi.fn(),
      },
      workspaceInvitation: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/audit-logger', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/email-service', () => ({
  sendWorkspaceInvitationEmail: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  getWorkspace: vi.fn(),
  addWorkspaceMember: vi.fn(),
}));

import { db } from '@/db/drizzle';
import { logAudit } from '@/lib/audit-logger';
import { sendWorkspaceInvitationEmail } from '@/lib/email-service';
import { getWorkspace, addWorkspaceMember } from '@/lib/workspace';

describe('Workspace Invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkspaceInvitation', () => {
    it('should create invitation with valid data', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        role: 'member',
        invitedBy: 'user_123',
        token: 'token_abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({
        id: 'workspace_123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Inviter',
        email: 'inviter@example.com',
      } as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      } as any);
      vi.mocked(sendWorkspaceInvitationEmail).mockResolvedValueOnce({
        success: true,
      } as any);

      const result = await createWorkspaceInvitation({
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        role: 'member',
        invitedBy: 'user_123',
        baseUrl: 'https://example.com',
      });

      expect(result).toEqual(mockInvitation);
      expect(sendWorkspaceInvitationEmail).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.invitation_created',
        }),
      );
    });

    it('should throw error if user already a member', async () => {
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_456',
        email: 'user@example.com',
      } as any);
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        role: 'member',
      } as any);

      await expect(
        createWorkspaceInvitation({
          workspaceId: 'workspace_123',
          email: 'user@example.com',
          invitedBy: 'user_123',
          baseUrl: 'https://example.com',
        }),
      ).rejects.toThrow('User is already a member of this workspace');
    });

    it('should throw error if pending invitation exists', async () => {
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce({
        id: 'existing_invitation',
        status: 'pending',
      } as any);

      await expect(
        createWorkspaceInvitation({
          workspaceId: 'workspace_123',
          email: 'user@example.com',
          invitedBy: 'user_123',
          baseUrl: 'https://example.com',
        }),
      ).rejects.toThrow(
        'A pending invitation already exists for this email address',
      );
    });

    it('should throw error if workspace not found', async () => {
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce(null);

      await expect(
        createWorkspaceInvitation({
          workspaceId: 'nonexistent',
          email: 'user@example.com',
          invitedBy: 'user_123',
          baseUrl: 'https://example.com',
        }),
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw error if inviter not found', async () => {
      vi.mocked(db.query.user.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({
        id: 'workspace_123',
        name: 'Test Workspace',
      } as any);

      await expect(
        createWorkspaceInvitation({
          workspaceId: 'workspace_123',
          email: 'user@example.com',
          invitedBy: 'nonexistent',
          baseUrl: 'https://example.com',
        }),
      ).rejects.toThrow('Inviter not found');
    });

    it('should default to member role if not specified', async () => {
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({
        id: 'workspace_123',
        name: 'Test Workspace',
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Inviter',
      } as any);

      const insertMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ role: 'member' }]),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);
      vi.mocked(sendWorkspaceInvitationEmail).mockResolvedValueOnce({
        success: true,
      } as any);

      await createWorkspaceInvitation({
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        invitedBy: 'user_123',
        baseUrl: 'https://example.com',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'member',
        }),
      );
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation with workspace and inviter details', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        role: 'member',
        invitedBy: 'user_123',
        token: 'token_abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({
        id: 'workspace_123',
        name: 'Test Workspace',
        slug: 'test-workspace',
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Inviter',
        email: 'inviter@example.com',
      } as any);

      const result = await getInvitationByToken('token_abc');

      expect(result).toBeDefined();
      expect(result?.workspace).toBeDefined();
      expect(result?.inviter).toBeDefined();
    });

    it('should return null if invitation not found', async () => {
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );

      const result = await getInvitationByToken('invalid_token');

      expect(result).toBeNull();
    });
  });

  describe('acceptWorkspaceInvitation', () => {
    it('should accept valid pending invitation', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockInvitation = {
        id: 'invitation_123',
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        role: 'member',
        invitedBy: 'inviter_123',
        token: 'token_abc',
        expiresAt: futureDate,
        status: 'pending',
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({
        id: 'workspace_123',
        name: 'Test Workspace',
      } as any);
      vi.mocked(db.query.user.findFirst)
        .mockResolvedValueOnce({
          id: 'inviter_123',
          name: 'Inviter',
        } as any)
        .mockResolvedValueOnce({
          id: 'user_456',
          email: 'user@example.com',
        } as any);
      vi.mocked(addWorkspaceMember).mockResolvedValueOnce({} as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockInvitation]),
          }),
        }),
      } as any);

      const result = await acceptWorkspaceInvitation({
        token: 'token_abc',
        userId: 'user_456',
      });

      expect(result).toBeDefined();
      expect(addWorkspaceMember).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.invitation_accepted',
        }),
      );
    });

    it('should throw error if invitation not found', async () => {
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce(null);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);

      await expect(
        acceptWorkspaceInvitation({
          token: 'invalid_token',
          userId: 'user_456',
        }),
      ).rejects.toThrow('Invalid invitation token');
    });

    it('should throw error if invitation already accepted', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        status: 'accepted',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({} as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({} as any);

      await expect(
        acceptWorkspaceInvitation({
          token: 'token_abc',
          userId: 'user_456',
        }),
      ).rejects.toThrow('Invitation has already been accepted');
    });

    it('should throw error if invitation expired', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const mockInvitation = {
        id: 'invitation_123',
        status: 'pending',
        expiresAt: pastDate,
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({} as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({} as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await expect(
        acceptWorkspaceInvitation({
          token: 'token_abc',
          userId: 'user_456',
        }),
      ).rejects.toThrow('Invitation has expired');
    });

    it('should throw error if user email does not match', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockInvitation = {
        id: 'invitation_123',
        email: 'user@example.com',
        status: 'pending',
        expiresAt: futureDate,
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({} as any);
      vi.mocked(db.query.user.findFirst)
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({
          id: 'user_456',
          email: 'different@example.com',
        } as any);

      await expect(
        acceptWorkspaceInvitation({
          token: 'token_abc',
          userId: 'user_456',
        }),
      ).rejects.toThrow('Invitation email does not match your account email');
    });
  });

  describe('declineWorkspaceInvitation', () => {
    it('should decline pending invitation', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        workspaceId: 'workspace_123',
        invitedBy: 'user_123',
        status: 'pending',
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({} as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({} as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await declineWorkspaceInvitation({
        token: 'token_abc',
        userId: 'user_456',
      });

      expect(db.update).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.invitation_declined',
        }),
      );
    });

    it('should throw error if invitation not found', async () => {
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce(null);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce(null);

      await expect(
        declineWorkspaceInvitation({
          token: 'invalid_token',
        }),
      ).rejects.toThrow('Invalid invitation token');
    });

    it('should throw error if invitation not pending', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        status: 'accepted',
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(getWorkspace).mockResolvedValueOnce({} as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({} as any);

      await expect(
        declineWorkspaceInvitation({
          token: 'token_abc',
        }),
      ).rejects.toThrow('Invitation has already been accepted');
    });
  });

  describe('cancelWorkspaceInvitation', () => {
    it('should cancel pending invitation', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        workspaceId: 'workspace_123',
        email: 'user@example.com',
        status: 'pending',
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(),
      } as any);

      await cancelWorkspaceInvitation({
        invitationId: 'invitation_123',
        cancelledBy: 'user_123',
      });

      expect(db.delete).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.invitation_cancelled',
        }),
      );
    });

    it('should throw error if invitation not found', async () => {
      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        null,
      );

      await expect(
        cancelWorkspaceInvitation({
          invitationId: 'nonexistent',
          cancelledBy: 'user_123',
        }),
      ).rejects.toThrow('Invitation not found');
    });

    it('should throw error if invitation not pending', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        status: 'accepted',
      };

      vi.mocked(db.query.workspaceInvitation.findFirst).mockResolvedValueOnce(
        mockInvitation as any,
      );

      await expect(
        cancelWorkspaceInvitation({
          invitationId: 'invitation_123',
          cancelledBy: 'user_123',
        }),
      ).rejects.toThrow('Invitation has already been accepted');
    });
  });

  describe('getWorkspaceInvitations', () => {
    it('should return all invitations for workspace', async () => {
      const mockInvitations = [
        { id: 'invitation_1', status: 'pending' },
        { id: 'invitation_2', status: 'accepted' },
      ];

      vi.mocked(db.query.workspaceInvitation.findMany).mockResolvedValueOnce(
        mockInvitations as any,
      );

      const result = await getWorkspaceInvitations('workspace_123');

      expect(result).toEqual(mockInvitations);
    });

    it('should filter by status if provided', async () => {
      const mockInvitations = [{ id: 'invitation_1', status: 'pending' }];

      vi.mocked(db.query.workspaceInvitation.findMany).mockResolvedValueOnce(
        mockInvitations as any,
      );

      const result = await getWorkspaceInvitations('workspace_123', 'pending');

      expect(result).toEqual(mockInvitations);
    });
  });

  describe('expireOldInvitations', () => {
    it('should expire old invitations', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: 'invitation_1' }, { id: 'invitation_2' }]),
          }),
        }),
      } as any);

      const result = await expireOldInvitations();

      expect(result).toBe(2);
      expect(db.update).toHaveBeenCalled();
    });

    it('should return 0 if no invitations to expire', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await expireOldInvitations();

      expect(result).toBe(0);
    });
  });
});
