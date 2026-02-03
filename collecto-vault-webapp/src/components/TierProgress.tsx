type Props = { currentTier: string; progress: number; tiers?: string[] };

export default function TierProgress({
  currentTier,
  progress,
  tiers = ["Bronze", "Silver", "Gold", "Platinum"],
}: Props) {
  // progress is 0-100 from the API
  const pct = Math.max(0, Math.min(100, progress));
  
  const currentTierIndex = tiers.findIndex(t => t.toLowerCase() === currentTier.toLowerCase());
  const segmentCount = tiers.length - 1; 

  
  const baseOffset = (currentTierIndex / segmentCount) * 100;
  
  // activeSegmentWidth: The distance between two dots
  const activeSegmentWidth = 100 / segmentCount;
  
  // totalProgressWidth: The red line only fills UP TO the current tier 
  // + the percentage of the next segment.
  const totalProgressWidth = baseOffset + ((pct / 100) * activeSegmentWidth);

  // Determine if the user has reached the final tier
  const isMaxTier = currentTierIndex === tiers.length - 1;

  return (
    <div className="px-4 w-full">
      <div className="card-like p-5 bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        
        {/* Tier Status Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Current Status</div>
            <div className="text-xl font-black text-gray-900">{currentTier}</div>
          </div>
          <div className="text-right">
             <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Date</div>
             <div className="text-xs font-medium text-gray-800">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</div>
          </div>
        </div>

        {/* --- Tier Progress Bar Section --- */}
        <div className="mt-8 relative px-1">
          
          {/* 1. Base Gray Line */}
          <div className="relative w-full h-1 bg-gray-100 rounded-full">
            
            {/* 2. Red Progress Line */}
            <div
              className="absolute top-0 left-0 h-1 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${isMaxTier ? 100 : totalProgressWidth}%`, 
                backgroundColor: "#D81B60", 
              }}
            />

            {/* 3. Tier Dots/Milestones */}
            {tiers.map((t, i) => {
              const leftPosition = (i / segmentCount) * 100;
              
              // Only highlight dots the user has actually EARNED (reached)
              // The dot for the "next" tier remains gray until progress is 100%
              const isEarned = i <= currentTierIndex;

              return (
                <div 
                  key={t} 
                  className="absolute -top-1 -translate-x-1/2"
                  style={{ left: `${leftPosition}%` }}
                >
                  <div 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                      isEarned 
                        ? 'bg-[#D81B60] border-[#D81B60]' 
                        : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 4. Tier Labels */}
          <div className="flex justify-between w-full mt-4">
            {tiers.map((t, ) => {
              const isActive = t.toLowerCase() === currentTier.toLowerCase();

              return (
                <div 
                  key={t} 
                  className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-300 w-0 flex justify-center overflow-visible`}
                  style={{
                    color: isActive ? '#D81B60' : '#9ca3af',
                  }}
                >
                  <span className="whitespace-nowrap">{t}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Text Footer */}
        {!isMaxTier && (
          <div className="mt-6 flex items-center gap-2">
            <div className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
              {Math.round(pct)}% Complete
            </div>
            <div className="text-[11px] text-gray-400">
               to {tiers[currentTierIndex + 1]} Tier
            </div>
          </div>
        )}
      </div>
    </div>
  );
}