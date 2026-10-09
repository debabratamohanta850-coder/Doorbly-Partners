export interface ProfessionCategory {
  id: string;
  name: string;
  subtitle?: string;
  professions: string[];
}

export const PROFESSION_CATEGORIES: ProfessionCategory[] = [
  {
    id: 'cat_1',
    name: 'Home Repair & Maintenance',
    professions: [
      'Electrician',
      'Plumber',
      'Carpenter',
      'Mason',
      'Painter',
      'Welder',
      'Tile Worker',
      'False Ceiling Worker',
      'POP Worker',
      'Waterproofing Worker',
      'Glass Worker',
      'Aluminium Worker',
      'Fabricator',
      'Furniture Repair',
      'Door/Window Repair',
      'Locksmith',
      'CCTV Installer',
      'Solar Panel Technician',
      'RO/Water Purifier Technician'
    ]
  },
  {
    id: 'cat_2',
    name: 'Home Cleaning & Household Services',
    professions: [
      'House Cleaner',
      'Bathroom Cleaner',
      'Kitchen Cleaner',
      'Sofa Cleaner',
      'Carpet Cleaner',
      'Mattress Cleaner',
      'Water Tank Cleaner',
      'Chimney Cleaner',
      'Pest Control Worker',
      'Home Sanitization',
      'Housekeeping',
      'Deep Cleaning',
      'Packing & Unpacking',
      'Home Organizing'
    ]
  },
  {
    id: 'cat_3',
    name: 'Appliance & Electronics Services',
    professions: [
      'AC Technician',
      'Refrigerator Technician',
      'Washing Machine Technician',
      'TV Technician',
      'Microwave Technician',
      'Geyser Technician',
      'Cooler Technician',
      'Mixer/Grinder Repair',
      'Computer Repair',
      'Laptop Repair',
      'Mobile Repair',
      'Printer Repair',
      'Inverter/Battery Technician'
    ]
  },
  {
    id: 'cat_4',
    name: 'Beauty & Personal Care',
    professions: [
      'Beautician',
      'Hairdresser',
      'Barber',
      'Makeup Artist',
      'Mehndi Artist',
      'Nail Artist',
      'Eyebrow/Threading Specialist',
      'Facial Specialist',
      'Massage Therapist',
      'Hair Stylist',
      'Bridal Makeup Artist',
      'Saree Draping Specialist'
    ]
  },
  {
    id: 'cat_5',
    name: 'Women-Friendly & Home-Based Earning',
    professions: [
      'Home Cook',
      'Tiffin Provider',
      'Baker',
      'Tailor',
      'Embroidery Worker',
      'Knitting Worker',
      'Mehndi Artist',
      'Beauty Service Provider',
      'Saree Draping',
      'Gift Packing',
      'Handmade Product Maker',
      'Candle Maker',
      'Papad/Pickle Maker',
      'Home Tutor',
      'Babysitter',
      'Elderly Companion',
      'Pet Care'
    ]
  },
  {
    id: 'cat_6',
    name: 'Food & Kitchen Services',
    professions: [
      'Home Cook',
      'Tiffin Service Provider',
      'Caterer',
      'Chef',
      'Baker',
      'Cake Maker',
      'Snack Maker',
      'Sweet Maker',
      'Food Delivery Partner',
      'Kitchen Helper',
      'Event Food Worker',
      'Bartender/Server for events where legally permitted'
    ]
  },
  {
    id: 'cat_7',
    name: 'Vehicle Services',
    professions: [
      'Car Washer',
      'Bike Washer',
      'Mobile Car Wash',
      'Car Detailer',
      'Bike Mechanic',
      'Car Mechanic',
      'Tyre Repair',
      'Puncture Repair',
      'Battery Service',
      'Car AC Technician',
      'Denting & Painting',
      'Vehicle Pickup/Drop',
      'Driving Service',
      'Delivery Driver'
    ]
  },
  {
    id: 'cat_8',
    name: 'Delivery, Moving & Local Assistance',
    professions: [
      'Delivery Partner',
      'Grocery Delivery',
      'Food Delivery',
      'Medicine Delivery where legally permitted',
      'Courier Delivery',
      'Document Delivery',
      'Local Pickup/Drop',
      'Packers & Movers Helper',
      'Loading/Unloading Worker',
      'Warehouse Worker',
      'Event Setup Worker'
    ]
  },
  {
    id: 'cat_9',
    name: 'Child, Elderly & Personal Assistance',
    professions: [
      'Babysitter',
      'Nanny',
      'Elderly Care Assistant',
      'Patient Attendant',
      'Companion Service',
      'Home Helper',
      'Cook + Caregiver',
      'Child Activity Helper',
      'Personal Assistant',
      'Household Assistant'
    ]
  },
  {
    id: 'cat_10',
    name: 'Pet Services',
    professions: [
      'Dog Walker',
      'Pet Sitter',
      'Pet Groomer',
      'Pet Bathing',
      'Pet Trainer',
      'Pet Taxi',
      'Pet Food Delivery',
      'Pet Care Assistant'
    ]
  },
  {
    id: 'cat_11',
    name: 'Education & Knowledge',
    professions: [
      'Home Tutor',
      'Online Tutor',
      'Spoken English Trainer',
      'Computer Trainer',
      'Music Teacher',
      'Dance Teacher',
      'Drawing Teacher',
      'Art Teacher',
      'Yoga Instructor',
      'Fitness Trainer',
      'Exam Preparation Tutor',
      'Skill Trainer'
    ]
  },
  {
    id: 'cat_12',
    name: 'Digital & Freelance Work',
    professions: [
      'Data Entry Operator',
      'Typist',
      'Content Writer',
      'Translator',
      'Graphic Designer',
      'Video Editor',
      'Motion Graphics Artist',
      'Photographer',
      'Social Media Manager',
      'Digital Marketing Assistant',
      'Website Developer',
      'App Developer',
      'SEO Specialist',
      'Virtual Assistant',
      'Online Researcher',
      'Customer Support Executive',
      'Telecaller'
    ]
  },
  {
    id: 'cat_13',
    name: 'Creative Services',
    professions: [
      'Photographer',
      'Videographer',
      'Wedding Photographer',
      'Product Photographer',
      'Video Editor',
      'Graphic Designer',
      'Logo Designer',
      'Invitation Designer',
      'Animator',
      'Illustrator',
      'Voice Artist',
      'Singer',
      'Musician',
      'DJ',
      'Event Decorator'
    ]
  },
  {
    id: 'cat_14',
    name: 'Events & Functions',
    professions: [
      'Event Manager',
      'Event Helper',
      'Decoration Worker',
      'Balloon Decorator',
      'Photographer',
      'Videographer',
      'Caterer',
      'Waiter/Server',
      'Makeup Artist',
      'DJ',
      'Sound Technician',
      'Light Technician',
      'Stage Setup Worker',
      'Invitation Designer'
    ]
  },
  {
    id: 'cat_15',
    name: 'Gardening & Outdoor Work',
    professions: [
      'Gardener',
      'Plant Care Worker',
      'Landscaping Worker',
      'Tree Trimmer',
      'Lawn Maintenance',
      'Terrace Garden Worker',
      'Nursery Worker',
      'Plant Delivery',
      'Garden Cleaning'
    ]
  },
  {
    id: 'cat_16',
    name: 'Selling & Reselling',
    professions: [
      'Grocery Seller',
      'Clothing Seller',
      'Homemade Food Seller',
      'Handmade Product Seller',
      'Handicraft Seller',
      'Beauty Product Seller',
      'Electronics Reseller',
      'Furniture Reseller',
      'Used Product Seller',
      'Local Product Seller',
      'Online Reseller'
    ]
  },
  {
    id: 'cat_17',
    name: 'Tailoring & Fashion',
    professions: [
      'Tailor',
      'Blouse Designer',
      'Dress Maker',
      'Alteration Specialist',
      'Embroidery Worker',
      'Sewing Machine Operator',
      'Fashion Designer',
      'Saree Draping',
      'Clothing Repair',
      'Custom Clothing Maker'
    ]
  },
  {
    id: 'cat_18',
    name: 'General Helper Services',
    subtitle: 'These are especially important for non-skilled workers.',
    professions: [
      'House Helper',
      'Cleaning Helper',
      'Kitchen Helper',
      'Shop Helper',
      'Office Helper',
      'Warehouse Helper',
      'Loading/Unloading',
      'Event Helper',
      'Construction Helper',
      'Gardening Helper',
      'Moving Helper',
      'Packing Helper',
      'Delivery Helper',
      'General Labour'
    ]
  },
  {
    id: 'cat_19',
    name: 'Local Business Support',
    professions: [
      'Shop Assistant',
      'Salesperson',
      'Cashier',
      'Receptionist',
      'Telecaller',
      'Customer Support',
      'Stock Management',
      'Inventory Assistant',
      'Billing Assistant',
      'Office Assistant',
      'Field Executive',
      'Marketing Executive',
      'Promotion Worker',
      'Flyer Distributor'
    ]
  },
  {
    id: 'cat_20',
    name: 'Marketing & Promotion',
    professions: [
      'Field Promoter',
      'Brand Promoter',
      'Flyer Distributor',
      'Door-to-Door Promoter',
      'Social Media Promoter',
      'Lead Generator',
      'Telecaller',
      'Survey Worker',
      'Product Demonstrator',
      'Event Promoter'
    ]
  },
  {
    id: 'cat_21',
    name: 'Driving & Transport',
    professions: [
      'Car Driver',
      'Personal Driver',
      'Taxi Driver',
      'Auto Driver',
      'Delivery Driver',
      'Bike Delivery Partner',
      'School Transport Driver',
      'Goods Vehicle Driver',
      'Vehicle Pickup/Drop Partner'
    ]
  },
  {
    id: 'cat_22',
    name: 'Specialized Professional Services',
    professions: [
      'Accountant',
      'Lawyer',
      'Architect',
      'Engineer',
      'Interior Designer',
      'Chartered Accountant',
      'Tax Consultant',
      'Insurance Advisor',
      'Real Estate Agent',
      'Travel Consultant',
      'Business Consultant',
      'HR Consultant'
    ]
  },
  {
    id: 'cat_23',
    name: 'Easy Earning Opportunities',
    subtitle: 'For Non-Professionals (Profession & Skill Level)',
    professions: [
      'House Cleaning — No experience / Basic',
      'Packing Helper — Basic',
      'Moving Helper — Basic',
      'Event Helper — Basic',
      'Kitchen Helper — Basic',
      'Shop Helper — Basic',
      'Warehouse Helper — Basic',
      'Loading/Unloading — Basic',
      'Gardening Helper — Basic',
      'Delivery Partner — Basic',
      'Flyer Distribution — Basic',
      'Field Survey Worker — Basic',
      'Promotion Worker — Basic',
      'Pet Walking — Basic',
      'Elderly Companion — Basic',
      'Babysitting — Basic',
      'Home Helper — Basic',
      'Laundry Helper — Basic',
      'Car Washing — Basic',
      'Bike Washing — Basic'
    ]
  }
];
