/**
 * ModerationClient Component
 *
 * Client-side moderation dashboard with tabs for reports, strikes, and DMCA.
 */

'use client';

import { useEffect, useState } from 'react';
import { fetchReports, fetchDMCARequests, resolveReport, processDMCARequest, issueStrike, banUser, Report, DMCARequest } from '@/lib/api';

type Tab = 'reports' | 'strikes' | 'dmca';

export function ModerationClient() {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [dmcaRequests, setDmcaRequests] = useState<DMCARequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) {
        setError('Authentication required');
        return;
      }

      if (activeTab === 'reports') {
        const data = await fetchReports(statusFilter, token);
        setReports(data);
      } else if (activeTab === 'dmca') {
        const data = await fetchDMCARequests(token);
        setDmcaRequests(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      await resolveReport(reportId, action, token);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve report');
    }
  };

  const handleProcessDMCA = async (requestId: string, action: 'takedown' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this DMCA request?`)) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      await processDMCARequest(requestId, action, token);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process DMCA request');
    }
  };

  const handleIssueStrike = async (userId: string) => {
    const reason = prompt('Enter reason for strike:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      await issueStrike(userId, reason, token);
      alert('Strike issued successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to issue strike');
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter reason for ban:');
    if (!reason) return;

    if (!confirm('Are you sure you want to ban this user? This action is permanent.')) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      await banUser(userId, reason, token);
      alert('User banned successfully');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-sm">Moderation Dashboard</h1>
        <p className="text-lg text-neutral-600">Manage reports, strikes, and DMCA requests.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-md">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-lg py-md font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('strikes')}
            className={`px-lg py-md font-medium border-b-2 transition-colors ${
              activeTab === 'strikes'
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Strikes
          </button>
          <button
            onClick={() => setActiveTab('dmca')}
            className={`px-lg py-md font-medium border-b-2 transition-colors ${
              activeTab === 'dmca'
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            DMCA Requests
          </button>
        </nav>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-lg">
          {/* Status Filter */}
          <div className="flex gap-md">
            {['pending', 'reviewing', 'resolved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-accent-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Reports Table */}
          {isLoading ? (
            <div className="text-center py-xl">Loading...</div>
          ) : error ? (
            <div className="p-lg bg-error/10 border border-error/30 rounded-lg text-error">{error}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-xl text-neutral-600">No reports found.</div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Track ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Reason</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-neutral-900">{report.track_id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">{report.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'resolved' ? 'bg-accent-100 text-accent-800' :
                          report.status === 'rejected' ? 'bg-error/10 text-error' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DMCA Tab */}
      {activeTab === 'dmca' && (
        <div className="space-y-lg">
          {isLoading ? (
            <div className="text-center py-xl">Loading...</div>
          ) : error ? (
            <div className="p-lg bg-error/10 border border-error/30 rounded-lg text-error">{error}</div>
          ) : dmcaRequests.length === 0 ? (
            <div className="text-center py-xl text-neutral-600">No DMCA requests found.</div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Claimant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Track ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {dmcaRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">{request.claimant_name}</div>
                        <div className="text-xs text-neutral-500">{request.claimant_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-neutral-900">{request.track_id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'takedown' ? 'bg-error/10 text-error' :
                          request.status === 'rejected' ? 'bg-neutral-100 text-neutral-800' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessDMCA(request.id, 'takedown')}
                            className="text-sm text-error hover:text-error/80 font-medium"
                          >
                            Takedown
                          </button>
                          <button
                            onClick={() => handleProcessDMCA(request.id, 'reject')}
                            className="text-sm text-neutral-600 hover:text-neutral-800 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="p-xl space-y-lg">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-neutral-900">Review Report</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-md">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Track ID</label>
                  <p className="mt-1 font-mono text-neutral-900">{selectedReport.track_id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">Reason</label>
                  <p className="mt-1 text-neutral-900">{selectedReport.reason}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">Evidence</label>
                  <div className="mt-1 p-md bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-900 whitespace-pre-wrap">{selectedReport.evidence}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">Status</label>
                  <p className="mt-1 text-neutral-900">{selectedReport.status}</p>
                </div>
              </div>

              <div className="flex gap-md pt-lg border-t border-neutral-200">
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'approve')}
                  className="flex-1 py-3 bg-error text-white font-medium rounded-lg hover:bg-error/90 transition-colors"
                >
                  Approve & Remove Content
                </button>
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'reject')}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Reject Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
