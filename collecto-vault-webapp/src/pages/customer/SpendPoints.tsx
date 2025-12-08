import { X, Plane, Hotel } from "lucide-react";

interface SpendPointsModalProps {
  open: boolean;
  onClose: () => void;
  currentPoints: number;
}

const mockRedeems = [
  { id: 1, name: "Family dinner", points: 1500, icon: Plane, detail: "One-time class upgrade on regional flight." },
  { id: 2, name: "Weekend Stay Discount", points: 3000, icon: Hotel, detail: "50% off a two-night stay at partner resorts." },
  { id: 3, name: "UGX 5,000 Cash Credit", points: 500, icon: X, detail: "Direct credit applied to your next statement." },
];

export default function SpendPoints({ open, onClose, currentPoints }: SpendPointsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Redeem Points</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Your Current Balance: <span className="text-lg font-extrabold text-[#ffa727]">{currentPoints.toLocaleString()}</span> points
            </p>
          </div>

          <h3 className="text-md font-semibold text-gray-700 mb-3">Available Rewards</h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {mockRedeems.map((reward) => (
              <div key={reward.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100">
                <div className="flex items-center gap-3">
                  <reward.icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{reward.name}</p>
                    <p className="text-xs text-gray-500">{reward.detail}</p>
                  </div>
                </div>
                <button 
                  disabled={currentPoints < reward.points}
                  className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                    currentPoints >= reward.points
                      ? "bg-[#cb0d6c] text-white hover:bg-[#ef4155]"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => alert(`Redeeming ${reward.points} points for ${reward.name}`)}
                >
                  {reward.points.toLocaleString()} pts
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}