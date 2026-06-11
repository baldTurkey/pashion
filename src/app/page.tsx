import React from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function Home() {
  // 1. Initialize your cloud server client connection
  const supabase = await createSupabaseServer();
  
  // 2. Fetch the current session details from the live cloud database
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
          Pashion Platform Engine
        </h1>
        <p className="text-slate-400">
          Status: <span className="text-emerald-400 font-semibold">Connected to Cloud Database Successfully</span>
        </p>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 mt-4">
          {session ? (
            <p>Welcome back, active user session detected.</p>
          ) : (
            <p className="text-amber-400">System Ready. No active user profile authenticated yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}