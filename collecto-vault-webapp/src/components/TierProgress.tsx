// src/components/TierProgress.tsx

type Props = { currentTier: string; progress: number; tiers?: string[] };

export default function TierProgress({
  currentTier,
  progress,
  tiers = ["Blue", "Silver", "Gold", "Platinum"],
}: Props) {
  // Clamp progress between 0 and 1
  const pct = Math.max(0, Math.min(1, progress));
  
  const currentTierIndex = tiers.findIndex(t => t === currentTier);
  
  // Calculate the total segment count.
  const segmentCount = tiers.length - 1; 

  // --- PROGRESS BAR LOGIC ---
  const baseOffset = (100 / segmentCount) * currentTierIndex;
  const activeSegmentWidth = 100 / segmentCount;
  
  // Calculate the total width, clamped to 100% to ensure it never exceeds the container
  const totalProgressWidth = Math.min(100, baseOffset + (pct * activeSegmentWidth));

  return (
    <div className="px-4 w-full">
      <div className="card-like p-4 pt-3 bg-white rounded-lg shadow-sm overflow-hidden">
        
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
        <div className="mt-6 relative px-1"> {/* Added horizontal padding to prevent dot cutoff */}
          
          {/* 1. Base Gray Line */}
          <div className="relative w-full h-0.5 bg-gray-200">
            
            {/* 2. Red Progress Line */}
            <div
              className="absolute top-0 left-0 h-0.5 transition-all duration-700 ease-out"
              style={{
                width: `${totalProgressWidth}%`, 
                backgroundColor: "#D81B60", 
              }}
            />

            {/* 3. Tier Dots/Milestones */}
            {tiers.map((t, i) => {
              // The dot position is calculated as a percentage of the bar length
              const leftPosition = (i / segmentCount) * 100;
              const isPassedOrCurrent = i <= currentTierIndex;

              return (
                <div 
                  key={t} 
                  className="absolute -top-[5px] -translate-x-1/2"
                  style={{ left: `${leftPosition}%` }}
                >
                  <div 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      isPassedOrCurrent ? 'bg-red-600 border-red-600' : 'bg-white border-gray-400'
                    }`}
                    style={isPassedOrCurrent ? { backgroundColor: "#D81B60", borderColor: "#D81B60" } : {}}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 4. Tier Labels */}
          <div className="flex justify-between w-full mt-3">
            {tiers.map((t, i) => {
              // Alignment logic: First label left, Last label right, others center
              let textAlignClass = "text-center";
              if (i === 0) textAlignClass = "text-left";
              if (i === tiers.length - 1) textAlignClass = "text-right";

              return (
                <div 
                  key={t} 
                  className={`text-xs transition-colors duration-300 ${textAlignClass}`}
                  style={{
                    width: `${100 / tiers.length}%`, 
                    color: t === currentTier ? 'black' : '#6b7280',
                    fontWeight: t === currentTier ? '600' : '400'
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Text Footer */}
        <div className="mt-4 text-xs text-gray-500">
          {Math.round(pct * 100)}% to next tier
        </div>
      </div>
    </div>
  );
}