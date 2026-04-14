import React, { useEffect, useState } from "react";
import { getBusinessWhatsAppUrl, getUserWhatsAppUrl } from "../api/feedback";

interface WhatsAppButtonProps {
  customerId?: number;
  type?: 'business' | 'user'; // business = whatsapp us, user = your personal number
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function WhatsAppButton({
  customerId,
  type = 'business',
  label = 'WhatsApp Us',
  className = '',
  children,
}: WhatsAppButtonProps) {
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWhatsappUrl = async () => {
      try {
        if (type === 'business') {
          const url = await getBusinessWhatsAppUrl();
          setWhatsappUrl(url);
        } else if (type === 'user' && customerId) {
          const url = await getUserWhatsAppUrl(customerId);
          setWhatsappUrl(url);
        }
      } catch (error) {
        console.error("Failed to fetch WhatsApp URL:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWhatsappUrl();
  }, [type, customerId]);

  if (loading) {
    return <span className={className}>Loading...</span>;
  }

  if (!whatsappUrl) {
    return <span className={className}>WhatsApp not available</span>;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.95 1.215l-.355.192-.368-.06c-1.286-.24-2.428-.856-3.365-1.785-1.025-1.008-1.6-2.187-1.6-3.579 0-5.528 4.582-10.007 10.229-10.007 2.804 0 5.43 1.093 7.437 3.08C20.55 5.16 21.74 7.717 21.74 10.368c0 1.462-.356 2.89-1.04 4.204l-.188.371.37.015c1.506.06 2.964.591 4.125 1.414 1.079.744 2.016 1.844 2.582 3.07.434.94.656 1.97.656 3.016 0 5.528-4.582 10.007-10.229 10.007-1.624 0-3.212-.408-4.633-1.187l-.355-.192-.368.06c-1.286.24-2.428.856-3.365 1.785-1.025 1.008-1.6 2.187-1.6 3.579 0 1.462.356 2.89 1.04 4.204l.188.371-.37-.015c-1.506-.06-2.964-.591-4.125-1.414-1.079-.744-2.016-1.844-2.582-3.07-.434-.94-.656-1.97-.656-3.016 0-5.528 4.582-10.007 10.229-10.007" />
      </svg>
      {children || label}
    </a>
  );
}
