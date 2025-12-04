// import { useState, useEffect } from "react";
// import Card from "../../components/Card";
// import Modal from "../../components/Modal";
// import Button from "../../components/Button";

// type Package = {
//   id: number | string;
//   points: number;
//   price: number;
//   label?: string;
// };

// type Props = {
//   open: boolean;
//   onClose: () => void;
//   onSuccess?: () => void;
// };

// const FALLBACK_PACKAGES: Package[] = [
//   { id: "p1", points: 100, price: 5000 },
//   { id: "p2", points: 500, price: 10000 },
//   { id: "p3", points: 2500, price: 25000 },
// ];

// export default function BuyPoints({ open, onClose, onSuccess }: Props) {
//   const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
//   const [selected, setSelected] = useState<string | number | null>(null);
//   const [processing, setProcessing] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
// }
