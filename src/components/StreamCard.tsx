import { Eye, Play, Users } from 'lucide-react';
import React from 'react';

interface StreamCardProps {
  id: string;
  title: string;
  creator: string;
  category: string;
  viewers: number;
  duration: string;
  thumbnail: string;
  isLive: boolean;
  earnings?: number;
  onClick: () => void;
}

const StreamCard: React.FC<StreamCardProps> = ({
  title,
  creator,
  category,
  viewers,
  duration,
  thumbnail,
  isLive,
  earnings,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-gray-900/80 rounded-2xl overflow-hidden border border-gray-800 hover:border-yellow-500/40 transition-all duration-300 hover:translate-y-[-2px] shadow-lg hover:shadow-yellow-500/10"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1.5 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
            {duration}
          </div>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-yellow-400 font-semibold text-lg mb-2 line-clamp-2 group-hover:text-yellow-300 transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-sm font-medium text-black">
            {creator.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-yellow-300 font-medium text-sm">{creator}</p>
            <p className="text-yellow-400 text-xs">{category}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-yellow-300">
              <Eye className="w-4 h-4" />
              <span>{viewers.toLocaleString()}</span>
            </div>
            {earnings && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <span className="text-xs">$</span>
                <span>{earnings.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {isLive && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamCard;