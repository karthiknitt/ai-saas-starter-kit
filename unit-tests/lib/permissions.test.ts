import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canPerformAction,
  DEFAULT_ROLE_PERMISSIONS,
  getPermissionsForRole,
  getRolePermissions,
  hasMinimumRole,
  hasPermission,
  initializePermissions,
  PERMISSIONS,
  roleHasPermission,
  seedRolePermissions,
} from '@/lib/permissions';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    query: {},
  },
}));

import { db } from '@/db/drizzle';

describe('Permissions System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PERMISSIONS constant', () => {
    it('should have all expected permissions', () => {
      expect(PERMISSIONS.USERS_READ).toBe('users:read');
      expect(PERMISSIONS.USERS_WRITE).toBe('users:write');
      expect(PERMISSIONS.USERS_DELETE).toBe('users:delete');
      expect(PERMISSIONS.BILLING_READ).toBe('billing:read');
      expect(PERMISSIONS.BILLING_MANAGE).toBe('billing:manage');
      expect(PERMISSIONS.ADMIN_ACCESS).toBe('admin:access');
      expect(PERMISSIONS.AUDIT_VIEW).toBe('audit:view');
      expect(PERMISSIONS.CONTENT_MODERATE).toBe('content:moderate');
      expect(PERMISSIONS.SETTINGS_READ).toBe('settings:read');
      expect(PERMISSIONS.SETTINGS_WRITE).toBe('settings:write');
      expect(PERMISSIONS.API_KEYS_READ).toBe('api_keys:read');
      expect(PERMISSIONS.API_KEYS_WRITE).toBe('api_keys:write');
    });
  });

  describe('DEFAULT_ROLE_PERMISSIONS', () => {
    it('should have permissions for all roles', () => {
      expect(DEFAULT_ROLE_PERMISSIONS.viewer).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.member).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.editor).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.moderator).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.admin).toBeDefined();
    });

    it('should have viewer with read-only permissions', () => {
      const viewerPerms = DEFAULT_ROLE_PERMISSIONS.viewer;
      expect(viewerPerms).toContain(PERMISSIONS.USERS_READ);
      expect(viewerPerms).toContain(PERMISSIONS.BILLING_READ);
      expect(viewerPerms).toContain(PERMISSIONS.SETTINGS_READ);
      expect(viewerPerms).not.toContain(PERMISSIONS.USERS_WRITE);
      expect(viewerPerms).not.toContain(PERMISSIONS.ADMIN_ACCESS);
    });

    it('should have member with read-write permissions', () => {
      const memberPerms = DEFAULT_ROLE_PERMISSIONS.member;
      expect(memberPerms).toContain(PERMISSIONS.USERS_READ);
      expect(memberPerms).toContain(PERMISSIONS.USERS_WRITE);
      expect(memberPerms).toContain(PERMISSIONS.SETTINGS_WRITE);
      expect(memberPerms).not.toContain(PERMISSIONS.ADMIN_ACCESS);
    });

    it('should have editor with moderation permissions', () => {
      const editorPerms = DEFAULT_ROLE_PERMISSIONS.editor;
      expect(editorPerms).toContain(PERMISSIONS.CONTENT_MODERATE);
      expect(editorPerms).toContain(PERMISSIONS.USERS_READ);
      expect(editorPerms).toContain(PERMISSIONS.USERS_WRITE);
    });

    it('should have moderator with audit and delete permissions', () => {
      const moderatorPerms = DEFAULT_ROLE_PERMISSIONS.moderator;
      expect(moderatorPerms).toContain(PERMISSIONS.USERS_DELETE);
      expect(moderatorPerms).toContain(PERMISSIONS.AUDIT_VIEW);
      expect(moderatorPerms).toContain(PERMISSIONS.CONTENT_MODERATE);
    });

    it('should have admin with all permissions', () => {
      const adminPerms = DEFAULT_ROLE_PERMISSIONS.admin;
      expect(adminPerms).toContain(PERMISSIONS.ADMIN_ACCESS);
      expect(adminPerms.length).toBeGreaterThan(10);
    });
  });

  describe('roleHasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(roleHasPermission('admin', PERMISSIONS.USERS_READ)).toBe(true);
      expect(roleHasPermission('admin', PERMISSIONS.ADMIN_ACCESS)).toBe(true);
      expect(roleHasPermission('admin', 'any:permission')).toBe(true);
    });

    it('should return true if role has the permission', () => {
      expect(roleHasPermission('viewer', PERMISSIONS.USERS_READ)).toBe(true);
      expect(roleHasPermission('member', PERMISSIONS.USERS_WRITE)).toBe(true);
      expect(roleHasPermission('moderator', PERMISSIONS.USERS_DELETE)).toBe(
        true,
      );
    });

    it('should return false if role does not have the permission', () => {
      expect(roleHasPermission('viewer', PERMISSIONS.USERS_WRITE)).toBe(false);
      expect(roleHasPermission('member', PERMISSIONS.ADMIN_ACCESS)).toBe(false);
      expect(roleHasPermission('editor', PERMISSIONS.USERS_DELETE)).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(roleHasPermission('invalid', PERMISSIONS.USERS_READ)).toBe(false);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true if user has higher role', () => {
      expect(hasMinimumRole('admin', 'moderator')).toBe(true);
      expect(hasMinimumRole('moderator', 'editor')).toBe(true);
      expect(hasMinimumRole('editor', 'member')).toBe(true);
      expect(hasMinimumRole('member', 'viewer')).toBe(true);
    });

    it('should return true if user has same role', () => {
      expect(hasMinimumRole('admin', 'admin')).toBe(true);
      expect(hasMinimumRole('member', 'member')).toBe(true);
      expect(hasMinimumRole('viewer', 'viewer')).toBe(true);
    });

    it('should return false if user has lower role', () => {
      expect(hasMinimumRole('viewer', 'member')).toBe(false);
      expect(hasMinimumRole('member', 'editor')).toBe(false);
      expect(hasMinimumRole('editor', 'admin')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasMinimumRole('invalid', 'member')).toBe(false);
      expect(hasMinimumRole('member', 'invalid')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const perms = getRolePermissions('admin');
      expect(perms.length).toBeGreaterThan(10);
      expect(perms).toContain(PERMISSIONS.ADMIN_ACCESS);
    });

    it('should return specific permissions for viewer', () => {
      const perms = getRolePermissions('viewer');
      expect(perms).toContain(PERMISSIONS.USERS_READ);
      expect(perms).toContain(PERMISSIONS.BILLING_READ);
      expect(perms).not.toContain(PERMISSIONS.USERS_WRITE);
    });

    it('should return specific permissions for member', () => {
      const perms = getRolePermissions('member');
      expect(perms).toContain(PERMISSIONS.USERS_READ);
      expect(perms).toContain(PERMISSIONS.USERS_WRITE);
      expect(perms).not.toContain(PERMISSIONS.ADMIN_ACCESS);
    });

    it('should return specific permissions for editor', () => {
      const perms = getRolePermissions('editor');
      expect(perms).toContain(PERMISSIONS.CONTENT_MODERATE);
    });

    it('should return specific permissions for moderator', () => {
      const perms = getRolePermissions('moderator');
      expect(perms).toContain(PERMISSIONS.USERS_DELETE);
      expect(perms).toContain(PERMISSIONS.AUDIT_VIEW);
    });

    it('should return empty array for invalid role', () => {
      const perms = getRolePermissions('invalid');
      expect(perms).toEqual([]);
    });
  });

  describe('canPerformAction', () => {
    it('should check permission by resource and action', () => {
      expect(canPerformAction('viewer', 'users', 'read')).toBe(true);
      expect(canPerformAction('viewer', 'users', 'write')).toBe(false);
      expect(canPerformAction('member', 'users', 'write')).toBe(true);
      expect(canPerformAction('moderator', 'users', 'delete')).toBe(true);
    });

    it('should allow admin to perform any action', () => {
      expect(canPerformAction('admin', 'users', 'read')).toBe(true);
      expect(canPerformAction('admin', 'users', 'write')).toBe(true);
      expect(canPerformAction('admin', 'users', 'delete')).toBe(true);
      expect(canPerformAction('admin', 'admin', 'access')).toBe(true);
    });

    it('should check billing permissions', () => {
      expect(canPerformAction('viewer', 'billing', 'read')).toBe(true);
      expect(canPerformAction('viewer', 'billing', 'manage')).toBe(false);
      expect(canPerformAction('admin', 'billing', 'manage')).toBe(true);
    });

    it('should check settings permissions', () => {
      expect(canPerformAction('viewer', 'settings', 'read')).toBe(true);
      expect(canPerformAction('viewer', 'settings', 'write')).toBe(false);
      expect(canPerformAction('member', 'settings', 'write')).toBe(true);
    });

    it('should check api_keys permissions', () => {
      expect(canPerformAction('viewer', 'api_keys', 'read')).toBe(true);
      expect(canPerformAction('viewer', 'api_keys', 'write')).toBe(false);
      expect(canPerformAction('member', 'api_keys', 'write')).toBe(true);
    });
  });

  describe('initializePermissions', () => {
    it('should insert all permissions into database', async () => {
      const onConflictMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoNothing: onConflictMock,
      });
      vi.mocked(db.insert).mockReturnValue({
        values: valuesMock,
      } as any);

      const consoleSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await initializePermissions();

      expect(valuesMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialized'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const onConflictMock = vi.fn().mockRejectedValue(new Error('DB error'));
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoNothing: onConflictMock,
      });
      vi.mocked(db.insert).mockReturnValue({
        values: valuesMock,
      } as any);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(initializePermissions()).rejects.toThrow('DB error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize permissions:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('seedRolePermissions', () => {
    it('should seed role-permission mappings', async () => {
      const onConflictMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoNothing: onConflictMock,
      });
      vi.mocked(db.insert).mockReturnValue({
        values: valuesMock,
      } as any);

      const consoleSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await seedRolePermissions();

      expect(valuesMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Seeded'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const onConflictMock = vi.fn().mockRejectedValue(new Error('DB error'));
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoNothing: onConflictMock,
      });
      vi.mocked(db.insert).mockReturnValue({
        values: valuesMock,
      } as any);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(seedRolePermissions()).rejects.toThrow('DB error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to seed role permissions:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getPermissionsForRole', () => {
    it('should query database for role permissions', async () => {
      const mockPermissions = [
        {
          id: 'users:read',
          name: 'users:read',
          description: 'Read users',
          resource: 'users',
          action: 'read',
        },
        {
          id: 'users:write',
          name: 'users:write',
          description: 'Write users',
          resource: 'users',
          action: 'write',
        },
      ];

      const whereMock = vi.fn().mockResolvedValue(mockPermissions);
      const joinMock = vi.fn().mockReturnValue({ where: whereMock });
      const fromMock = vi.fn().mockReturnValue({ innerJoin: joinMock });
      vi.mocked(db.select).mockReturnValue({
        from: fromMock,
      } as any);

      const result = await getPermissionsForRole('member');

      expect(result).toEqual(mockPermissions);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('hasPermission', () => {
    it('should check if user has permission', async () => {
      const result = await hasPermission('admin', PERMISSIONS.USERS_READ);
      expect(result).toBe(true);
    });

    it('should return false for invalid permission', async () => {
      const result = await hasPermission('viewer', PERMISSIONS.ADMIN_ACCESS);
      expect(result).toBe(false);
    });
  });

  describe('Role hierarchy validation', () => {
    it('should have correct hierarchy order', () => {
      expect(hasMinimumRole('admin', 'admin')).toBe(true);
      expect(hasMinimumRole('admin', 'moderator')).toBe(true);
      expect(hasMinimumRole('admin', 'editor')).toBe(true);
      expect(hasMinimumRole('admin', 'member')).toBe(true);
      expect(hasMinimumRole('admin', 'viewer')).toBe(true);
    });

    it('should enforce permission inheritance', () => {
      const viewerPerms = getRolePermissions('viewer');
      const memberPerms = getRolePermissions('member');
      const editorPerms = getRolePermissions('editor');

      // Member should have at least viewer permissions
      for (const perm of viewerPerms) {
        expect(
          memberPerms.includes(perm as any) ||
            roleHasPermission('member', perm as string),
        ).toBe(true);
      }

      // Editor should have content moderation
      expect(editorPerms).toContain(PERMISSIONS.CONTENT_MODERATE);
    });
  });
});
