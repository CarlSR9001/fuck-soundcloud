'use client';

import { useState, useEffect } from 'react';
import { fetchStems, getStemDownloadUrl, createStem, deleteStem, Stem } from '@/lib/api';

interface StemsPanelProps {
  versionId: string;
  trackOwnerId: string;
}

const STEM_ROLES: Array<{ value: Stem['role']; label: string }> = [
  { value: 'vocal', label: 'Vocals' },
  { value: 'drum', label: 'Drums' },
  { value: 'bass', label: 'Bass' },
  { value: 'guitar', label: 'Guitar' },
  { value: 'synth', label: 'Synth' },
  { value: 'fx', label: 'FX' },
  { value: 'other', label: 'Other' },
];

/**
 * StemsPanel Component - Displays and manages track stems
 */
export function StemsPanel({ versionId, trackOwnerId }: StemsPanelProps) {
  const [stems, setStems] = useState<Stem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRole, setUploadRole] = useState<Stem['role']>('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isOwner = typeof window !== 'undefined' && localStorage.getItem('user_id') === trackOwnerId;
  useEffect(() => {
    loadStems();
  }, [versionId]);
  async function loadStems() {
    try {
      setLoading(true);
      const data = await fetchStems(versionId);
      setStems(data);
      setError(null);
    } catch {
      setError('Failed to load stems');
    } finally {
      setLoading(false);
    }
  }
  async function handleDownload(stemId: string, title: string) {
    try {
      const { url } = await getStemDownloadUrl(stemId);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert('Failed to download stem');
    }
  }
  async function handleDelete(stemId: string) {
    if (!confirm('Delete this stem?')) return;
    try {
      await deleteStem(stemId, localStorage.getItem('auth_token') || '');
      await loadStems();
    } catch {
      alert('Failed to delete stem');
    }
  }
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !isOwner) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const arrayBuffer = await uploadFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const PART_SIZE = 5 * 1024 * 1024;
      const parts = Math.ceil(uploadFile.size / PART_SIZE);

      const initRes = await fetch('/api/v1/upload/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ filename: uploadFile.name, size: uploadFile.size, sha256, mime: uploadFile.type, parts }),
      });
      const { uploadId, key, presignedParts } = await initRes.json();

      const etags = [];
      for (let i = 0; i < parts; i++) {
        const start = i * PART_SIZE;
        const end = Math.min(start + PART_SIZE, uploadFile.size);
        const chunk = uploadFile.slice(start, end);
        const uploadRes = await fetch(presignedParts[i].uploadUrl, { method: 'PUT', body: chunk });
        etags.push({ partNumber: i + 1, etag: uploadRes.headers.get('ETag')?.replace(/"/g, '') || '' });
        setUploadProgress(Math.round(((i + 1) / parts) * 100));
      }

      const completeRes = await fetch('/api/v1/upload/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ uploadId, key, etags }),
      });
      const { assetId } = await completeRes.json();

      await createStem(versionId, { role: uploadRole, title: uploadTitle, asset_id: assetId }, token);
      setUploadFile(null);
      setUploadTitle('');
      setUploadRole('other');
      setUploadProgress(0);
      await loadStems();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }
  const stemsByRole = stems.reduce((acc, stem) => {
    if (!acc[stem.role]) acc[stem.role] = [];
    acc[stem.role].push(stem);
    return acc;
  }, {} as Record<Stem['role'], Stem[]>);
  if (loading) return <div className="p-6 text-neutral-500">Loading stems...</div>;
  return (
    <div className="bg-surface rounded-lg border border-border shadow-md p-6">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Stems</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
      {stems.length === 0 ? (
        <p className="text-neutral-500 mb-6">No stems available</p>
      ) : (
        <div className="space-y-6 mb-8">
          {STEM_ROLES.map(({ value, label }) => {
            const rolStems = stemsByRole[value];
            if (!rolStems || rolStems.length === 0) return null;
            return (
              <div key={value}>
                <h3 className="text-sm font-medium text-neutral-700 uppercase mb-2">{label}</h3>
                <div className="space-y-2">
                  {rolStems.map((stem) => (
                    <div key={stem.id} className="flex items-center justify-between p-3 bg-surfaceAlt rounded border border-border">
                      <span className="text-neutral-900">{stem.title}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(stem.id, stem.title)} className="px-3 py-1 bg-accent-500 text-white rounded hover:bg-accent-600 transition text-sm">
                          Download
                        </button>
                        {isOwner && (
                          <button onClick={() => handleDelete(stem.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isOwner && (
        <form onSubmit={handleUpload} className="border-t border-border pt-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Upload Stem</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">File</label>
              <input type="file" accept="audio/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-border rounded" disabled={uploading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
              <select value={uploadRole} onChange={(e) => setUploadRole(e.target.value as Stem['role'])} className="w-full px-3 py-2 border border-border rounded" disabled={uploading}>
                {STEM_ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded" placeholder="e.g., Lead Vocal Dry" disabled={uploading} />
            </div>
            {uploading && (
              <div className="w-full bg-neutral-200 rounded h-2">
                <div className="bg-accent-500 h-2 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            <button type="submit" disabled={!uploadFile || !uploadTitle || uploading} className="w-full px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Stem'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
