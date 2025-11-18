import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  generateSlug,
  getWorkspace,
  getWorkspaceBySlug,
  getWorkspaceMembers,
  getWorkspaceRole,
  getUserWorkspaces,
  hasWorkspaceAccess,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from '@/lib/workspace';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      workspace: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workspaceMember: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/audit-logger', () => ({
  logAudit: vi.fn(),
}));

import { db } from '@/db/drizzle';
import { logAudit } from '@/lib/audit-logger';

describe('Workspace Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should convert name to lowercase slug', () => {
      expect(generateSlug('My Awesome Team')).toBe('my-awesome-team');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('Team Name Here')).toBe('team-name-here');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Team@Name!123')).toBe('team-name-123');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('  Team Name  ')).toBe('team-name');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(generateSlug('Team    Name')).toBe('team-name');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Café Team')).toBe('caf-team');
    });
  });

  describe('createWorkspace', () => {
    it('should create workspace with valid data', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test Workspace',
        slug: 'test-workspace',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWorkspace]),
        }),
      } as any);

      const result = await createWorkspace({
        name: 'Test Workspace',
        ownerId: 'user_123',
      });

      expect(result).toEqual(mockWorkspace);
      expect(db.insert).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.created',
          resourceType: 'workspace',
        }),
      );
    });

    it('should assign owner role to creator', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'workspace_123' }]),
        }),
      } as any);

      await createWorkspace({
        name: 'Test Workspace',
        ownerId: 'user_123',
      });

      expect(db.insert).toHaveBeenCalledTimes(2); // Once for workspace, once for member
    });

    it('should throw error if slug already exists', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce({
        id: 'existing_workspace',
        slug: 'test-workspace',
      } as any);

      await expect(
        createWorkspace({
          name: 'Test Workspace',
          ownerId: 'user_123',
        }),
      ).rejects.toThrow('Workspace with slug "test-workspace" already exists');
    });

    it('should use default plan if not specified', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);
      const insertMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'workspace_123' }]),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await createWorkspace({
        name: 'Test Workspace',
        ownerId: 'user_123',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'Free',
        }),
      );
    });

    it('should accept custom plan', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);
      const insertMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'workspace_123' }]),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await createWorkspace({
        name: 'Test Workspace',
        ownerId: 'user_123',
        plan: 'Pro',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'Pro',
        }),
      );
    });
  });

  describe('getUserWorkspaces', () => {
    it('should return workspaces for a user', async () => {
      const mockMemberships = [
        { workspaceId: 'workspace_1', userId: 'user_123', role: 'owner' },
        { workspaceId: 'workspace_2', userId: 'user_123', role: 'member' },
      ];

      const mockWorkspaces = [
        {
          id: 'workspace_1',
          name: 'Workspace 1',
          slug: 'workspace-1',
          ownerId: 'user_123',
          plan: 'Free',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'workspace_2',
          name: 'Workspace 2',
          slug: 'workspace-2',
          ownerId: 'user_456',
          plan: 'Pro',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.query.workspaceMember.findMany)
        .mockResolvedValueOnce(mockMemberships as any)
        .mockResolvedValueOnce([mockMemberships[0]] as any)
        .mockResolvedValueOnce([mockMemberships[1]] as any);

      vi.mocked(db.query.workspace.findFirst)
        .mockResolvedValueOnce(mockWorkspaces[0] as any)
        .mockResolvedValueOnce(mockWorkspaces[1] as any);

      const result = await getUserWorkspaces('user_123');

      expect(result).toHaveLength(2);
      expect(result[0].userRole).toBe('owner');
      expect(result[1].userRole).toBe('member');
    });

    it('should return empty array if user has no workspaces', async () => {
      vi.mocked(db.query.workspaceMember.findMany).mockResolvedValueOnce([]);

      const result = await getUserWorkspaces('user_123');

      expect(result).toEqual([]);
    });

    it('should throw error if workspace not found', async () => {
      vi.mocked(db.query.workspaceMember.findMany).mockResolvedValueOnce([
        { workspaceId: 'workspace_1', userId: 'user_123', role: 'owner' },
      ] as any);
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);

      await expect(getUserWorkspaces('user_123')).rejects.toThrow(
        'Workspace workspace_1 not found',
      );
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace by ID', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test Workspace',
        slug: 'test-workspace',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );

      const result = await getWorkspace('workspace_123');

      expect(result).toEqual(mockWorkspace);
    });

    it('should return null if workspace not found', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);

      const result = await getWorkspace('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getWorkspaceBySlug', () => {
    it('should return workspace by slug', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test Workspace',
        slug: 'test-workspace',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );

      const result = await getWorkspaceBySlug('test-workspace');

      expect(result).toEqual(mockWorkspace);
    });

    it('should return null if workspace not found', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);

      const result = await getWorkspaceBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('hasWorkspaceAccess', () => {
    it('should return true if user is a member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_123',
        role: 'member',
      } as any);

      const result = await hasWorkspaceAccess('user_123', 'workspace_123');

      expect(result).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce(null);

      const result = await hasWorkspaceAccess('user_123', 'workspace_123');

      expect(result).toBe(false);
    });
  });

  describe('getWorkspaceRole', () => {
    it('should return user role if member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_123',
        role: 'admin',
      } as any);

      const result = await getWorkspaceRole('user_123', 'workspace_123');

      expect(result).toBe('admin');
    });

    it('should return null if not a member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce(null);

      const result = await getWorkspaceRole('user_123', 'workspace_123');

      expect(result).toBeNull();
    });
  });

  describe('addWorkspaceMember', () => {
    it('should add member to workspace', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce(null);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              workspaceId: 'workspace_123',
              userId: 'user_456',
              role: 'member',
            },
          ]),
        }),
      } as any);

      const result = await addWorkspaceMember({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        role: 'member',
        invitedBy: 'user_123',
      });

      expect(result.role).toBe('member');
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.member_added',
        }),
      );
    });

    it('should use default role if not specified', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce(null);
      const insertMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            workspaceId: 'workspace_123',
            userId: 'user_456',
            role: 'member',
          },
        ]),
      });
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await addWorkspaceMember({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        invitedBy: 'user_123',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'member',
        }),
      );
    });

    it('should throw error if user already a member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        role: 'member',
      } as any);

      await expect(
        addWorkspaceMember({
          workspaceId: 'workspace_123',
          userId: 'user_456',
          invitedBy: 'user_123',
        }),
      ).rejects.toThrow('User is already a member of this workspace');
    });
  });

  describe('removeWorkspaceMember', () => {
    it('should remove member from workspace', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        role: 'member',
      } as any);
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(),
      } as any);

      await removeWorkspaceMember({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        removedBy: 'user_123',
      });

      expect(db.delete).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.member_removed',
        }),
      );
    });

    it('should throw error when trying to remove owner', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_123',
        role: 'owner',
      } as any);

      await expect(
        removeWorkspaceMember({
          workspaceId: 'workspace_123',
          userId: 'user_123',
          removedBy: 'user_456',
        }),
      ).rejects.toThrow('Cannot remove the workspace owner');
    });
  });

  describe('updateWorkspaceMemberRole', () => {
    it('should update member role', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        role: 'member',
      } as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await updateWorkspaceMemberRole({
        workspaceId: 'workspace_123',
        userId: 'user_456',
        newRole: 'admin',
        updatedBy: 'user_123',
      });

      expect(db.update).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.member_role_updated',
          changes: expect.objectContaining({
            oldRole: 'member',
            newRole: 'admin',
          }),
        }),
      );
    });

    it('should throw error if user not a member', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce(null);

      await expect(
        updateWorkspaceMemberRole({
          workspaceId: 'workspace_123',
          userId: 'user_456',
          newRole: 'admin',
          updatedBy: 'user_123',
        }),
      ).rejects.toThrow('User is not a member of this workspace');
    });

    it('should throw error when trying to change owner role', async () => {
      vi.mocked(db.query.workspaceMember.findFirst).mockResolvedValueOnce({
        workspaceId: 'workspace_123',
        userId: 'user_123',
        role: 'owner',
      } as any);

      await expect(
        updateWorkspaceMemberRole({
          workspaceId: 'workspace_123',
          userId: 'user_123',
          newRole: 'admin',
          updatedBy: 'user_456',
        }),
      ).rejects.toThrow('Cannot change the role of the workspace owner');
    });
  });

  describe('getWorkspaceMembers', () => {
    it('should return all members with user details', async () => {
      const mockMembers = [
        { workspaceId: 'workspace_123', userId: 'user_1', role: 'owner' },
        { workspaceId: 'workspace_123', userId: 'user_2', role: 'member' },
      ];

      const mockUsers = [
        { id: 'user_1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user_2', name: 'User 2', email: 'user2@example.com' },
      ];

      vi.mocked(db.query.workspaceMember.findMany).mockResolvedValueOnce(
        mockMembers as any,
      );
      vi.mocked(db.query.user.findFirst)
        .mockResolvedValueOnce(mockUsers[0] as any)
        .mockResolvedValueOnce(mockUsers[1] as any);

      const result = await getWorkspaceMembers('workspace_123');

      expect(result).toHaveLength(2);
      expect(result[0].user).toEqual(mockUsers[0]);
      expect(result[1].user).toEqual(mockUsers[1]);
    });

    it('should return empty array if no members', async () => {
      vi.mocked(db.query.workspaceMember.findMany).mockResolvedValueOnce([]);

      const result = await getWorkspaceMembers('workspace_123');

      expect(result).toEqual([]);
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace name', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Old Name',
        slug: 'old-name',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst)
        .mockResolvedValueOnce(mockWorkspace as any)
        .mockResolvedValueOnce(null);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...mockWorkspace, name: 'New Name' }]),
          }),
        }),
      } as any);

      const result = await updateWorkspace({
        workspaceId: 'workspace_123',
        name: 'New Name',
        updatedBy: 'user_123',
      });

      expect(result.name).toBe('New Name');
      expect(logAudit).toHaveBeenCalled();
    });

    it('should update workspace plan', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test',
        slug: 'test',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...mockWorkspace, plan: 'Pro' }]),
          }),
        }),
      } as any);

      const result = await updateWorkspace({
        workspaceId: 'workspace_123',
        plan: 'Pro',
        updatedBy: 'user_123',
      });

      expect(result.plan).toBe('Pro');
    });

    it('should throw error if workspace not found', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);

      await expect(
        updateWorkspace({
          workspaceId: 'nonexistent',
          name: 'New Name',
          updatedBy: 'user_123',
        }),
      ).rejects.toThrow('Workspace not found');
    });

    it('should return current workspace if no updates', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test',
        slug: 'test',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );

      const result = await updateWorkspace({
        workspaceId: 'workspace_123',
        name: 'Test',
        plan: 'Free',
        updatedBy: 'user_123',
      });

      expect(result).toEqual(mockWorkspace);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('should throw error if new slug conflicts', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Old Name',
        slug: 'old-name',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst)
        .mockResolvedValueOnce(mockWorkspace as any)
        .mockResolvedValueOnce({
          id: 'workspace_456',
          slug: 'new-name',
        } as any);

      await expect(
        updateWorkspace({
          workspaceId: 'workspace_123',
          name: 'New Name',
          updatedBy: 'user_123',
        }),
      ).rejects.toThrow('Workspace with slug "new-name" already exists');
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace if user is owner', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test',
        slug: 'test',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(),
      } as any);

      await deleteWorkspace({
        workspaceId: 'workspace_123',
        deletedBy: 'user_123',
      });

      expect(db.delete).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'workspace.deleted',
        }),
      );
    });

    it('should throw error if workspace not found', async () => {
      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(null);

      await expect(
        deleteWorkspace({
          workspaceId: 'nonexistent',
          deletedBy: 'user_123',
        }),
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw error if user is not owner', async () => {
      const mockWorkspace = {
        id: 'workspace_123',
        name: 'Test',
        slug: 'test',
        ownerId: 'user_123',
        plan: 'Free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.workspace.findFirst).mockResolvedValueOnce(
        mockWorkspace as any,
      );

      await expect(
        deleteWorkspace({
          workspaceId: 'workspace_123',
          deletedBy: 'user_456',
        }),
      ).rejects.toThrow('Only the workspace owner can delete the workspace');
    });
  });
});
