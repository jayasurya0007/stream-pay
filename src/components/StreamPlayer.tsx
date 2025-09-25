import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface StreamPlayerProps {
  isLive: boolean;
  viewerCount: number;
  onGiftAnimation: (gift: string) => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ isLive, viewerCount, onGiftAnimation }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl overflow-hidden group shadow-2xl border border-yellow-600/20">
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-6 left-6 z-20">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
      )}

      {/* Viewer count */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
          <span className="text-yellow-400">{viewerCount.toLocaleString()}</span> viewers
        </div>
      </div>

      {/* Video placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-red-900/30 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10"></div>
        <div className="text-center text-white/80 relative z-10">
          <div className="w-24 h-24 border-4 border-yellow-500/40 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm">
            <Play className="w-10 h-10 text-yellow-400" />
          </div>
          <p className="text-xl font-semibold text-yellow-300 mb-2">Stream Loading...</p>
          <p className="text-sm text-yellow-400/80">Preparing your viewing experience</p>
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-300 shadow-2xl border border-white/20 hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-yellow-400/50"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-yellow-400/50"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-yellow-400/50">
                <Settings className="w-6 h-6" />
              </button>
              <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-yellow-400/50">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;