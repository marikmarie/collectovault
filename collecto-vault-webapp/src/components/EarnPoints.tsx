import { X, ArrowRight, DollarSign, Tag, Clock } from "lucide-react";
import { Link } from "react-router-dom"; // Assuming react-router-dom for navigation

interface ServiceDetails {
    id: string;
    title: string;
    desc: string;
    pointsPerUGX: number;
    category: string;
}

interface EarnPointsProps {
  open: boolean;
  onClose: () => void;
  service: ServiceDetails;
}

export default function EarnPoints({ open, onClose, service }: EarnPointsProps) {
  if (!open) return null;

  // Placeholder logic for the "Earn" button link
  const earnLink = `/services/earn/${service.id}`;

  return (
    <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Earn Points: {service.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Main Description */}
          <p className="text-md text-gray-700 font-medium">{service.desc}</p>
          
          <h3 className="text-lg font-semibold text-gray-800 pt-2 border-t border-gray-100">
            How Points are Calculated
          </h3>
          
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Rate</p>
                <p className="font-semibold text-gray-800">1 pt / UGX {service.pointsPerUGX.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
              <Tag className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-semibold text-gray-800">{service.category}</p>
              </div>
            </div>
          </div>
          
          {/* Terms & Conditions Placeholder */}
          <div className="pt-4 text-sm text-gray-500">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Terms & Conditions
            </h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Points credited within 7 working days post-service completion.</li>
                <li>UGX values are subject to exchange rate fluctuations at the time of purchase.</li>
            </ul>
          </div>
        </div>

        {/* Footer with Action Buttons: Cancel and Earn */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <button 
            onClick={onClose} 
            className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          <Link 
            to={earnLink} // Navigate to the specific service page to initiate earning
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full bg-[#ffa727] text-white hover:bg-[#f2d931] transition-colors shadow-md shadow-[#ffa727]/30"
          >
            Go To Service to Earn <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </div>
    </div>
  );
}