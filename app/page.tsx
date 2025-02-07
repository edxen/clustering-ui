"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Property = {
  id: string;
  min_sell_price: number;
  lot_area: number;
  floor_area: number;
  required_gross: number;
  prop_group_type: string;
  status: string;
  city_municipality: string;
  appr_date: string;
  inspection_date: string;
  appr_days_ago: number;
  inspection_days_ago: number;
};

export default function Home() {
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        const uniqueLocations = Array.from(new Set(data.map((p: Property) => p.city_municipality))) as string[];
        setLocations(uniqueLocations.sort());
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      router.push(`/results/${encodeURIComponent(selectedLocation)}`);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Property Investment Analysis</h1>
          <p className="text-gray-600">Select a location to view property analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Select Location
            </label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLocation && (
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Analysis
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
