import React, { useEffect, useState } from 'react';
import { Heart, Flower2, Sparkles, Gem, Star, Zap } from 'lucide-react';

interface FloatingGift {
  id: string;
  type: string;
  x: number;
  y: number;
}

interface GiftAnimationsProps {
  gifts: string[];
}

const giftComponents = {
  heart: <Heart className="w-8 h-8 text-red-500" />,
  rose: <Flower2 className="w-8 h-8 text-pink-500" />,
  sparkles: <Sparkles className="w-8 h-8 text-yellow-500" />,
  star: <Star className="w-8 h-8 text-blue-500" />,
  lightning: <Zap className="w-8 h-8 text-purple-500" />,
  diamond: <Gem className="w-8 h-8 text-cyan-400" />,
};

const GiftAnimations: React.FC<GiftAnimationsProps> = ({ gifts }) => {
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);

  useEffect(() => {
    gifts.forEach(gift => {
      const newGift: FloatingGift = {
        id: `${gift}-${Date.now()}-${Math.random()}`,
        type: gift,
        x: Math.random() * 80 + 10, // 10-90% from left
        y: Math.random() * 20 + 60, // 60-80% from top
      };

      setFloatingGifts(prev => [...prev, newGift]);

      // Remove gift after animation
      setTimeout(() => {
        setFloatingGifts(prev => prev.filter(g => g.id !== newGift.id));
      }, 3000);
    });
  }, [gifts]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {floatingGifts.map(gift => (
        <div
          key={gift.id}
          className="absolute animate-bounce"
          style={{
            left: `${gift.x}%`,
            top: `${gift.y}%`,
            animation: 'floatUp 3s ease-out forwards'
          }}
        >
          {giftComponents[gift.type as keyof typeof giftComponents]}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-100px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default GiftAnimations;