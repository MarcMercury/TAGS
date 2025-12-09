'use client';

import Link from 'next/link';
import { Mic, List } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Episode Card */}
        <Link 
          href="/admin/episodes/new"
          className="bg-white rounded-xl border border-stone-200 p-8 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center group-hover:bg-stone-700 transition-colors">
              <Mic className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Record New Episode</h2>
          </div>
          <p className="text-stone-500">
            Start recording a new episode with cover art and automatic transcription.
          </p>
        </Link>

        {/* View Episodes Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-8 opacity-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-stone-400 rounded-full flex items-center justify-center">
              <List className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">All Episodes</h2>
          </div>
          <p className="text-stone-500">
            View and manage all your published episodes. (Coming soon)
          </p>
        </div>
      </div>
    </div>
  );
}
