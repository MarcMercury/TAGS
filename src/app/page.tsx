import { supabase } from "@/lib/supabase";
import { MoveRight } from "lucide-react"; // Icon for style
import Link from "next/link";

// This function runs on the server every time a user requests the page
export default async function Home() {

  // 1. Fetch the single most recent PUBLISHED episode
  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  // If no episode is found, show a "Coming Soon" state
  if (!episode || episodeError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-800 font-serif relative">
        <Link 
          href="/login" 
          className="absolute top-4 right-4 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          Login
        </Link>
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">Stoop Politics</h1>
          <p className="text-lg">Our first broadcast is coming soon to the stoop.</p>
        </div>
      </div>
    );
  }

  // 2. Fetch the transcript chunks for this specific episode
  const { data: transcript, error: transcriptError } = await supabase
    .from('transcript_nodes')
    .select('*')
    .eq('episode_id', episode.id)
    .order('display_order', { ascending: true });

  const latestEpisode = episode;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans relative">
      <Link 
        href="/login" 
        className="absolute top-4 right-4 text-sm text-stone-500 hover:text-stone-800 transition-colors z-20"
      >
        Login
      </Link>
      
      {/* --- HERO SECTION --- */}
      <header className="relative max-w-4xl mx-auto px-6 pt-12 pb-8">
        {/* The Stoop Art Placeholder */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl mb-10 bg-stone-200">
           {/* Placeholder image - Replace with your real image later */}
           <img 
            src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop" 
            alt="Kids sitting on a New York City stoop"
            className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent"></div>
           
           <div className="absolute bottom-6 left-6 text-white">
             <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
               <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
               Latest Broadcast
             </div>
             <h2 className="text-3xl md:text-4xl font-serif font-bold text-shadow">
               {latestEpisode.title}
             </h2>
           </div>
        </div>

        {/* Podcast Meta & Host */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-stone-200 pb-8">
          <div className="flex-1">
            <h1 className="text-5xl font-serif font-black text-stone-900 mb-2 tracking-tight">
              Stoop Politics
            </h1>
            <div className="flex items-center gap-3 text-lg font-medium text-stone-500">
               {/* CORRECTED SPELLING HERE */}
               <span>with <span className="text-stone-900 font-bold">Jessie Mercury</span></span>
               <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
               <span className="uppercase text-sm tracking-widest">New York City</span>
            </div>
            <p className="mt-6 text-xl text-stone-600 leading-relaxed max-w-2xl">
              {latestEpisode.summary}
            </p>
          </div>
        </div>
      </header>

        {/* AUDIO PLAYER */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="sticky top-4 z-10 bg-stone-50/95 backdrop-blur shadow-lg border border-stone-200 rounded-xl p-4 mb-10">
            <audio controls className="w-full h-10 accent-stone-800">
              <source src={latestEpisode.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>

      {/* TRANSCRIPT SECTION */}
      <article className="max-w-4xl mx-auto px-6 pb-24">
        <div className="prose prose-stone prose-lg leading-loose text-stone-800">
          {transcript?.map((node) => (
            <span key={node.id} className="mr-1">
              {node.reference_link ? (
                /* LOGIC: If a link exists, render an anchor tag.
                   Styles: Blue text, underlined decoration, hover effect.
                */
                <a 
                  href={node.reference_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-700 font-semibold underline decoration-2 decoration-blue-200 hover:decoration-blue-700 transition-all cursor-pointer"
                  title={node.reference_title || "Reference Link"}
                >
                  {node.content}
                </a>
              ) : (
                /* LOGIC: If no link, just render the text */
                <span>{node.content}</span>
              )}
            </span>
          ))}
        </div>
      </article>

    </main>
  );
}
