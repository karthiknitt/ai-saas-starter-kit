'use client';

import React from 'react';

function RoleBadge({ role }: { role: string }) {
  const color = role === 'admin' ? 'bg-purple-600' : 'bg-gray-500';
  return (
    <span className={`rounded px-2 py-1 text-xs text-white ${color}`}>
      {role}
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

  async function updateRole(userId: string, role: 'member' | 'admin') {
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
              <td className="space-x-2 p-2">
                <button
                  type="button"
                  className="rounded bg-gray-200 px-2 py-1 text-xs disabled:opacity-50"
                  disabled={saving === u.id || u.role === 'member'}
                  onClick={() => updateRole(u.id, 'member')}
                >
                  Make Member
                </button>
                <button
                  type="button"
                  className="rounded bg-purple-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  disabled={saving === u.id || u.role === 'admin'}
                  onClick={() => updateRole(u.id, 'admin')}
                >
                  Make Admin
                </button>
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
