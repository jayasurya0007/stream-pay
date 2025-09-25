import { CreditCard, Plus, Wallet } from 'lucide-react';
import React, { useState } from 'react';

interface WalletOverlayProps {
  balance: number;
  onTopUp: (amount: number) => void;
}

const WalletOverlay: React.FC<WalletOverlayProps> = ({ balance, onTopUp }) => {
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);

  const topUpAmounts = [1, 5, 10, 25, 50, 100];

  const handleTopUp = () => {
    onTopUp(selectedAmount);
    setShowTopUp(false);
  };

  return (
    <>
      {/* Balance display */}
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-black/90 backdrop-blur-sm border border-yellow-600/50 rounded-xl p-3 min-w-32">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-4 h-4 text-yellow-400" />
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="w-6 h-6 bg-yellow-600 hover:bg-yellow-500 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Top-up modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl max-w-md w-full border border-yellow-600/50">
            {/* Header */}
            <div className="p-6 border-b border-yellow-600/50">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Top Up Balance</h2>
              <p className="text-yellow-300">Add funds to send gifts and support creators</p>
            </div>

            {/* Current balance */}
            <div className="p-4 bg-gray-800/30">
              <div className="flex items-center justify-between">
                <span className="text-yellow-300">Current Balance:</span>
                <span className="text-yellow-400 font-semibold">${balance.toFixed(2)}</span>
              </div>
            </div>

            {/* Amount selection */}
            <div className="p-6">
              <h3 className="text-yellow-400 font-semibold mb-4">Select Amount</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {topUpAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedAmount === amount
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                        : 'border-gray-600 hover:border-gray-500 text-yellow-300 hover:text-yellow-200'
                    }`}
                  >
                    <div className="font-semibold">${amount}</div>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-6">
                <label className="block text-yellow-300 text-sm mb-2">Or enter custom amount:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-300">$</span>
                  <input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full bg-gray-800 text-yellow-400 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Payment methods */}
              <div className="mb-6">
                <h4 className="text-yellow-400 font-semibold mb-3">Payment Method</h4>
                <div className="space-y-2">
                  <div className="flex items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <CreditCard className="w-5 h-5 text-yellow-300 mr-3" />
                    <div className="flex-1">
                      <p className="text-yellow-400 font-medium">Credit Card</p>
                      <p className="text-yellow-300 text-sm">Instant processing</p>
                    </div>
                    <div className="w-4 h-4 border-2 border-yellow-500 rounded-full bg-yellow-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-yellow-600/50 flex space-x-3">
              <button
                onClick={() => setShowTopUp(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-yellow-400 rounded-lg py-3 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg py-3 font-medium transition-colors"
              >
                Add ${selectedAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletOverlay;