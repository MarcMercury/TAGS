import { supabase } from "@/lib/supabase";
import { MoveRight } from "lucide-react"; // Icon for style

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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-800 font-serif">
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

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      
      {/* HEADER SECTION */}
      <header className="max-w-3xl mx-auto pt-12 px-6">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-stone-900">
          Stoop Politics
        </h1>
        <p className="text-stone-500 text-lg mb-8 uppercase tracking-widest font-semibold text-xs">
          New York City • Weekly Broadcast
        </p>
        
        {/* EPISODE TITLE & SUMMARY */}
        <div className="border-b-2 border-stone-200 pb-8 mb-8">
          <h2 className="text-3xl font-serif font-bold mb-4">{episode.title}</h2>
          <p className="text-lg text-stone-600 leading-relaxed">{episode.summary}</p>
        </div>

        {/* AUDIO PLAYER */}
        <div className="sticky top-4 z-10 bg-stone-50/95 backdrop-blur shadow-lg border border-stone-200 rounded-xl p-4 mb-10">
          <audio controls className="w-full h-10 accent-stone-800">
            <source src={episode.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </header>

      {/* TRANSCRIPT SECTION */}
      <article className="max-w-3xl mx-auto px-6 pb-24">
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
