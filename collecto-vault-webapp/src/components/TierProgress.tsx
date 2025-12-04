// src/components/TierProgress.tsx

type Props = { currentTier: string; progress: number; tiers?: string[] };

export default function TierProgress({
  currentTier,
  progress,
  tiers = ["Blue", "Silver", "Gold", "Platinum"],
}: Props) {
  // Clamp progress between 0 and 1
  const pct = Math.max(0, Math.min(1, progress));
  
  // Calculate the index of the current tier
  const currentTierIndex = tiers.findIndex(t => t === currentTier);
  
  // Calculate the total segment count. If we are on Blue, the first milestone is Silver.
  // The progress bar spans the distance between tiers.
  const segmentCount = tiers.length - 1; 

  // --- PROGRESS BAR LOGIC ---
  
  // Progress bar width is 100% of the visible segment
  const progressWidth = pct * 100;

  const baseOffset = (100 / segmentCount) * currentTierIndex;

  const activeSegmentWidth = 100 / segmentCount;
  
  // Final total progress width for the red line:
  const totalProgressWidth = baseOffset + (progressWidth * activeSegmentWidth / 100);

  return (
    <div className="px-4">
      <div className="card-like p-4 pt-3 bg-white rounded-lg shadow-sm">
        
        {/* Tier Status Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-lg font-bold text-gray-800">{currentTier}</div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-0.5">
            As of 01 Dec 2025 you have 0 Tier Miles
          </div>
        </div>

        {/* --- Tier Progress Bar Section --- */}
        <div className="mt-4 relative pt-2">
          
          {/* 1. Base Gray Line (The full length of the progress path) */}
          <div className="relative w-full h-0.5 bg-gray-200">
            
            {/* 2. Red Progress Line (Animated) */}
            <div
              className="absolute top-0 h-0.5 bg-red-600 transition-all duration-700 ease-out"
              style={{
                width: `${totalProgressWidth}%`, 
                // We use a solid red color to match the screenshot
                background: "#D81B60", 
              }}
            />

            {/* 3. Tier Dots/Milestones */}
            {tiers.map((t, i) => {
              if (i === tiers.length - 1) return null; 
              
              const isPassed = i < currentTierIndex;
              // const isCurrent = t === currentTier;
              // const isNext = i === currentTierIndex;

              const leftPosition = (i + 1) * (100 / segmentCount); 

              return (
                <div 
                  key={t} 
                  className="absolute -top-[5px] -translate-x-1/2"
                  style={{ left: `${leftPosition}%` }}
                >
                  <div 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      isPassed ? 'bg-red-600 border-red-600' : 'bg-white border-gray-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 4. Tier Labels */}
          <div className="flex justify-between text-xs mt-3">
            {tiers.map((t, i) => (
              <div 
                key={t} 
                className={`text-center transition-colors duration-300 ${
                  i === 0 ? 'text-left' : (i === tiers.length - 1 ? 'text-right' : 'text-center')
                }`}
                style={{
                    // Position the label directly under its dot, or start/end of the bar
                    width: `${100 / tiers.length}%`, 
                    marginLeft: i === 0 ? '-3px' : '0', // Adjust start label slightly left
                    marginRight: i === tiers.length - 1 ? '-3px' : '0', // Adjust end label slightly right
                    color: t === currentTier ? 'black' : '#6b7280' // Darker text for current tier
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Text Footer (Removed 'See your benefits' button which was in another component) */}
        <div className="mt-4 text-xs text-gray-500">
          {Math.round(pct * 100)}% to next tier
        </div>
      </div>
    </div>
  );
}