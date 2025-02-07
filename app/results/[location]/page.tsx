"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartData } from "chart.js";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Risk profile thresholds based on basis.txt
const RISK_THRESHOLDS = {
  LOW: 623205.54,
  MODERATE: 3072416.49,
  HIGH: 5058425.08,
};

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

type SortField = "min_sell_price" | "lot_area" | "floor_area" | "required_gross" | "prop_group_type" | "status";
type SortOrder = "asc" | "desc";

export default function Results({ params }: { params: Promise<{ location: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const location = decodeURIComponent(resolvedParams.location);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("min_sell_price");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPropertyType, setFilterPropertyType] = useState("all");

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        setProperties(data);
        const uniquePropertyTypes = [...new Set(data.map((item: Property) => item.prop_group_type))] as string[];
        setPropertyTypes(uniquePropertyTypes.sort());
      });
  }, []);

  // Calculate risk profile distribution
  const getRiskDistribution = () => {
    const locationData = properties.filter((item) => item.city_municipality === location);

    const distribution = {
      low: locationData.filter((item) => item.min_sell_price <= RISK_THRESHOLDS.LOW).length,
      moderate: locationData.filter((item) => item.min_sell_price > RISK_THRESHOLDS.LOW && item.min_sell_price <= RISK_THRESHOLDS.MODERATE).length,
      high: locationData.filter((item) => item.min_sell_price > RISK_THRESHOLDS.MODERATE).length,
    };

    return {
      labels: ["Low Risk", "Moderate Risk", "High Risk"],
      datasets: [
        {
          label: "Number of Properties",
          data: [distribution.low, distribution.moderate, distribution.high],
          backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
        },
      ],
    };
  };

  const sortedProperties =
    properties
      ?.filter((property) => property.city_municipality === location)
      ?.sort((a: Property, b: Property) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;
        if (sortField === "prop_group_type" || sortField === "status") {
          return (a[sortField] ?? "").toLowerCase().localeCompare((b[sortField] ?? "").toLowerCase()) * multiplier;
        }
        return ((a[sortField] ?? 0) - (b[sortField] ?? 0)) * multiplier;
      }) ?? [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Property Analysis: {location}</h1>
        <button onClick={() => router.push("/")} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700">
          Change Location
        </button>
      </div>

      {/* Rest of your existing results page components */}
      {/* Risk Distribution Chart */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Risk Profile Distribution</h2>
        <div className="h-[400px]">
          <Bar
            data={getRiskDistribution() as ChartData<"bar", number[], string>}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Table Section with Filter Button */}
      <div className="relative mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Properties</h2>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filter & Sort
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              {/* Filter and Sort Controls */}
              <div className="space-y-6">
                {/* Filters Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Filter Properties</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500">Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="status-all" checked={filterStatus === "all"} onCheckedChange={() => setFilterStatus("all")} />
                          <label htmlFor="status-all" className="text-sm">
                            All
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="status-occupied" checked={filterStatus === "Occupied"} onCheckedChange={() => setFilterStatus("Occupied")} />
                          <label htmlFor="status-occupied" className="text-sm">
                            Occupied
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="status-unoccupied" checked={filterStatus === "Unoccupied"} onCheckedChange={() => setFilterStatus("Unoccupied")} />
                          <label htmlFor="status-unoccupied" className="text-sm">
                            Unoccupied
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Property Type Filter */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500">Property Type</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="type-all" checked={filterPropertyType === "all"} onCheckedChange={() => setFilterPropertyType("all")} />
                          <label htmlFor="type-all" className="text-sm">
                            All
                          </label>
                        </div>
                        {propertyTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox id={`type-${type}`} checked={filterPropertyType === type} onCheckedChange={() => setFilterPropertyType(type)} />
                            <label htmlFor={`type-${type}`} className="text-sm">
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200" />

                {/* Sort Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Sort By</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sort Field */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500">Field</h4>
                      <RadioGroup value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="min_sell_price" id="sort-price" />
                            <Label htmlFor="sort-price" className="text-sm">
                              Price
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lot_area" id="sort-lot" />
                            <Label htmlFor="sort-lot" className="text-sm">
                              Lot Area
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="floor_area" id="sort-floor" />
                            <Label htmlFor="sort-floor" className="text-sm">
                              Floor Area
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="prop_group_type" id="sort-type" />
                            <Label htmlFor="sort-type" className="text-sm">
                              Property Type
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="status" id="sort-status" />
                            <Label htmlFor="sort-status" className="text-sm">
                              Status
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500">Order</h4>
                      <RadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="asc" id="sort-asc" />
                            <Label htmlFor="sort-asc" className="text-sm">
                              Ascending
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="desc" id="sort-desc" />
                            <Label htmlFor="sort-desc" className="text-sm">
                              Descending
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Property Type</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Lot Area</th>
                <th className="px-4 py-2">Floor Area</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Risk Profile</th>
              </tr>
            </thead>
            <tbody>
              {sortedProperties
                .filter((item) => filterStatus === "all" || item.status === filterStatus)
                .filter((item) => filterPropertyType === "all" || item.prop_group_type === filterPropertyType)
                .map((item, index) => {
                  let riskProfile;
                  if (item.min_sell_price <= RISK_THRESHOLDS.LOW) {
                    riskProfile = "Low Risk";
                  } else if (item.min_sell_price <= RISK_THRESHOLDS.MODERATE) {
                    riskProfile = "Moderate Risk";
                  } else {
                    riskProfile = "High Risk";
                  }

                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{item.prop_group_type}</td>
                      <td className="px-4 py-2">₱{item.min_sell_price.toLocaleString()}</td>
                      <td className="px-4 py-2">{item.lot_area} sqm</td>
                      <td className="px-4 py-2">{item.floor_area} sqm</td>
                      <td className="px-4 py-2">{item.status}</td>
                      <td className="px-4 py-2">{riskProfile}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
