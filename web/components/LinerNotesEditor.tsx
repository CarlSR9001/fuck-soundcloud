'use client';

import { useState, useEffect } from 'react';
import { LinerNotesDisplay } from './LinerNotesDisplay';

interface LinerNotesEditorProps {
  versionId: string;
  initialData?: {
    linerNotes: string | null;
    sessionDate: string | null;
    sessionLocation: string | null;
    instruments: string[] | null;
    gear: string[] | null;
  };
  onSave: (data: LinerNotesData) => Promise<void>;
}

export interface LinerNotesData {
  liner_notes?: string;
  session_date?: string;
  session_location?: string;
  instruments?: string[];
  gear?: string[];
}

/**
 * LinerNotesEditor Component
 *
 * Full-featured editor for track liner notes with:
 * - Markdown editor with live preview
 * - Session metadata (date, location)
 * - Instrument and gear list builders
 * - Auto-save to localStorage
 */
export function LinerNotesEditor({ versionId, initialData, onSave }: LinerNotesEditorProps) {
  const [linerNotes, setLinerNotes] = useState(initialData?.linerNotes || '');
  const [sessionDate, setSessionDate] = useState(initialData?.sessionDate || '');
  const [sessionLocation, setSessionLocation] = useState(initialData?.sessionLocation || '');
  const [instruments, setInstruments] = useState<string[]>(initialData?.instruments || []);
  const [gear, setGear] = useState<string[]>(initialData?.gear || []);
  const [newInstrument, setNewInstrument] = useState('');
  const [newGear, setNewGear] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const storageKey = `liner-notes-draft-${versionId}`;

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(storageKey);
    if (draft) {
      const parsed = JSON.parse(draft);
      setLinerNotes(parsed.liner_notes || '');
      setSessionDate(parsed.session_date || '');
      setSessionLocation(parsed.session_location || '');
      setInstruments(parsed.instruments || []);
      setGear(parsed.gear || []);
    }
  }, [storageKey]);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = { liner_notes: linerNotes, session_date: sessionDate, session_location: sessionLocation, instruments, gear };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [linerNotes, sessionDate, sessionLocation, instruments, gear, storageKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        liner_notes: linerNotes,
        session_date: sessionDate || undefined,
        session_location: sessionLocation || undefined,
        instruments: instruments.length > 0 ? instruments : undefined,
        gear: gear.length > 0 ? gear : undefined,
      });
      setSaved(true);
      localStorage.removeItem(storageKey);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save liner notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const addInstrument = () => {
    if (newInstrument.trim() && !instruments.includes(newInstrument.trim())) {
      setInstruments([...instruments, newInstrument.trim()]);
      setNewInstrument('');
    }
  };

  const removeInstrument = (idx: number) => {
    setInstruments(instruments.filter((_, i) => i !== idx));
  };

  const addGear = () => {
    if (newGear.trim() && !gear.includes(newGear.trim())) {
      setGear([...gear, newGear.trim()]);
      setNewGear('');
    }
  };

  const removeGear = (idx: number) => {
    setGear(gear.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${!showPreview ? 'bg-accent-500 text-white' : 'bg-surface text-neutral-700 hover:bg-surfaceAlt'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${showPreview ? 'bg-accent-500 text-white' : 'bg-surface text-neutral-700 hover:bg-surfaceAlt'}`}
        >
          Preview
        </button>
      </div>

      {showPreview ? (
        <LinerNotesDisplay
          linerNotes={linerNotes}
          sessionDate={sessionDate}
          sessionLocation={sessionLocation}
          instruments={instruments}
          gear={gear}
        />
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-surface rounded-lg border border-border">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Session Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Session Date</label>
                <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Location</label>
                <input type="text" value={sessionLocation} onChange={(e) => setSessionLocation(e.target.value)} placeholder="Studio name or location" maxLength={300} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-surface rounded-lg border border-border">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Instruments</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newInstrument} onChange={(e) => setNewInstrument(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInstrument()} placeholder="Add instrument..." className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" />
              <button onClick={addInstrument} className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {instruments.map((inst, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm">
                  {inst}
                  <button onClick={() => removeInstrument(idx)} className="text-accent-500 hover:text-accent-700">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 bg-surface rounded-lg border border-border">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Gear & Plugins</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newGear} onChange={(e) => setNewGear(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addGear()} placeholder="Add gear or plugin..." className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" />
              <button onClick={addGear} className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {gear.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm">
                  {item}
                  <button onClick={() => removeGear(idx)} className="text-accent-500 hover:text-accent-700">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 bg-surface rounded-lg border border-border">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Liner Notes (Markdown)</h3>
            <textarea value={linerNotes} onChange={(e) => setLinerNotes(e.target.value)} placeholder="Tell the story behind this track... (supports Markdown)" maxLength={50000} rows={12} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm" />
            <p className="text-xs text-neutral-500 mt-2">{linerNotes.length} / 50,000 characters</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
          {saving ? 'Saving...' : 'Save Liner Notes'}
        </button>
        {saved && <span className="flex items-center text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}
