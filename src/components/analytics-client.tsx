/**
 * Analytics Client Component
 *
 * Interactive analytics dashboard with charts and metrics.
 * Displays usage trends, model breakdown, and performance metrics.
 *
 * @module components/analytics-client
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  period: string;
  userId: string;
  quota: {
    used: string;
    limit: string;
    resetAt: string | null;
  };
  metrics: {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    avgResponseTime: number;
  };
  charts: {
    byResourceType: Record<string, number>;
    byDay: Array<{ date: string; count: number }>;
    modelUsage: Record<string, number>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export function AnalyticsClient({ userId }: { userId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/analytics?period=${period}&userId=${userId}`,
        );
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [period, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  const resourceTypeData = Object.entries(data.charts.byResourceType).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const modelUsageData = Object.entries(data.charts.modelUsage).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const quotaUsed = Number.parseInt(data.quota.used, 10);
  const quotaLimit = Number.parseInt(data.quota.limit, 10);
  const quotaPercentage =
    quotaLimit > 0 ? Math.round((quotaUsed / quotaLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="period-select" className="text-sm font-medium">
          Time Period:
        </label>
        <select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalRequests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.errorRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.metrics.errorCount} errors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.avgResponseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quota Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotaPercentage}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.quota.used} / {data.quota.limit}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Trend Chart */}
      {data.charts.byDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.charts.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Resource Type Distribution */}
        {resourceTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resource Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resourceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resourceTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Model Usage */}
        {modelUsageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Model Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {data.metrics.totalRequests === 0 && (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="text-gray-600">
              No usage data available for this period.
              <br />
              Start using the AI chat to see analytics here.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
