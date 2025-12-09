'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, List, Edit, ExternalLink, Clock, Trash2, Wand2, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEpisodes = async () => {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setEpisodes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  // Generate Transcript for an episode
  const handleGenerateTranscript = async (episode: any) => {
    if (!episode.audio_url) {
      alert('No audio file found for this episode');
      return;
    }

    setTranscribing(episode.id);

    try {
      // Fetch the audio file
      const response = await fetch(episode.audio_url);
      const audioBlob = await response.blob();

      // Send to transcription API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('episodeId', episode.id);

      const transcriptRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptRes.ok) {
        throw new Error('Transcription failed');
      }

      const result = await transcriptRes.json();
      alert('Transcript generated! ' + result.nodeCount + ' segments created.');
      
    } catch (error: any) {
      alert('Error generating transcript: ' + error.message);
    } finally {
      setTranscribing(null);
    }
  };

  // Delete an episode
  const handleDelete = async (episode: any) => {
    if (!confirm('Are you sure you want to delete "' + episode.title + '"? This cannot be undone.')) {
      return;
    }

    setDeleting(episode.id);

    try {
      // Delete from database (cascade will delete transcript_nodes)
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episode.id);

      if (error) throw error;

      // Remove from local state
      setEpisodes(prev => prev.filter(e => e.id !== episode.id));
      
    } catch (error: any) {
      alert('Error deleting episode: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Command Center</h1>
          <p className="text-stone-500 mt-1">Manage your episodes and broadcasts</p>
        </div>
        <Link 
          href="/admin/episodes/new"
          className="bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Mic size={20} />
          New Episode
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <List className="text-stone-600" size={20} />
            </div>
            <span className="text-sm font-medium text-stone-500">Total Episodes</span>
          </div>
          <p className="text-4xl font-bold text-stone-900">{episodes.length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-sm font-medium text-stone-500">Published</span>
          </div>
          <p className="text-4xl font-bold text-green-600">{episodes.filter(e => e.is_published).length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Edit className="text-amber-600" size={20} />
            </div>
            <span className="text-sm font-medium text-stone-500">Drafts</span>
          </div>
          <p className="text-4xl font-bold text-amber-600">{episodes.filter(e => !e.is_published).length}</p>
        </div>
      </div>

      {/* Episode Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="font-bold text-stone-900">All Episodes</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-stone-400">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Loading episodes...
          </div>
        ) : episodes.length === 0 ? (
          <div className="p-12 text-center">
            <Mic className="mx-auto mb-4 text-stone-300" size={48} />
            <p className="text-stone-500 mb-4">No episodes yet. Time to hit record!</p>
            <Link 
              href="/admin/episodes/new"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
            >
              <Mic size={18} />
              Record First Episode
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {episodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900">{episode.title}</div>
                    {episode.summary && (
                      <div className="text-sm text-stone-400 truncate max-w-xs">{episode.summary}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {episode.is_published ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-stone-500">
                      <Clock size={14} />
                      {formatDuration(episode.duration_seconds)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(episode.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Generate Transcript Button */}
                      <button
                        onClick={() => handleGenerateTranscript(episode)}
                        disabled={transcribing === episode.id}
                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Generate Transcript"
                      >
                        {transcribing === episode.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Wand2 size={18} />
                        )}
                      </button>
                      
                      {/* Edit Transcript */}
                      <Link
                        href={'/admin/episodes/' + episode.id}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit Transcript"
                      >
                        <Edit size={18} />
                      </Link>
                      
                      {/* View Live */}
                      {episode.is_published && (
                        <Link
                          href="/"
                          target="_blank"
                          className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Live"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      )}
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(episode)}
                        disabled={deleting === episode.id}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Episode"
                      >
                        {deleting === episode.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
