'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Upload, 
  Image as ImageIcon, 
  Trash2,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export default function NewEpisodePage() {
  const router = useRouter();
  
  // Episode metadata
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const removeCover = () => {
    setCoverImage(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (err) {
      setError('Could not access microphone. Please allow microphone permissions.');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState('stopped');
    }
  };

  // Discard recording
  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState('idle');
    setDuration(0);
  };

  // Publish episode
  const publishEpisode = async () => {
    if (!title.trim()) {
      setError('Please enter an episode title');
      return;
    }
    if (!audioBlob) {
      setError('Please record an episode first');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const audioFileName = `episodes/${timestamp}-audio.webm`;
      
      // 1. Upload audio to Supabase Storage
      const { error: audioError } = await supabase.storage
        .from('media')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (audioError) throw new Error(`Audio upload failed: ${audioError.message}`);

      // Get public URL for audio
      const { data: audioUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(audioFileName);

      // 2. Upload cover image if provided
      let coverUrl = null;
      if (coverImage) {
        const coverFileName = `covers/${timestamp}-cover.${coverImage.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from('media')
          .upload(coverFileName, coverImage, {
            contentType: coverImage.type,
            upsert: false
          });

        if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`);

        const { data: coverUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(coverFileName);
        coverUrl = coverUrlData.publicUrl;
      }

      // 3. Create episode in database
      const { data: episode, error: dbError } = await supabase
        .from('episodes')
        .insert({
          title: title.trim(),
          summary: summary.trim() || null,
          audio_url: audioUrlData.publicUrl,
          cover_image_url: coverUrl,
          duration_seconds: duration,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      // 4. Create a placeholder transcript node (transcription can be added later)
      await supabase
        .from('transcript_nodes')
        .insert({
          episode_id: episode.id,
          content: 'Transcript pending...',
          display_order: 0
        });

      // Success! Redirect to admin
      router.push('/admin');
      
    } catch (err: any) {
      setError(err.message || 'Failed to publish episode');
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-stone-900 mb-8">Record New Episode</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Episode Details */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Episode Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-stone-600 text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 outline-none"
              placeholder="Episode title..."
            />
          </div>

          <div>
            <label className="block text-stone-600 text-sm font-medium mb-1">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 outline-none resize-none"
              rows={3}
              placeholder="Brief description of this episode..."
            />
          </div>
        </div>
      </div>

      {/* Cover Art */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Cover Art</h2>
        
        {coverPreview ? (
          <div className="relative inline-block">
            <img 
              src={coverPreview} 
              alt="Cover preview" 
              className="w-48 h-48 object-cover rounded-lg border border-stone-200"
            />
            <button
              onClick={removeCover}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-stone-400 transition-colors">
            <ImageIcon className="text-stone-400 mb-2" size={32} />
            <span className="text-sm text-stone-500">Click to upload</span>
            <span className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Recording Section */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Recording</h2>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center py-8">
          
          {/* Timer Display */}
          <div className="text-5xl font-mono text-stone-900 mb-8">
            {formatDuration(duration)}
          </div>

          {/* Recording Status Indicator */}
          {recordingState === 'recording' && (
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Recording...</span>
            </div>
          )}
          {recordingState === 'paused' && (
            <div className="flex items-center gap-2 text-amber-500 mb-4">
              <Pause size={16} />
              <span className="font-medium">Paused</span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-colors"
              >
                <Mic size={20} />
                Start Recording
              </button>
            )}

            {recordingState === 'recording' && (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Pause size={20} />
                  Pause
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-stone-800 text-white px-5 py-3 rounded-full font-semibold hover:bg-stone-900 transition-colors"
                >
                  <Square size={20} />
                  Stop
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button
                  onClick={resumeRecording}
                  className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors"
                >
                  <Play size={20} />
                  Resume
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-stone-800 text-white px-5 py-3 rounded-full font-semibold hover:bg-stone-900 transition-colors"
                >
                  <Square size={20} />
                  Stop
                </button>
              </>
            )}

            {recordingState === 'stopped' && (
              <button
                onClick={discardRecording}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
              >
                <Trash2 size={18} />
                Discard & Re-record
              </button>
            )}
          </div>
        </div>

        {/* Audio Preview */}
        {audioUrl && recordingState === 'stopped' && (
          <div className="border-t border-stone-200 pt-6 mt-4">
            <h3 className="text-sm font-medium text-stone-600 mb-3">Preview Recording</h3>
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
              <Clock size={12} />
              Duration: {formatDuration(duration)}
            </p>
          </div>
        )}
      </div>

      {/* Publish Button */}
      <button
        onClick={publishEpisode}
        disabled={isPublishing || !audioBlob || !title.trim()}
        className="w-full bg-stone-900 text-white py-4 rounded-xl font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPublishing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Publishing...
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            Publish Episode
          </>
        )}
      </button>

      <p className="text-center text-sm text-stone-400 mt-4">
        Your episode will be immediately available on the public site after publishing.
      </p>
    </div>
  );
}
