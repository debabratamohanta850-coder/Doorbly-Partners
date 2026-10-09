import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { supabaseService } from '../../services/supabaseClient';
import { CheckCircle2, Loader2, X, PlusCircle, RefreshCw, QrCode, CreditCard } from 'lucide-react';

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

export const ServiceSelectionView: React.FC = () => {
  const { partner, updatePartner } = usePartner();

  // Map of categoryId -> selected profession in that dropdown box
  const [categorySelections, setCategorySelections] = useState<Record<string, string>>({});
  const [actionMode, setActionMode] = useState<'add' | 'replace'>('add');
  const [pendingAddSelection, setPendingAddSelection] = useState<{
    category: ProfessionCategory;
    profession: string;
  } | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const replaceStorageKey = `doorbly_last_free_service_replace_${partner?.id || 'default'}`;

  // Initialize dropdown selections from partner's saved services_offered in Supabase
  useEffect(() => {
    if (!partner?.services_offered) return;
    const initialMap: Record<string, string> = {};
    for (const cat of PROFESSION_CATEGORIES) {
      const matched = cat.professions.find(
        (prof) =>
          partner.services_offered.includes(`${cat.name}: ${prof}`) ||
          partner.services_offered.includes(prof)
      );
      if (matched) {
        initialMap[cat.id] = matched;
      }
    }
    setCategorySelections(initialMap);
  }, [partner?.id]);

  const persistSelectionsToSupabase = async (
    updatedMap: Record<string, string>,
    latestCategoryName?: string
  ) => {
    setIsSaving(true);
    try {
      const selectedList = Object.entries(updatedMap)
        .filter(([, prof]) => Boolean(prof))
        .map(([, prof]) => prof);

      const primaryCategory =
        latestCategoryName ||
        (selectedList.length > 0
          ? selectedList[0]
          : partner?.primary_category || 'Home Repair & Maintenance');

      await updatePartner({
        services_offered: selectedList,
        primary_category: primaryCategory
      });

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const getDaysUntilNextFreeReplace = (): number => {
    try {
      const lastTs = localStorage.getItem(replaceStorageKey);
      if (!lastTs) return 0;
      const elapsedDays = (Date.now() - Number(lastTs)) / (1000 * 60 * 60 * 24);
      if (elapsedDays >= 30) return 0;
      return Math.ceil(30 - elapsedDays);
    } catch {
      return 0;
    }
  };

  const handleSelectProfession = async (category: ProfessionCategory, profession: string) => {
    setStatusBanner(null);

    if (!profession) {
      const nextMap = { ...categorySelections };
      delete nextMap[category.id];
      setCategorySelections(nextMap);
      await persistSelectionsToSupabase(nextMap);
      return;
    }

    const existingCount = Object.values(categorySelections).filter(Boolean).length;
    const isAlreadyInThisCategory = Boolean(categorySelections[category.id]);

    // If partner is in "Replace the Profession" mode
    if (actionMode === 'replace') {
      const daysLeft = getDaysUntilNextFreeReplace();
      if (daysLeft > 0) {
        setStatusBanner(
          `Free profession replacement was used recently (${daysLeft} days left for next free change). Switch to "Add the Profession" at ₹49.`
        );
        return;
      }

      // Replace existing profession(s) with the newly selected profession for free
      const nextMap: Record<string, string> = { [category.id]: profession };
      setCategorySelections(nextMap);
      try {
        localStorage.setItem(replaceStorageKey, String(Date.now()));
      } catch {
        // ignore
      }
      await persistSelectionsToSupabase(nextMap, category.name);
      if (partner?.id) {
        await supabaseService.logProfessionChange({
          partnerId: partner.id,
          actionType: 'replace_free_30d',
          categoryId: category.id,
          categoryName: category.name,
          professionName: profession,
          feePaid: 0
        });
      }
      setStatusBanner(`Profession replaced with "${profession}" (Free 30-Day Profession Change applied & saved in Supabase).`);
      return;
    }

    // "Add the Service" mode:
    // If partner already has at least 1 service and is adding a new service, require ₹49 payment per service
    if (existingCount >= 1 && !isAlreadyInThisCategory) {
      setPendingAddSelection({ category, profession });
      return;
    }

    // First service selection or updating same category
    if (existingCount >= 1 && isAlreadyInThisCategory && categorySelections[category.id] !== profession) {
      setPendingAddSelection({ category, profession });
      return;
    }

    const nextMap = { ...categorySelections, [category.id]: profession };
    setCategorySelections(nextMap);
    await persistSelectionsToSupabase(nextMap, category.name);
  };

  const handleConfirmPay49AndAddService = async () => {
    if (!pendingAddSelection) return;
    const { category, profession } = pendingAddSelection;
    const nextMap = { ...categorySelections, [category.id]: profession };
    setCategorySelections(nextMap);
    setPendingAddSelection(null);
    await persistSelectionsToSupabase(nextMap, category.name);
    if (partner?.id) {
      await supabaseService.logProfessionChange({
        partnerId: partner.id,
        actionType: 'add_paid_49',
        categoryId: category.id,
        categoryName: category.name,
        professionName: profession,
        feePaid: 49
      });
    }
    setStatusBanner(`₹49 paid — "${profession}" added to your professions and saved in Supabase!`);
  };

  const handleRemoveSelection = async (categoryId: string) => {
    const nextMap = { ...categorySelections };
    delete nextMap[categoryId];
    setCategorySelections(nextMap);
    await persistSelectionsToSupabase(nextMap);
  };

  const activeSelections = PROFESSION_CATEGORIES.filter((cat) => Boolean(categorySelections[cat.id]));

  return (
    <div className="space-y-3.5 pb-20 font-normal">
      {/* Header & Live Supabase Sync Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-slate-900 tracking-tight">
          Professions
        </h2>

        {isSaving ? (
          <span className="text-[11px] text-teal-700 flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Saving to Supabase...</span>
          </span>
        ) : savedNotice ? (
          <span className="text-[11px] text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saved in Supabase</span>
          </span>
        ) : null}
      </div>

      {/* Two Action Options with Scrolling Text on the Right Side */}
      <div className="space-y-2">
        {/* Option 1: Add the Profession + Right-Side Scrolling Banner */}
        <div
          className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
            actionMode === 'add'
              ? 'bg-sky-50/90 border-sky-300 shadow-2xs'
              : 'bg-white border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActionMode('add');
              setStatusBanner('Select any profession below to add a new profession at ₹49.');
            }}
            className={`shrink-0 py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              actionMode === 'add'
                ? 'bg-[#0F766E] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add the Profession</span>
          </button>

          {/* Scrolling Marquee on the Right Side of Add the Profession */}
          <div className="flex-1 overflow-hidden bg-white/90 border border-sky-200/80 rounded-xl py-1.5 px-2">
            <div className="animate-marquee text-xs text-[#0F766E]">
              Add a New Profession at Just ₹49 &amp; Unlock More Ways to Earn!
            </div>
          </div>
        </div>

        {/* Option 2: Replace the Profession + Right-Side Scrolling Banner */}
        <div
          className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
            actionMode === 'replace'
              ? 'bg-sky-50/90 border-sky-300 shadow-2xs'
              : 'bg-white border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActionMode('replace');
              const daysLeft = getDaysUntilNextFreeReplace();
              if (daysLeft > 0) {
                setStatusBanner(
                  `Next free profession replacement available in ${daysLeft} days.`
                );
              } else {
                setStatusBanner(
                  'Replace mode active: Choose a profession below for your Free 30-Day Profession Change.'
                );
              }
            }}
            className={`shrink-0 py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              actionMode === 'replace'
                ? 'bg-[#0F766E] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace the Profession</span>
          </button>

          {/* Scrolling Marquee on the Right Side of Replace the Profession */}
          <div className="flex-1 overflow-hidden bg-white/90 border border-sky-200/80 rounded-xl py-1.5 px-2">
            <div className="animate-marquee text-xs text-sky-800">
              Free Profession Change Every 30 Days — Keep Growing, Keep Earning!
            </div>
          </div>
        </div>
      </div>

      {/* Mode / Action Status Feedback */}
      {statusBanner && (
        <div className="p-2.5 rounded-xl bg-teal-50/90 border border-teal-200 text-teal-900 text-xs flex items-center justify-between gap-2">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Professions Summary Chips */}
      {activeSelections.length > 0 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="text-[11px] text-slate-500">
            Active Professions ({activeSelections.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSelections.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200/80 text-[11px]"
              >
                <span>{categorySelections[cat.id]}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelection(cat.id)}
                  className="hover:text-rose-600 cursor-pointer"
                  aria-label={`Remove ${categorySelections[cat.id]}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Single-Row Grid of Category Dropdown Boxes */}
      <div className="grid grid-cols-3 gap-2">
        {PROFESSION_CATEGORIES.map((category) => {
          const currentVal = categorySelections[category.id] || '';
          const isSelected = Boolean(currentVal);

          return (
            <div
              key={category.id}
              className={`rounded-xl p-2 border transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-50/90 border-sky-300 shadow-2xs'
                  : 'bg-white border-slate-200/90 shadow-2xs'
              }`}
            >
              <label
                htmlFor={category.id}
                className="text-[10px] leading-tight text-slate-700 line-clamp-2 mb-1.5"
                title={category.subtitle ? `${category.name} — ${category.subtitle}` : category.name}
              >
                {category.name}
              </label>

              <select
                id={category.id}
                value={currentVal}
                onChange={(e) => handleSelectProfession(category, e.target.value)}
                className={`w-full text-[11px] p-1.5 rounded-lg border focus:outline-hidden focus:border-[#0F766E] truncate cursor-pointer ${
                  isSelected
                    ? 'bg-white border-sky-300 text-[#0F766E]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="">{category.name}</option>
                {category.professions.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* ₹49 Add Profession Payment Modal */}
      {pendingAddSelection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-slate-900">
                  Add New Profession — ₹49
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Unlock additional profession leads on your partner profile
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingAddSelection(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Category:</span>
                <span className="text-slate-900">{pendingAddSelection.category.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Profession to Add:</span>
                <span className="text-[#0F766E]">{pendingAddSelection.profession}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-sky-200/80 text-sm text-slate-900">
                <span>Profession Add-on Fee:</span>
                <span>₹49</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmPay49AndAddService}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay ₹49 via UPI &amp; Add Profession</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPay49AndAddService}
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-[#0F766E]" />
                <span>Pay ₹49 via Card / Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
