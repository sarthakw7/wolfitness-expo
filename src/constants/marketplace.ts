export type MarketplaceProgram = {
  category: string;
  coach: string;
  description: string;
  duration: string;
  hero?: boolean;
  id: string;
  image: string;
  level: string;
  price: string;
  title: string;
};

export type MarketplaceCoach = {
  discipline: string;
  id: string;
  image: string;
  name: string;
  signal: string;
};

export const marketplacePrograms: MarketplaceProgram[] = [
  {
    category: "Featured Masterclass",
    coach: "Coach Aris",
    description:
      "Realign your kinetic chain and unlock fluid, pain-free movement through advanced structural balance.",
    duration: "8 Weeks",
    hero: true,
    id: "symmetry-protocol",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEqtMJO-N-jWwEhrqsvhlN_Hf9v1Qgnf--9hv4g_jqiuLhlBVQyXA81TQw7B2gal-vDL-fpYlXOGJpbaWOibgi4PefFkxTC0ALDGgmbdkdvq5WRSVeIkEuhpEOpem_whiMXkJKhprIXqhwOE50USWf82aPhOLujnUUL4UeeFBw8DqfI1HVZ7_I6p08kKSqeFMQ2zJ_btsaefpjbVUPsa0ep2qwTzpfJm0ji4ZOhB3hJGHG1wgvhsGO26Ums5g8L0-Uc8BrK6GQPuzj",
    level: "Advanced",
    price: "$249",
    title: "The Symmetry Protocol",
  },
  {
    category: "Bestseller",
    coach: "Mara Voss",
    description:
      "Build foundational strength through minimalist, heavy compound movements with precise weekly progression.",
    duration: "12 Weeks",
    id: "iron-genesis",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3PtZvjAJmerqid8hhirlNCwsalADkMhsedcO3d7J76gEY5OJOgwQ0evy3Uuvfuoa7om9BOjo7sVCohh5XvN3H4n7z1gQAJuXB3cT3T9qgTa1TYruC-4ah6lspTXVFC3NWFfTFcnSRr0Y5eripcWr0NLBOMhPHLJJUCiOhWW6-PBNYegCRdJ-Zg3L-qUGGkdSmAeN2VX8z-VDa4Vsfb2pvmXRhnwJPnvHdVFqov2LNXMfVdLq43LZ_GeVprvm6F2it7VRQlfOQd-9i",
    level: "Intermediate",
    price: "$129",
    title: "Iron Genesis",
  },
  {
    category: "Mobility",
    coach: "Noa Vale",
    description:
      "Advanced respiratory protocols to enhance recovery, downshift stress, and refine autonomic control.",
    duration: "4 Weeks",
    id: "zenith-breathwork",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrrDWXltZXNFlUguL7ngcpSTB0Zh9ZxhxQJlMFZ35MXG8q1vnLqI-kFCf4P-F87DItJWFLBoIOqZMBXBPyMvP4j7sgSNdsq0KotELw4PNp0UXrB9I4MVpDyA17qqjhwPpsWiCKIPfbFUKIjSOgnwSXTMH19AhQYpHPEoJv7CiR1rJhzYkmCIJYZxXQWo7JlvM51LM6Vb9A7PYIC43h_uFu40RtZorl_twTj1Xxsk6YugbT3IvUnjY5D4wzIAcbdpbPu-u7ESL3B3QJ",
    level: "All Levels",
    price: "$89",
    title: "Zenith Breathwork",
  },
  {
    category: "Elite Tactics",
    coach: "Dane Cross",
    description:
      "A hybrid conditioning block mixing loaded carries with sub-maximal aerobic base work.",
    duration: "16 Weeks",
    id: "tactical-endurance",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEqtMJO-N-jWwEhrqsvhlN_Hf9v1Qgnf--9hv4g_jqiuLhlBVQyXA81TQw7B2gal-vDL-fpYlXOGJpbaWOibgi4PefFkxTC0ALDGgmbdkdvq5WRSVeIkEuhpEOpem_whiMXkJKhprIXqhwOE50USWf82aPhOLujnUUL4UeeFBw8DqfI1HVZ7_I6p08kKSqeFMQ2zJ_btsaefpjbVUPsa0ep2qwTzpfJm0ji4ZOhB3hJGHG1wgvhsGO26Ums5g8L0-Uc8BrK6GQPuzj",
    level: "Elite",
    price: "$199",
    title: "Tactical Endurance",
  },
];

export const marketplaceCoaches: MarketplaceCoach[] = [
  {
    discipline: "Structural Balance",
    id: "coach-aris",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyvQcUGQMtnvtKqRHzjApJ_lv9ZFFj22e9SsdHUdPNvF_0GkMYM7fZO2GQTRy5Z4_vJHl6T3L78A81_Z5R0y-0woR1CCWkVhdJ8vQRuLpPEY9aXpSgos1Bao-c8i1JxAhTI1t_rtGT_ssE2khh3Gyjo0_ntwZLoPKdcsFBxqczFYEYV0lQGT5o2a9Vald_eWkHJf67VgdyLLLUTVqzwdbYLHwLlEnrkvKCJjPb-CrAmIGxs_VMhy_9ZD9WgvIVoF6Djq9gAmrPwsxL",
    name: "Aris Kade",
    signal: "Movement systems for elite longevity",
  },
  {
    discipline: "Strength Architecture",
    id: "mara-voss",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBwtXuZsWFsUFGu7yjyF59dXNbN0KDfjTplwUHgCa5nxI-zoZ1ZC18lFYzPxIZHusJcQF_328dRtUK5CCZZLEMSvisZCfnARd4adW17rzYDFiBMowaiy1aWUjlaxy_qhih5Y7fbwx7tvvtQ2_NJpscO0zJhNxLRqW4GPf1wqXtwiFNRnhfnafQBWN_pitVh8ceXRcqNDyyydrt7BWAiaS6TdEkOl_u1iJg3K8uoPHZ2Y8oNnLaPStRSbgq0K27AjFY1L2HpIo331dx9",
    name: "Mara Voss",
    signal: "Compound strength blocks with quiet precision",
  },
  {
    discipline: "Recovery Physiology",
    id: "noa-vale",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA_k84rkblohukljDRMldfnC67YUMfFr-KUTCRd12xPAP0p1WF4BYg269r5a9mkLqTH3nghwaSKuZsXU9Ovhh1PjdOt6SY0g1qbPfjAhCEI7wQKtxXZRNXKSjccuKkGfnCUCsQXuLvvBv6wpzPmbBebYJ-Hl0t5LhJ1HmRDWhwwlHu1TdhIvjMrKA3OZAV8gmrXXmfGNhJxUSFPDLhLOjadsiyRvBoX7tauoYEfEp6RosoiFVa8AbLmIvVIIAaW4fPrn-2kURSJk1e0",
    name: "Noa Vale",
    signal: "Breath, mobility, and parasympathetic readiness",
  },
];

export const marketplaceCategories = [
  "All Programs",
  "Strength",
  "Mobility",
  "Endurance",
  "Nutrition",
  "Elite Tactics",
] as const;
