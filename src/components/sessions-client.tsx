/**
 * Sessions Client Component
 *
 * Displays and manages user's active sessions.
 *
 * @module components/sessions-client
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Session {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';

  // Simple parsing - can be enhanced with a library
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';
  if (ua.includes('Mobile')) return 'Mobile Device';

  return 'Unknown Browser';
}

export function SessionsClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  async function revokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    setRevoking(sessionId);
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from list
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <div className="text-gray-600">No active sessions found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">
                {parseUserAgent(session.userAgent)}
                {session.isCurrent && (
                  <span className="ml-2 rounded bg-green-600 px-2 py-1 text-xs text-white">
                    Current
                  </span>
                )}
              </span>
              {!session.isCurrent && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                  disabled={revoking === session.id}
                >
                  {revoking === session.id ? 'Revoking...' : 'Revoke'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">IP Address:</span>
                <span className="font-mono">
                  {session.ipAddress || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(session.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span>{formatDate(session.expiresAt)}</span>
              </div>
              {session.userAgent && (
                <div className="flex justify-between">
                  <span className="text-gray-600">User Agent:</span>
                  <span className="max-w-md truncate text-xs text-gray-500">
                    {session.userAgent}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mt-6 text-sm text-gray-600">
        <p>
          💡 <strong>Tip:</strong> If you see a session you don't recognize,
          revoke it immediately and change your password.
        </p>
      </div>
    </div>
  );
}
