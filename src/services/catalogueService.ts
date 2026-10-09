import { ServiceCategory, ServiceCatalogItem } from '../types';

export const DEFAULT_DOORBLY_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat_ac',
    name: 'AC Services',
    slug: 'ac-services',
    description: 'AC installation, repair, deep cleaning and gas charging',
    icon: 'Wind'
  },
  {
    id: 'cat_electrical',
    name: 'Electrical',
    slug: 'electrical',
    description: 'Wiring, switches, fuse boxes, inverter and lighting installations',
    icon: 'Zap'
  },
  {
    id: 'cat_plumbing',
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Pipe repair, taps, bathroom fittings, water tank and leak fixes',
    icon: 'Wrench'
  },
  {
    id: 'cat_cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Full home deep cleaning, bathroom, kitchen and sofa shampooing',
    icon: 'Sparkles'
  },
  {
    id: 'cat_appliance',
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    description: 'Washing machine, refrigerator, microwave and chimney repair',
    icon: 'Tv'
  },
  {
    id: 'cat_painting',
    name: 'Painting',
    slug: 'painting',
    description: 'Interior & exterior wall painting, waterproof coating, touch-ups',
    icon: 'Paintbrush'
  },
  {
    id: 'cat_carpentry',
    name: 'Carpentry',
    slug: 'carpentry',
    description: 'Furniture assembly, door lock repair, modular kitchen and woodwork',
    icon: 'Hammer'
  },
  {
    id: 'cat_home_repair',
    name: 'Home Repair',
    slug: 'home-repair',
    description: 'General handyman tasks, drill & hang, door alignment',
    icon: 'Home'
  },
  {
    id: 'cat_computer_it',
    name: 'Computer & IT Services',
    slug: 'computer-it',
    description: 'Laptop repair, desktop OS installation, Wi-Fi setup, printer setup',
    icon: 'Laptop'
  },
  {
    id: 'cat_beauty',
    name: 'Beauty & Wellness',
    slug: 'beauty',
    description: 'Doorstep salon, haircut, facial, waxing and massage services',
    icon: 'Heart'
  },
  {
    id: 'cat_moving',
    name: 'Packers & Movers',
    slug: 'packers-movers',
    description: 'Local shifting, mini-truck moving, packing and loading assistance',
    icon: 'Truck'
  },
  {
    id: 'cat_delivery',
    name: 'Delivery & Errands',
    slug: 'delivery-errands',
    description: 'Doorstep parcel pickup, urgent medicine delivery, document drop',
    icon: 'Package'
  }
];

export const DEFAULT_DOORBLY_SERVICES: ServiceCatalogItem[] = [
  // AC Services
  {
    id: 'srv_ac_foam_jet',
    category_id: 'cat_ac',
    category_name: 'AC Services',
    name: 'Split AC Foam Jet Deep Service',
    description: 'Indoor & outdoor deep cleaning with high-pressure foam wash',
    base_customer_price: 599,
    base_partner_earning: 480,
    estimated_duration_text: '1 Hour'
  },
  {
    id: 'srv_ac_repair',
    category_id: 'cat_ac',
    category_name: 'AC Services',
    name: 'AC Repair & Diagnosis',
    description: 'Issue identification, cooling check, capacitor/sensor inspection',
    base_customer_price: 299,
    base_partner_earning: 240,
    estimated_duration_text: '45 Mins'
  },
  {
    id: 'srv_ac_gas',
    category_id: 'cat_ac',
    category_name: 'AC Services',
    name: 'AC Gas Refill & Leak Fixing',
    description: 'Nitrogen testing, leak brazing and full refrigerant charging',
    base_customer_price: 2499,
    base_partner_earning: 2050,
    estimated_duration_text: '1.5 Hours'
  },

  // Electrical
  {
    id: 'srv_elec_switch',
    category_id: 'cat_electrical',
    category_name: 'Electrical',
    name: 'Switchboard / Socket Installation',
    description: 'Replacement or new wiring installation of modular switches',
    base_customer_price: 149,
    base_partner_earning: 120,
    estimated_duration_text: '30 Mins'
  },
  {
    id: 'srv_elec_fan',
    category_id: 'cat_electrical',
    category_name: 'Electrical',
    name: 'Ceiling Fan Installation / Repair',
    description: 'Ceiling fan mounting, regulator fix or capacitor replacement',
    base_customer_price: 199,
    base_partner_earning: 160,
    estimated_duration_text: '30 Mins'
  },
  {
    id: 'srv_elec_inverter',
    category_id: 'cat_electrical',
    category_name: 'Electrical',
    name: 'Inverter & Battery Setup',
    description: 'Full home inverter wiring check and battery connection',
    base_customer_price: 499,
    base_partner_earning: 400,
    estimated_duration_text: '1 Hour'
  },

  // Plumbing
  {
    id: 'srv_plumb_tap',
    category_id: 'cat_plumbing',
    category_name: 'Plumbing',
    name: 'Tap / Mixer Repair & Installation',
    description: 'Leaking tap washer replacement, new tap fitting, cartridge fix',
    base_customer_price: 179,
    base_partner_earning: 145,
    estimated_duration_text: '30 Mins'
  },
  {
    id: 'srv_plumb_blockage',
    category_id: 'cat_plumbing',
    category_name: 'Plumbing',
    name: 'Drain / Sink Blockage Removal',
    description: 'Kitchen sink, wash basin or floor trap unclogging with motorized coil',
    base_customer_price: 349,
    base_partner_earning: 280,
    estimated_duration_text: '45 Mins'
  },

  // Cleaning
  {
    id: 'srv_clean_bath',
    category_id: 'cat_cleaning',
    category_name: 'Cleaning',
    name: 'Bathroom Deep Cleaning',
    description: 'Tile descaling, toilet bowl sanitization, fitting shine & floor buffing',
    base_customer_price: 499,
    base_partner_earning: 410,
    estimated_duration_text: '1 Hour'
  },
  {
    id: 'srv_clean_full',
    category_id: 'cat_cleaning',
    category_name: 'Cleaning',
    name: 'Full Home Deep Cleaning (2 BHK)',
    description: 'Complete floor scrubbing, kitchen chimney, balconies & sanitization',
    base_customer_price: 2499,
    base_partner_earning: 2000,
    estimated_duration_text: '3.5 Hours'
  },

  // Appliance
  {
    id: 'srv_app_wm',
    category_id: 'cat_appliance',
    category_name: 'Appliance Repair',
    name: 'Washing Machine Repair & Service',
    description: 'Drum noise, water draining error, PCB check and vibration fixing',
    base_customer_price: 349,
    base_partner_earning: 280,
    estimated_duration_text: '45 Mins'
  },
  {
    id: 'srv_app_fridge',
    category_id: 'cat_appliance',
    category_name: 'Appliance Repair',
    name: 'Refrigerator Repair & Gas Refill',
    description: 'Compressor check, thermostat fix, defrost timer and cooling coil repair',
    base_customer_price: 399,
    base_partner_earning: 320,
    estimated_duration_text: '1 Hour'
  },

  // Carpentry
  {
    id: 'srv_carp_lock',
    category_id: 'cat_carpentry',
    category_name: 'Carpentry',
    name: 'Door Lock Installation / Repair',
    description: 'Mortise lock, cylindrical lock or latch replacement on wooden doors',
    base_customer_price: 249,
    base_partner_earning: 200,
    estimated_duration_text: '45 Mins'
  }
];
