import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";

// Server Component - runs on every request
export default async function Home() {

  // 1. Fetch ALL published episodes for the archive dropdown
  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  // 2. Get the latest episode (first in the sorted list)
  const latestEpisode = allEpisodes?.[0];
  
  // 3. Get previous episodes for archive (exclude latest)
  const previousEpisodes = allEpisodes?.slice(1) || [];

  // If no episode is found, show a "Coming Soon" state
  if (!latestEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-800 font-serif relative">
        {/* Minimal Nav for Coming Soon */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-serif font-bold text-stone-900">
              Stoop<span className="text-orange-600">Politics</span>
            </span>
            <Link href="/login" className="text-stone-500 hover:text-stone-900 transition-colors">
              <User size={20} />
            </Link>
          </div>
        </nav>
        <div className="text-center p-8">
          <h1 className="text-5xl font-serif font-bold mb-4">Stoop Politics</h1>
          <p className="text-xl text-stone-600">Our first broadcast is coming soon to the stoop.</p>
        </div>
      </div>
    );
  }

  // 4. Fetch the transcript for the latest episode
  const { data: transcript } = await supabase
    .from('transcript_nodes')
    .select('*')
    .eq('episode_id', latestEpisode.id)
    .order('display_order', { ascending: true });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      
      {/* ===== STICKY NAVIGATION BAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="text-xl font-serif font-bold text-stone-900 hover:opacity-80 transition-opacity">
            Stoop<span className="text-orange-600">Politics</span>
          </Link>
          
          {/* Right Side: Archive + Login */}
          <div className="flex items-center gap-6">
            
            {/* Archive Dropdown */}
            {previousEpisodes.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                  Previous Episodes
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <div className="py-2">
                    {previousEpisodes.map((ep) => (
                      <Link 
                        key={ep.id}
                        href={'/?episode=' + ep.id}
                        className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors border-b border-stone-100 last:border-0"
                      >
                        <span className="font-medium line-clamp-1">{ep.title}</span>
                        <span className="text-xs text-stone-400 block mt-0.5">
                          {new Date(ep.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Admin Login Link */}
            <Link 
              href="/login" 
              className="text-stone-400 hover:text-stone-900 transition-colors"
              title="Admin Login"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      {/* ===== HERO SECTION ===== */}
      <header className="relative max-w-5xl mx-auto px-6 pt-8 pb-8">
        
        {/* Hero Image - Grayscale to Color on Hover */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl mb-10 bg-stone-300 group cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop" 
            alt="Kids sitting on a New York City stoop"
            className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-100 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent"></div>
          
          {/* Episode Badge & Title Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 shadow-lg">
              <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
              Latest Broadcast
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow-lg">
              {latestEpisode.title}
            </h2>
          </div>
        </div>

        {/* Podcast Title & Host Byline */}
        <div className="border-b-2 border-stone-200 pb-8">
          <h1 className="text-5xl md:text-6xl font-serif font-black text-stone-900 mb-3 tracking-tight">
            Stoop Politics
          </h1>
          <div className="flex items-center gap-3 text-lg font-medium text-stone-500 mb-6">
            <span>with <span className="text-stone-900 font-bold">Jessie Mercury</span></span>
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            <span className="uppercase text-sm tracking-widest">New York City</span>
          </div>
          {latestEpisode.summary && (
            <p className="text-xl text-stone-600 leading-relaxed max-w-3xl">
              {latestEpisode.summary}
            </p>
          )}
        </div>
      </header>

      {/* ===== STICKY AUDIO PLAYER ===== */}
      <div className="sticky top-16 z-40 bg-stone-50/95 backdrop-blur-md border-y border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <audio 
            controls 
            className="w-full h-12"
            style={{ accentColor: '#ea580c' }}
          >
            <source src={latestEpisode.audio_url} type="audio/webm" />
            <source src={latestEpisode.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>

      {/* ===== INTERACTIVE TRANSCRIPT ===== */}
      <article className="max-w-3xl mx-auto px-6 py-12 pb-32">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-8">Transcript</h3>
        
        <div className="prose prose-lg prose-stone max-w-none leading-relaxed text-stone-700">
          {transcript && transcript.length > 0 ? (
            transcript.map((node) => (
              <span key={node.id} className="mr-1">
                {node.reference_link ? (
                  <a 
                    href={node.reference_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold underline decoration-2 decoration-orange-200 hover:decoration-orange-600 hover:bg-orange-50 transition-all cursor-pointer rounded px-0.5"
                    title={node.reference_title || 'View Source'}
                  >
                    {node.content}
                  </a>
                ) : (
                  <span>{node.content}</span>
                )}
              </span>
            ))
          ) : (
            <p className="text-stone-400 italic">Transcript will appear here once generated.</p>
          )}
        </div>
      </article>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-stone-200 bg-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-stone-500">
            &copy; {new Date().getFullYear()} Stoop Politics. All rights reserved.
          </p>
        </div>
      </footer>

    </main>
  );
}
