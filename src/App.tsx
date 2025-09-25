import { useState } from 'react';
import ChatSidebar from './components/ChatSidebar';
import GiftAnimations from './components/GiftAnimations';
import GiftStore from './components/GiftStore';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import { NitrolitePortal } from './components/NitrolitePortal';
import StreamPlayer from './components/StreamPlayer';
import WalletOverlay from './components/WalletOverlay';

type View = 'home' | 'stream' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isGiftStoreOpen, setIsGiftStoreOpen] = useState(false);
  const [balance, setBalance] = useState(12.50);
  const [viewerCount] = useState(1247);
  const [giftAnimations, setGiftAnimations] = useState<string[]>([]);

  const handleSendGift = (gift: any) => {
    setBalance(prev => prev - gift.price);
    setGiftAnimations(prev => [...prev, gift.id]);
    
    // Clear animations after they complete
    setTimeout(() => {
      setGiftAnimations(prev => prev.filter(g => g !== gift.id));
    }, 3000);
  };

  const handleTopUp = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const handleGiftAnimation = (gift: string) => {
    setGiftAnimations(prev => [...prev, gift]);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-black">
        <Header 
          onNavigate={handleNavigate} 
          currentView={currentView} 
          balance={balance} 
        />
        <LandingPage onNavigateToStream={() => setCurrentView('stream')} />
        <WalletOverlay balance={balance} onTopUp={handleTopUp} />
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Header 
            onNavigate={handleNavigate} 
            currentView={currentView} 
            balance={balance} 
          />
        </div>
        <NitrolitePortal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header 
        onNavigate={handleNavigate} 
        currentView={currentView} 
        balance={balance} 
      />
      <div className="flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video section */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">
                StreamerPro's <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400">Live Stream</span>
              </h1>
              <p className="text-yellow-300 text-lg">
                Building amazing Web3 apps live!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentView('home')}
                className="px-6 py-3 rounded-xl font-bold transition-all duration-300 bg-black/60 text-yellow-300 hover:bg-yellow-600/20 hover:text-yellow-200 border border-yellow-600/30 hover:border-yellow-400/50"
              >
                Browse
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 rounded-xl font-bold transition-all duration-300 bg-black/60 text-yellow-300 hover:bg-yellow-600/20 hover:text-yellow-200 border border-yellow-600/30 hover:border-yellow-400/50"
              >
                Dashboard
              </button>
            </div>
          </div>
          
          <StreamPlayer
            isLive={true}
            viewerCount={viewerCount}
            onGiftAnimation={handleGiftAnimation}
          />
        </div>

        {/* Chat section - Desktop */}
        <div className="hidden lg:block w-80">
          <div className="h-full">
            <ChatSidebar onOpenGiftStore={() => setIsGiftStoreOpen(true)} />
          </div>
        </div>
      </div>

      {/* Mobile chat overlay */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-30">
        <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-6 border border-yellow-600/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-yellow-400 font-bold text-lg">Live Chat</span>
            <button
              onClick={() => setIsGiftStoreOpen(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Send Gift
            </button>
          </div>
          <div className="text-yellow-300 text-base font-medium">
            StreamerPro: Welcome to my stream! 🎉
          </div>
        </div>
      </div>

      {/* Overlays */}
      <WalletOverlay balance={balance} onTopUp={handleTopUp} />
      
      <GiftStore
        isOpen={isGiftStoreOpen}
        onClose={() => setIsGiftStoreOpen(false)}
        onSendGift={handleSendGift}
        balance={balance}
      />

      <GiftAnimations gifts={giftAnimations} />
      </div>
    </div>
  );
}

export default App;