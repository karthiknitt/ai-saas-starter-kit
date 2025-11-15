'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filter !== 'all') {
        params.append('action', filter);
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    if (action.includes('role_changed')) {
      return <Badge variant="default">Role Change</Badge>;
    }
    if (action.includes('created')) {
      return <Badge className="bg-green-600">Created</Badge>;
    }
    if (action.includes('deleted') || action.includes('canceled')) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    if (action.includes('updated')) {
      return <Badge variant="secondary">Updated</Badge>;
    }
    if (action.includes('login')) {
      return <Badge variant="outline">Login</Badge>;
    }
    return <Badge>{action}</Badge>;
  };

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading audit logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user.role_changed">Role Changes</SelectItem>
                <SelectItem value="user.created">User Created</SelectItem>
                <SelectItem value="user.deleted">User Deleted</SelectItem>
                <SelectItem value="subscription.created">Subscription Created</SelectItem>
                <SelectItem value="subscription.updated">Subscription Updated</SelectItem>
                <SelectItem value="subscription.canceled">Subscription Canceled</SelectItem>
                <SelectItem value="api_key.created">API Key Created</SelectItem>
                <SelectItem value="api_key.updated">API Key Updated</SelectItem>
                <SelectItem value="auth.login">Login</SelectItem>
                <SelectItem value="admin.access">Admin Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit logs found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.name}</p>
                            <p className="text-xs text-muted-foreground">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.resourceType && (
                          <div className="text-sm">
                            <Badge variant="outline">{log.resourceType}</Badge>
                            {log.resourceId && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {log.resourceId.substring(0, 12)}...
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.changes && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary">View changes</summary>
                            <pre className="mt-2 p-2 bg-secondary rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < limit || loading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
