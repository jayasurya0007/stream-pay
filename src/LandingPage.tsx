import { Filter, Grid, List, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import Silk from '../uicomps/Silk';
import CardSwap, { Card } from './CardSwap';
import StreamCard from './StreamCard';



interface LandingPageProps {
  onNavigateToStream: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToStream }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Gaming', 'Tech', 'Music', 'Art', 'Education', 'Lifestyle'];

  const featuredStreams = [
    {
      id: '1',
      title: 'Building the Future of Web3 - Live Coding Session',
      creator: 'StreamerPro',
      category: 'Tech',
      viewers: 1247,
      duration: '2:15:30',
      thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 156.43
    },
    {
      id: '2',
      title: 'Epic Gaming Marathon - New AAA Title First Look',
      creator: 'GameMaster',
      category: 'Gaming',
      viewers: 2891,
      duration: '4:22:15',
      thumbnail: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 289.12
    },
    {
      id: '3',
      title: 'Digital Art Creation - NFT Collection Behind the Scenes',
      creator: 'ArtistVibe',
      category: 'Art',
      viewers: 856,
      duration: '1:45:20',
      thumbnail: 'https://images.pexels.com/photos/1194420/pexels-photo-1194420.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 92.67
    },
    {
      id: '4',
      title: 'Music Production Masterclass - Beat Making Live',
      creator: 'BeatCreator',
      category: 'Music',
      viewers: 1523,
      duration: '3:08:45',
      thumbnail: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 203.89
    },
    {
      id: '5',
      title: 'Crypto Trading Strategies - Market Analysis',
      creator: 'CryptoGuru',
      category: 'Education',
      viewers: 3247,
      duration: '1:30:12',
      thumbnail: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 445.23
    },
    {
      id: '6',
      title: 'Cooking with Crypto - Blockchain Chef',
      creator: 'ChefChain',
      category: 'Lifestyle',
      viewers: 967,
      duration: '2:45:30',
      thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      isLive: true,
      earnings: 78.45
    }
  ];

  const filteredStreams = selectedCategory === 'All' 
    ? featuredStreams 
    : featuredStreams.filter(stream => stream.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Silk Background */}
        <div className="absolute inset-0 z-0">
          <Silk
            speed={5}
            scale={1}
            color="#fbbf24"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Small Button */}
          <div className="mb-8">
          </div>

          {/* Main Content Container */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Streaming made easy using 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 animate-pulse">
                YellowSDK
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join the next generation of streaming where creators earn instantly through micro-payments, 
              gifts, and real-time viewer engagement.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="bg-white text-black px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Get Started
              </button>
              <button 
                onClick={onNavigateToStream}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        
      </div>


      {/* Card Stack Section */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left copy */}
            <div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <h2 className="text-white">
                  The first Web3-powered live streaming platform with gasless gifts and real-time creator earnings powered by
                </h2>
                <span className="block text-yellow-400">Yellow</span>
              </div>
            </div>

            {/* Right demo */}
            <div className="relative h-[350px]">
              <CardSwap cardDistance={60} verticalDistance={70} delay={4000} pauseOnHover={false}>
              <Card>
                  <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
                    <div className="h-10 border-b border-black/30 flex items-center px-4 gap-2 text-black/80 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-black/70"></span>
                      Stream
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6 mb-10 gap-6">
                      <img
                        src="/assets/stream.png"
                        alt="Stream"
                        className="w-40 h-40 object-contain rounded-lg bg-yellow-100"
                      />
                      <div className="text-black/80">
                        <h3 className="text-xl font-semibold mb-2">Go live and share your world without limits</h3>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
                    <div className="h-10 border-b border-black/30 flex items-center px-4 gap-2 text-black/80 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-black/70"></span>
                      Earn
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6 mb-10 gap-6">
                      <img
                        src="/assets/earn.png"
                        alt="Earnings"
                        className="w-40 h-40 object-contain rounded-lg bg-yellow-100"
                      />
                      <div className="text-black/80">
                        <h3 className="text-xl font-semibold mb-2">Keep 100% of your income with instant, gasless payouts</h3>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
                    <div className="h-10 border-b border-black/30 flex items-center px-4 gap-2 text-black/80 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-black/70"></span>
                      Connect
                    </div>
                    <div className="flex flex-1 items-center justify-center p-6 mb-10 gap-6">
                      <img
                        src="/assets/connect.png"
                        alt="Connect"
                        className="w-40 h-40 object-contain rounded-lg bg-yellow-100"
                      />
                      <div className="text-black/80">
                        <h3 className="text-xl font-semibold mb-2">Engage your audience through gifts, tips, and real-time support</h3>
                      </div>
                    </div>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>


      {/* Live Streams Section */}
      <div className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">Live Now</h2>
              <p className="text-yellow-300">Discover amazing creators streaming right now</p>
            </div>
            
            {/* View controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-yellow-300 hover:text-yellow-400'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-yellow-300 hover:text-yellow-400'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
            <div className="flex items-center space-x-2 text-yellow-300 flex-shrink-0">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-yellow-300 hover:bg-gray-700 hover:text-yellow-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Trending Tags */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center space-x-2 text-yellow-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Trending:</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto">
              {['Web3', 'Gaming', 'AI', 'NFTs', 'DeFi'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-300 rounded-full text-sm font-medium flex-shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Streams Grid */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                {...stream}
                onClick={onNavigateToStream}
              />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="bg-gray-800 hover:bg-gray-700 text-yellow-400 px-8 py-3 rounded-lg font-medium border border-yellow-600 hover:border-yellow-500 transition-all duration-200">
              Load More Streams
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;