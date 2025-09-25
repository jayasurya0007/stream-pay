import React, { useState } from 'react';
import { X, Heart, Flower2, Sparkles, Gem, Star, Zap } from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
}

interface GiftStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: Gift) => void;
  balance: number;
}

const gifts: Gift[] = [
  {
    id: 'heart',
    name: 'Heart',
    price: 0.01,
    icon: <Heart className="w-8 h-8 text-red-500" />,
    rarity: 'common',
    description: 'Show some love!'
  },
  {
    id: 'rose',
    name: 'Rose',
    price: 0.10,
    icon: <Flower2 className="w-8 h-8 text-pink-500" />,
    rarity: 'rare',
    description: 'A beautiful rose'
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    price: 0.25,
    icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
    rarity: 'rare',
    description: 'Add some magic!'
  },
  {
    id: 'star',
    name: 'Star',
    price: 0.50,
    icon: <Star className="w-8 h-8 text-blue-500" />,
    rarity: 'epic',
    description: 'You\'re a star!'
  },
  {
    id: 'lightning',
    name: 'Lightning',
    price: 0.75,
    icon: <Zap className="w-8 h-8 text-purple-500" />,
    rarity: 'epic',
    description: 'Electric energy!'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: 1.00,
    icon: <Gem className="w-8 h-8 text-cyan-400" />,
    rarity: 'legendary',
    description: 'The ultimate gift'
  },
];

const rarityColors = {
  common: 'border-gray-500 bg-gray-900/50',
  rare: 'border-blue-500 bg-blue-900/30',
  epic: 'border-purple-500 bg-purple-900/30',
  legendary: 'border-yellow-500 bg-yellow-900/30'
};

const GiftStore: React.FC<GiftStoreProps> = ({ isOpen, onClose, onSendGift, balance }) => {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  if (!isOpen) return null;

  const handleSendGift = (gift: Gift) => {
    if (balance >= gift.price) {
      onSendGift(gift);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-black/95 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-yellow-600/30 shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-yellow-600/30 bg-gradient-to-r from-yellow-600/10 to-orange-600/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">Gift Store</h2>
              <p className="text-yellow-300 text-lg">Send virtual gifts to show your support</p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-yellow-300 hover:text-yellow-400 transition-all duration-300 border border-yellow-600/30 hover:border-yellow-400/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="p-6 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-b border-yellow-600/30">
          <div className="flex items-center justify-between">
            <span className="text-yellow-300 text-lg font-medium">Your Balance:</span>
            <span className="text-yellow-400 font-bold text-xl">${balance.toFixed(2)}</span>
          </div>
        </div>

        {/* Gifts grid */}
        <div className="p-8 overflow-y-auto max-h-96">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  rarityColors[gift.rarity]
                } ${
                  balance >= gift.price 
                    ? 'hover:shadow-lg' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => balance >= gift.price && handleSendGift(gift)}
              >
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                      {gift.icon}
                    </div>
                  </div>
                  <h3 className="text-yellow-400 font-bold text-lg mb-2">{gift.name}</h3>
                  <p className="text-yellow-300 text-sm mb-4 leading-relaxed">{gift.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-bold text-lg">${gift.price}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      gift.rarity === 'common' ? 'bg-gray-700 text-gray-300' :
                      gift.rarity === 'rare' ? 'bg-blue-700 text-blue-200' :
                      gift.rarity === 'epic' ? 'bg-purple-700 text-purple-200' :
                      'bg-yellow-700 text-yellow-200'
                    }`}>
                      {gift.rarity.toUpperCase()}
                    </span>
                  </div>
                </div>

                {balance < gift.price && (
                  <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-red-400 font-bold">Insufficient balance</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-yellow-600/30 bg-gradient-to-r from-yellow-600/5 to-orange-600/5">
          <div className="flex items-center justify-between">
            <p className="text-yellow-300 text-lg font-medium">
              Gifts support creators directly
            </p>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-xl font-bold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Top Up Balance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftStore;