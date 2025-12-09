'use client'; // This must be a Client Component to handle user input

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Attempt to sign in with Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // 2. On success, redirect to the Admin Dashboard (we will build this next)
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-stone-200">
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-6 text-center">
          Stoop Politics Admin
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-stone-600 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-stone-500 outline-none"
              placeholder="admin@stooppolitics.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-stone-600 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-stone-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-2 rounded font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Enter the Stoop'}
          </button>
        </form>
      </div>
    </div>
  );
}
