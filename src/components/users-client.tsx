'use client';

import React from 'react';

const ROLE_COLORS = {
  admin: 'bg-purple-600',
  moderator: 'bg-blue-600',
  editor: 'bg-green-600',
  member: 'bg-gray-500',
  viewer: 'bg-gray-400',
} as const;

const ROLE_LABELS = {
  admin: 'Admin',
  moderator: 'Moderator',
  editor: 'Editor',
  member: 'Member',
  viewer: 'Viewer',
} as const;

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-500';
  const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
  return (
    <span className={`rounded px-2 py-1 text-xs text-white ${color}`}>
      {label}
    </span>
  );
}

interface PaginationData {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function UsersClient({
  users: initialUsers,
  pagination,
}: {
  users: { id: string; name: string; email: string; role: string }[];
  pagination?: PaginationData;
}) {
  const [users, setUsers] = React.useState(initialUsers);
  const [saving, setSaving] = React.useState<string | null>(null);

  async function updateRole(
    userId: string,
    role: 'viewer' | 'member' | 'editor' | 'moderator' | 'admin',
  ) {
    try {
      setSaving(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error('Failed');
      setUsers((prev: typeof initialUsers) =>
        prev.map((u: (typeof initialUsers)[0]) =>
          u.id === userId ? { ...u, role } : u,
        ),
      );
    } catch {
      alert('Failed to update role');
    } finally {
      setSaving(null);
    }
  }

  function createPageUrl(page: number) {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (pagination) {
      params.set('pageSize', pagination.pageSize.toString());
    }
    return `?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: (typeof initialUsers)[0]) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                <RoleBadge role={u.role} />
              </td>
              <td className="p-2">
                <select
                  value={u.role}
                  disabled={saving === u.id}
                  onChange={(e) =>
                    updateRole(
                      u.id,
                      e.target.value as
                        | 'viewer'
                        | 'member'
                        | 'editor'
                        | 'moderator'
                        | 'admin',
                    )
                  }
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="editor">Editor</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.totalCount,
            )}{' '}
            of {pagination.totalCount} users
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={
                pagination.currentPage > 1
                  ? createPageUrl(pagination.currentPage - 1)
                  : undefined
              }
              className={`rounded px-3 py-1 text-sm ${
                pagination.currentPage > 1
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              {...(pagination.currentPage <= 1 && { 'aria-disabled': 'true' })}
            >
              Previous
            </a>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <a
              href={
                pagination.currentPage < pagination.totalPages
                  ? createPageUrl(pagination.currentPage + 1)
                  : undefined
              }
              className={`rounded px-3 py-1 text-sm ${
                pagination.currentPage < pagination.totalPages
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              {...(pagination.currentPage >= pagination.totalPages && {
                'aria-disabled': 'true',
              })}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
