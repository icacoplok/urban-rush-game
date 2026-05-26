'use client';

import dynamic from 'next/dynamic';

const UrbanRushGame = dynamic(() => import('@/components/game/UrbanRushGame'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-4xl font-black tracking-wider mb-4">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            URBAN
          </span>{' '}
          <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
            RUSH
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-white/40">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-white/20 text-sm mt-4">Loading game engine...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <UrbanRushGame />;
}
