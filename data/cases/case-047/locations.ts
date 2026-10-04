import type { Location, Route } from "@/lib/game-engine/types";

export const locations: Location[] = [
  {
    id: "blackwood_hotel",
    name: "Blackwood Hotel",
    district: "Old Quarter",
    description:
      "Nine floors of 1920s stone owned, since 2015, by a holding company nobody in the Old Quarter can name. Room 314 is on the third floor, east wing, beside Service Stair B.",
    x: 50,
    y: 46,
  },
  {
    id: "blackwood_garage",
    name: "Parking Garage",
    district: "Old Quarter",
    description:
      "Two underground levels beneath the hotel, P1 and P2, with a separate camera system and a pedestrian door to Calder Street. Four minutes on foot from the third floor.",
    x: 56,
    y: 55,
  },
  {
    id: "mercury_bar",
    name: "Mercury Bar",
    district: "Signal Hill",
    description: "Dark wood, private booths, a bartender who remembers faces.",
    x: 28,
    y: 30,
  },
  {
    id: "mercer_office",
    name: "Mercer Office",
    district: "Printworks",
    description:
      "A rented room above a print shop where Daniel wrote. Ransacked sometime between the 14th and the 15th.",
    x: 74,
    y: 18,
  },
  {
    id: "daniel_apartment",
    name: "Daniel's Apartment",
    district: "Westbank",
    description: "Third-floor walk-up. He hadn't slept there in two nights.",
    x: 16,
    y: 70,
  },
  {
    id: "river_district",
    name: "River District",
    district: "River District",
    description:
      "Warehouses converted to flats along the Vesper. Quiet after eleven. The embankment has no cameras.",
    x: 80,
    y: 74,
  },
  {
    id: "archive_building",
    name: "Archive Building",
    district: "Civic Centre",
    description:
      "Vesper County Records. Overflow storage for closed cases was contracted out in 2014.",
    x: 64,
    y: 30,
  },
  {
    id: "lakemoor",
    name: "Lakemoor",
    district: "Out of town",
    description: "A lake town two hours north on Highway 9.",
    x: 50,
    y: 2,
  },
];

export const routes: Route[] = [
  { from: "blackwood_hotel", to: "blackwood_garage", minutes: 4, mode: "walk" },
  { from: "blackwood_hotel", to: "mercury_bar", minutes: 7, mode: "drive" },
  { from: "mercury_bar", to: "mercer_office", minutes: 13, mode: "drive" },
  { from: "blackwood_hotel", to: "mercer_office", minutes: 11, mode: "drive" },
  { from: "blackwood_hotel", to: "river_district", minutes: 8, mode: "drive" },
  { from: "blackwood_hotel", to: "archive_building", minutes: 6, mode: "drive" },
  { from: "blackwood_hotel", to: "daniel_apartment", minutes: 15, mode: "drive" },
  { from: "blackwood_hotel", to: "lakemoor", minutes: 120, mode: "drive" },
];

export const locationById = (id: string) => locations.find((l) => l.id === id);
