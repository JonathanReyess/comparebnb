import { useState } from 'react';
import { TripDetails, Category, ListingData, CategoryType } from './types';
import { PREDEFINED_CATEGORIES } from './constants';
import { extractListingData, generateRecommendation } from './services/geminiService';
import { Building, MapPin, Users, Car, Plane, Plus, Trash2, Check, X, Loader2, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

export default function App() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    numPeople: 21,
    purpose: '',
    priorities: '',
    travelMethod: 'driving',
    origin: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    PREDEFINED_CATEGORIES
  );
  
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryType, setCustomCategoryType] = useState<'string' | 'number' | 'boolean' | 'price'>('string');

  const [listingInputs, setListingInputs] = useState<string[]>(['', '']);
  const [listingsData, setListingsData] = useState<ListingData[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: customCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: customCategoryName,
      type: customCategoryType,
      isCustom: true,
    };
    
    setSelectedCategories([...selectedCategories, newCategory]);
    setCustomCategoryName('');
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedCategories(selectedCategories.filter(c => c.id !== id));
  };

  const handleAddListingInput = () => {
    setListingInputs([...listingInputs, '']);
  };

  const handleUpdateListingInput = (index: number, value: string) => {
    const newInputs = [...listingInputs];
    newInputs[index] = value;
    setListingInputs(newInputs);
  };

  const handleRemoveListingInput = (index: number) => {
    if (listingInputs.length <= 2) return;
    const newInputs = [...listingInputs];
    newInputs.splice(index, 1);
    setListingInputs(newInputs);
  };

  const handleCompare = async () => {
    const validInputs = listingInputs.filter(input => input.trim() !== '');
    if (validInputs.length < 2) {
      alert('Please provide at least 2 Airbnb listings to compare.');
      return;
    }

    setIsComparing(true);
    setStep(4);
    setRecommendation(''); // Reset recommendation
    
    const initialListingsData: ListingData[] = validInputs.map(input => ({
      input,
      data: {},
      loading: true,
    }));
    
    setListingsData(initialListingsData);

    try {
      // Extract data for each listing in parallel
      const extractedDataPromises = validInputs.map(async (input, index) => {
        try {
          const dataPayload = await extractListingData(input, selectedCategories, tripDetails);
          console.log(`Extracted data for listing ${index}:`, dataPayload);
          
          // Add new categories to state dynamically
          if (dataPayload.discovered && dataPayload.discovered.length > 0) {
            setSelectedCategories(prev => {
              const newCats = [...prev];
              let changed = false;
              dataPayload.discovered.forEach(dc => {
                if (!newCats.find(c => c.id === dc.id)) {
                  newCats.push({ id: dc.id, label: dc.label, type: dc.type as CategoryType, isCustom: true });
                  changed = true;
                }
              });
              return changed ? newCats : prev;
            });
          }

          // Merge requested and discovered data
          const mergedData = { ...dataPayload.requestedData };
          if (dataPayload.discovered) {
            dataPayload.discovered.forEach(dc => {
              mergedData[dc.id] = dc.value;
            });
          }

          setListingsData(prev => {
            const next = [...prev];
            next[index] = { input, data: mergedData, loading: false };
            return next;
          });
          return { input, data: mergedData };
        } catch (error: any) {
          setListingsData(prev => {
            const next = [...prev];
            next[index] = { input, data: {}, loading: false, error: error.message };
            return next;
          });
          return { input, data: {}, error: error.message };
        }
      });

      const completedListings = await Promise.all(extractedDataPromises);
      
      // Generate recommendation based on extracted data
      const validCompletedListings = completedListings.filter(l => !l.error);
      if (validCompletedListings.length > 0) {
        const rec = await generateRecommendation(validCompletedListings, tripDetails, selectedCategories);
        setRecommendation(rec);
      } else {
        setRecommendation('Could not extract data from any of the provided listings. Please try going back and pasting the raw text or JSON of the listings instead.');
      }
      
    } catch (error) {
      console.error('Comparison failed:', error);
      setRecommendation('An unexpected error occurred during comparison.');
    } finally {
      setIsComparing(false);
    }
  };

  const renderCell = (category: Category, value: any, allValues: any[]) => {
    if (value === undefined || value === null) return <span className="text-gray-400">-</span>;
    
    let isBest = false;
    let isWorst = false;
    
    const validValues = allValues.filter(v => v !== undefined && v !== null);
    
    if (validValues.length > 1) {
      if (category.type === 'price' || category.id === 'drive_time') {
        // Lower is better
        const min = Math.min(...validValues.map(v => typeof v === 'number' ? v : parseFloat(v) || 0));
        const max = Math.max(...validValues.map(v => typeof v === 'number' ? v : parseFloat(v) || 0));
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        if (numValue === min && min !== max) isBest = true;
        if (numValue === max && min !== max) isWorst = true;
      } else if (category.type === 'number') {
        // Higher is better
        const max = Math.max(...validValues.map(v => typeof v === 'number' ? v : parseFloat(v) || 0));
        const min = Math.min(...validValues.map(v => typeof v === 'number' ? v : parseFloat(v) || 0));
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        if (numValue === max && min !== max) isBest = true;
        if (numValue === min && min !== max) isWorst = true;
      }
    }

    const cellClass = cn(
      "px-4 py-3 text-sm border-b border-gray-100",
      isBest && "bg-green-50 text-green-700 font-medium",
      isWorst && "bg-red-50 text-red-700"
    );

    if (category.type === 'boolean') {
      return (
        <td className={cellClass}>
          {value ? (
            <Check className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <X className="w-5 h-5 text-red-500 mx-auto" />
          )}
        </td>
      );
    }

    if (category.type === 'price') {
      return <td className={cellClass}>${value}</td>;
    }

    return <td className={cellClass}>{value}</td>;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-500 cursor-pointer" onClick={() => setStep(0)}>
            <Building className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">CompareBnB</span>
          </div>
          {step === 0 && (
            <button 
              onClick={() => setStep(1)} 
              className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-full font-medium transition-colors text-sm shadow-sm"
            >
              Start Comparing
            </button>
          )}
        </div>
      </header>

      {step === 0 ? (
        <main className="w-full">
          {/* Hero Section */}
          <section className="relative bg-white overflow-hidden border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                  Don't just guess. <br/>
                  <span className="text-brand-500">Compare your stays.</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Paste Airbnb links, extract the details that matter to your group, and let AI recommend the perfect match for your next trip.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Start Comparing <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-8">
                <img 
                  src="https://picsum.photos/seed/airbnb/1200/1600" 
                  alt="Beautiful vacation home" 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
                <p className="text-lg text-gray-600">Stop juggling dozens of tabs. We make group travel planning effortless.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-6">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">1. Tell us your needs</h3>
                  <p className="text-gray-600 leading-relaxed">Input your group size, travel method, and top priorities. We use this to tailor the comparison.</p>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-6">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">2. Pick your categories</h3>
                  <p className="text-gray-600 leading-relaxed">Choose from predefined data points like bedrooms and hot tubs, or add custom rows like "Has a pool table".</p>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-6">
                    <Building className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">3. Compare & decide</h3>
                  <p className="text-gray-600 leading-relaxed">Paste your Airbnb links. We'll extract the data into a megatable and give you an AI-powered recommendation.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-900">
                <Building className="w-6 h-6 text-brand-500" />
                <span className="text-lg font-bold tracking-tight">CompareBnB</span>
              </div>
              <p className="text-gray-500 text-sm">
                Built with Google AI Studio. Not affiliated with Airbnb.
              </p>
            </div>
          </footer>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Step Indicator */}
          {step < 4 && (
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center bg-gray-50 px-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                  step >= s ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500"
                )}>
                  {s}
                </div>
                <span className="text-xs mt-2 font-medium text-gray-500">
                  {s === 1 ? 'Trip Details' : s === 2 ? 'Categories' : 'Listings'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-6">Tell us about your trip</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of People</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={tripDetails.numPeople}
                    onChange={(e) => setTripDetails({...tripDetails, numPeople: parseInt(e.target.value) || 1})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travel Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTripDetails({...tripDetails, travelMethod: 'driving'})}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      tripDetails.travelMethod === 'driving' 
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" 
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Car className="w-5 h-5" /> Driving
                  </button>
                  <button
                    onClick={() => setTripDetails({...tripDetails, travelMethod: 'flying'})}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      tripDetails.travelMethod === 'flying' 
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" 
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Plane className="w-5 h-5" /> Flying
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Durham, NC"
                    value={tripDetails.origin}
                    onChange={(e) => setTripDetails({...tripDetails, origin: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Trip</label>
                <textarea
                  placeholder="e.g. Family reunion, bachelor party, quiet retreat..."
                  value={tripDetails.purpose}
                  onChange={(e) => setTripDetails({...tripDetails, purpose: e.target.value})}
                  className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Top Priorities</label>
                <textarea
                  placeholder="e.g. Needs a large kitchen, close to downtown, must have a hot tub..."
                  value={tripDetails.priorities}
                  onChange={(e) => setTripDetails({...tripDetails, priorities: e.target.value})}
                  className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all min-h-[100px]"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-2">What do you want to compare?</h2>
            <p className="text-gray-500 mb-6">Select the data points you want our AI to extract from each listing.</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {selectedCategories.map(cat => (
                <div key={cat.id} className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <button onClick={() => handleRemoveCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Custom Category</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Has a pool table"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                />
                <select
                  value={customCategoryType}
                  onChange={(e) => setCustomCategoryType(e.target.value as any)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                >
                  <option value="string">Text</option>
                  <option value="boolean">Yes/No</option>
                  <option value="number">Number</option>
                  <option value="price">Price</option>
                </select>
                <button
                  onClick={handleAddCustomCategory}
                  disabled={!customCategoryName.trim()}
                  className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-gray-900 px-6 py-3 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Listings */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-2">Add Scraped Airbnb Listings</h2>
            <p className="text-gray-500 mb-6">Paste the raw text or JSON data scraped from the Airbnbs you are considering.</p>
            
            <div className="space-y-4 mb-6">
              {listingInputs.map((input, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-4 w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <textarea
                      placeholder="Paste scraped listing data here..."
                      value={input}
                      onChange={(e) => handleUpdateListingInput(index, e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all min-h-[80px] resize-y"
                    />
                  </div>
                  {listingInputs.length > 2 && (
                    <button
                      onClick={() => handleRemoveListingInput(index)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors h-fit mt-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddListingInput}
              className="flex items-center gap-2 text-brand-500 hover:text-brand-600 font-medium px-2 py-2 transition-colors"
            >
              <Plus className="w-5 h-5" /> Add another listing
            </button>

            <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 hover:text-gray-900 px-6 py-3 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCompare}
                disabled={listingInputs.filter(u => u.trim()).length < 2}
                className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                Compare Listings
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Comparison Results</h2>
              <button
                onClick={() => setStep(3)}
                className="text-sm font-medium text-brand-500 hover:text-brand-600"
              >
                Edit Listings
              </button>
            </div>

            {/* Megatable */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 w-48 sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                        Category
                      </th>
                      {listingsData.map((listing, i) => (
                        <th key={i} className="px-4 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-900 min-w-[200px]">
                          Listing {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCategories.map((category) => {
                      const allValues = listingsData.map(l => l.data[category.id]);
                      const label = category.id === 'cost_per_person' 
                        ? `Cost per person (${tripDetails.numPeople} ppl)`
                        : category.id === 'comfort_for_group'
                        ? `Comfort for ${tripDetails.numPeople}`
                        : category.label;

                      return (
                        <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-100 sticky left-0 bg-white shadow-[1px_0_0_0_#f3f4f6]">
                            {label}
                          </td>
                          {listingsData.map((listing, i) => {
                            if (listing.loading) {
                              return (
                                <td key={i} className="px-4 py-3 border-b border-gray-100">
                                  <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
                                </td>
                              );
                            }
                            if (listing.error) {
                              return (
                                <td key={i} className="px-4 py-3 border-b border-gray-100 text-red-500 text-xs">
                                  Error: {listing.error}
                                </td>
                              );
                            }
                            return renderCell(category, listing.data[category.id], allValues);
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="bg-brand-100 text-brand-600 p-2 rounded-lg">
                  <Building className="w-5 h-5" />
                </span>
                AI Recommendation
              </h3>
              
              {isComparing && !recommendation ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
                  <p>Analyzing listings and generating recommendation...</p>
                </div>
              ) : recommendation ? (
                <div className="prose prose-brand max-w-none text-gray-700 leading-relaxed">
                  <Markdown>{recommendation}</Markdown>
                </div>
              ) : null}
            </div>

            {/* Debug Terminal */}
            <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 p-6 md:p-8 mt-8">
              <h3 className="text-xl font-semibold mb-4 text-green-400 font-mono flex items-center gap-2">
                {'>'} Debug Terminal
              </h3>
              <div className="bg-black rounded-xl p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                <pre className="text-green-500 font-mono text-sm whitespace-pre-wrap">
                  {JSON.stringify({
                    status: isComparing ? 'Comparing...' : 'Idle',
                    listingsData: listingsData,
                    selectedCategories: selectedCategories
                  }, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        )}

      </main>
      )}
    </div>
  );
}

