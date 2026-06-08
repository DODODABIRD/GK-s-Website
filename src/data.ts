/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Village, DistributionCenter } from "./types";

export const INITIAL_VILLAGES: Village[] = [
  {
    id: "v-pemenang",
    name: "Pemenang Village",
    region: "North Lombok",
    coordinates: { lat: -8.4111, lng: 116.0950 },
    population: 18500,
    consumptionPerCapitaKgPerDay: 0.35,
    aggregateProductionKgPerDay: 5800,
    currentPricePerKgIdr: 12200,
    priceHistory15Days: [
      11500, 11600, 11550, 11700, 11800, 11900, 11950, 12000, 12050, 12100, 12150, 12200, 12250, 12200, 12200
    ],
    posDailyDemandKg: 6475,
    dcInventoryReservedKg: 4000,
    is3T: false,
  },
  {
    id: "v-sembalun",
    name: "Sembalun Outpost",
    region: "East Lombok (Mountain Region)",
    coordinates: { lat: -8.3582, lng: 116.5298 },
    population: 12400,
    consumptionPerCapitaKgPerDay: 0.38,
    aggregateProductionKgPerDay: 1900,
    currentPricePerKgIdr: 15400,
    priceHistory15Days: [
      13100, 13400, 13900, 14200, 14600, 15000, 15300, 15500, 15800, 15700, 15600, 15550, 15500, 15450, 15400
    ],
    posDailyDemandKg: 4712,
    dcInventoryReservedKg: 1500,
    is3T: true,
  },
  {
    id: "v-gili",
    name: "Gili Islet Outpost",
    region: "North West Islets",
    coordinates: { lat: -8.3503, lng: 116.0392 },
    population: 4800,
    consumptionPerCapitaKgPerDay: 0.40,
    aggregateProductionKgPerDay: 150,
    currentPricePerKgIdr: 16800,
    priceHistory15Days: [
      14200, 14500, 15000, 15500, 15800, 16200, 16500, 16900, 17200, 17100, 17000, 16900, 16850, 16800, 16800
    ],
    posDailyDemandKg: 1920,
    dcInventoryReservedKg: 800,
    is3T: true,
  },
  {
    id: "v-senggigi",
    name: "Senggigi Coast",
    region: "West Lombok",
    coordinates: { lat: -8.5023, lng: 116.0461 },
    population: 15200,
    consumptionPerCapitaKgPerDay: 0.34,
    aggregateProductionKgPerDay: 5400,
    currentPricePerKgIdr: 12400,
    priceHistory15Days: [
      12100, 12150, 12200, 12250, 12300, 12300, 12350, 12400, 12400, 12400, 12350, 12400, 12450, 12400, 12400
    ],
    posDailyDemandKg: 5168,
    dcInventoryReservedKg: 2000,
    is3T: false,
  },
  {
    id: "v-kuta",
    name: "Kuta Arid Hills",
    region: "South Lombok",
    coordinates: { lat: -8.8953, lng: 116.2801 },
    population: 21500,
    consumptionPerCapitaKgPerDay: 0.36,
    aggregateProductionKgPerDay: 4200,
    currentPricePerKgIdr: 14100,
    priceHistory15Days: [
      13200, 13400, 13500, 13700, 13850, 14000, 14200, 14300, 14350, 14250, 14200, 14150, 14100, 14100, 14100
    ],
    posDailyDemandKg: 7740,
    dcInventoryReservedKg: 3500,
    is3T: true,
  },
  {
    id: "v-sajang",
    name: "Sajang Forest Border",
    region: "Northeast Lombok",
    coordinates: { lat: -8.2917, lng: 116.5054 },
    population: 6200,
    consumptionPerCapitaKgPerDay: 0.35,
    aggregateProductionKgPerDay: 1300,
    currentPricePerKgIdr: 14750,
    priceHistory15Days: [
      13500, 13800, 14000, 14200, 14400, 14600, 14800, 14900, 14850, 14800, 14750, 14700, 14750, 14750, 14750
    ],
    posDailyDemandKg: 2170,
    dcInventoryReservedKg: 1000,
    is3T: true,
  },
  /* National SCM Nodes for Indonesia Focus */
  {
    id: "v-sukabumi",
    name: "Sukabumi Node",
    region: "Java Central-West Zone",
    coordinates: { lat: -6.9277, lng: 106.9300 },
    population: 26400,
    consumptionPerCapitaKgPerDay: 0.36,
    aggregateProductionKgPerDay: 12400,
    currentPricePerKgIdr: 14900,
    priceHistory15Days: [
      13800, 13900, 14000, 14200, 14400, 14600, 14800, 14900, 15100, 15300, 15200, 15000, 14950, 14900, 14900
    ],
    posDailyDemandKg: 9504,
    dcInventoryReservedKg: 8500,
    is3T: false,
  },
  {
    id: "v-medan",
    name: "Medan Hub Node",
    region: "North Sumatra Hub",
    coordinates: { lat: 3.5952, lng: 98.6722 },
    population: 41200,
    consumptionPerCapitaKgPerDay: 0.34,
    aggregateProductionKgPerDay: 19800,
    currentPricePerKgIdr: 11950,
    priceHistory15Days: [
      11800, 11850, 11900, 11950, 11900, 11950, 12000, 12100, 12050, 12000, 11950, 11900, 11950, 11950, 11950
    ],
    posDailyDemandKg: 14008,
    dcInventoryReservedKg: 12000,
    is3T: false,
  },
  {
    id: "v-gowa",
    name: "Gowa Center",
    region: "South Sulawesi Zone",
    coordinates: { lat: -5.2012, lng: 119.4975 },
    population: 28900,
    consumptionPerCapitaKgPerDay: 0.37,
    aggregateProductionKgPerDay: 8400,
    currentPricePerKgIdr: 15150,
    priceHistory15Days: [
      14200, 14350, 14500, 14700, 14900, 15100, 15300, 15500, 15400, 15300, 15250, 15200, 15150, 15150, 15150
    ],
    posDailyDemandKg: 10693,
    dcInventoryReservedKg: 5000,
    is3T: true,
  },
  {
    id: "v-malang",
    name: "Malang Highland",
    region: "East Java Zone",
    coordinates: { lat: -7.9819, lng: 112.6265 },
    population: 34500,
    consumptionPerCapitaKgPerDay: 0.35,
    aggregateProductionKgPerDay: 11200,
    currentPricePerKgIdr: 13900,
    priceHistory15Days: [
      13100, 13200, 13300, 13400, 13600, 13700, 13800, 13900, 14100, 14000, 13950, 13900, 13900, 13900, 13900
    ],
    posDailyDemandKg: 12075,
    dcInventoryReservedKg: 8000,
    is3T: false,
  }
];

export const INITIAL_DCS: DistributionCenter[] = [
  {
    id: "dc-mataram",
    name: "Mataram BULOG Warehouse",
    region: "Central-West Hub",
    coordinates: { lat: -8.5833, lng: 116.1167 },
    riceInventoryKg: 180000,
    capacityKg: 350000,
    assignedVillages: ["v-pemenang", "v-gili", "v-senggigi"],
    operator: "BULOG",
  },
  {
    id: "dc-praya",
    name: "Praya SCM Food Hub",
    region: "Southern Plains Hub",
    coordinates: { lat: -8.7118, lng: 116.2730 },
    riceInventoryKg: 95000,
    capacityKg: 150000,
    assignedVillages: ["v-kuta"],
    operator: "Koperasi Merah Putih",
  },
  {
    id: "dc-selong",
    name: "Selong BAPANAS Outpost",
    region: "East High-Altitude Gateway",
    coordinates: { lat: -8.6492, lng: 116.5332 },
    riceInventoryKg: 72000,
    capacityKg: 120000,
    assignedVillages: ["v-sembalun", "v-sajang"],
    operator: "BAPANAS",
  },
  /* National SCM Warehouses */
  {
    id: "dc-jakarta",
    name: "Jakarta-Sukabumi Bulog Depot",
    region: "Java Core Hub",
    coordinates: { lat: -6.2088, lng: 106.8456 },
    riceInventoryKg: 420000,
    capacityKg: 1000000,
    assignedVillages: ["v-sukabumi", "v-malang"],
    operator: "BULOG",
  },
  {
    id: "dc-medan",
    name: "Medan Sumatra Food Hub",
    region: "North Sumatra Hub",
    coordinates: { lat: 3.5952, lng: 98.6722 },
    riceInventoryKg: 280000,
    capacityKg: 600000,
    assignedVillages: ["v-medan"],
    operator: "Koperasi Merah Putih",
  },
  {
    id: "dc-makassar",
    name: "Makassar Bapanas Gate",
    region: "Sulawesi Logistics Hub",
    coordinates: { lat: -5.1477, lng: 119.4327 },
    riceInventoryKg: 190000,
    capacityKg: 400000,
    assignedVillages: ["v-gowa"],
    operator: "BAPANAS",
  }
];

// 1. PostgreSQL Schema Blueprint String
export const POSTGRES_DDL = `-- ==========================================
-- DEMAND MAPPING & SUPPLY CHAIN CONTROL TOWER
-- Relational & Spatial Schema (PostgreSQL + PostGIS)
-- Inspired by Koperasi Merah Putih Research (Predictive SCM)
-- ==========================================

-- Enable PostGIS extension for geo-spatial spatial analysis & indexing
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create Distribution Centers (Hulu/Warehouses)
CREATE TABLE distribution_centers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    capacity_kg DECIMAL(12, 2) NOT NULL,
    rice_inventory_kg DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    operator VARCHAR(100) NOT NULL DEFAULT 'BULOG',
    geom GEOMETRY(Point, 4326) NOT NULL, -- Core geospatial point
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Villages (Point-of-Sale / End Nodes)
CREATE TABLE villages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(150) NOT NULL,
    population INT NOT NULL CHECK (population > 0),
    consumption_per_capita_per_day_kg DECIMAL(5, 3) NOT NULL,
    aggregate_production_per_day_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_3t BOOLEAN NOT NULL DEFAULT FALSE,
    geom GEOMETRY(Point, 4326) NOT NULL, -- Village lat/lng geom point
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inventory Snapshots (Track daily POS demand vs Warehouse buffer levels)
CREATE TABLE inventory_snapshots (
    id SERIAL PRIMARY KEY,
    village_id VARCHAR(50) REFERENCES villages(id) ON DELETE CASCADE,
    dc_id VARCHAR(50) REFERENCES distribution_centers(id) ON DELETE SET NULL,
    pos_daily_demand_kg DECIMAL(10, 2) NOT NULL,
    allocated_reserves_kg DECIMAL(10, 2) NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Daily Commodity Prices (Volatility early warnings & scarcity flags)
CREATE TABLE daily_commodity_prices (
    id SERIAL PRIMARY KEY,
    village_id VARCHAR(50) REFERENCES villages(id) ON DELETE CASCADE,
    commodity_name VARCHAR(50) NOT NULL, -- 'Rice', 'Chilli', 'Shallot'
    price_per_kg DECIMAL(10, 2) NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (village_id, commodity_name, recorded_date)
);

-- ==========================================
-- GEOSPATIAL INDEXING (GIST) FOR FAST GEOPLOTS & RADIUS LOOKUPS
-- ==========================================

-- Spatial index on villages locations (essential for ST_DWithin and ST_Distance lookups)
CREATE INDEX idx_villages_geom ON villages USING gist (geom);

-- Spatial index on distribution center coordinates
CREATE INDEX idx_dc_geom ON distribution_centers USING gist (geom);

-- B-Tree indexes on standard relational query filters
CREATE INDEX idx_daily_prices_lookup ON daily_commodity_prices (village_id, recorded_date);
CREATE INDEX idx_snapshots_lookup ON inventory_snapshots (recorded_date, village_id);

-- ==========================================
-- DATABASE TRIGGERS FOR VOLATILITY & SURPLUS LOGIC
-- ==========================================

-- Helper View to compute real-time Surplus/Defisit parameters
CREATE OR REPLACE VIEW view_village_surplus_deficit_index AS
SELECT 
    v.id AS village_id,
    v.name,
    v.population,
    -- Village demand based on actual population * individual eating habits
    (v.population * v.consumption_per_capita_per_day_kg) AS expected_demand_kg,
    v.aggregate_production_per_day_kg AS local_production_kg,
    -- Index Formula = (Production - Demand) / Demand * 100
    ROUND(
        ((v.aggregate_production_per_day_kg - (v.population * v.consumption_per_capita_per_day_kg)) / 
        (v.population * v.consumption_per_capita_per_day_kg) * 100), 
        2
    ) AS surplus_deficit_index
FROM villages v;

-- Simple spatial lookup helper: Matches nearest DC to a village dynamically
CREATE OR REPLACE FUNCTION get_nearest_dc(village_geom GEOMETRY)
RETURNS TABLE (dc_id VARCHAR, dc_name VARCHAR, distance_km DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.name,
        (ST_Distance(ST_Transform(village_geom, 3857), ST_Transform(dc.geom, 3857)) / 1000.0) AS distance_km
    FROM distribution_centers dc
    ORDER BY dc.geom <-> village_geom -- Knn index operator for speed
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;`;

// 2. Python Flask API Blueprint String
export const PYTHON_FLASK_API = `"""
Demand Mapping & Supply Chain Control Tower - Backend API Router
Python 3.10+ / Flask Framework with Psycopg2 Database Adaptor
Supports geospatial GeoJSON lookups and predictive analytics calculations.
"""

from flask import Flask, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import numpy as np

app = Flask(__name__)

# Standard database connection helper
def get_db_connection():
    return psycopg2.connect(
        host="localhost", # Or cloud SQL private IP
        database="control_tower_db",
        user="postgres",
        password="secure_password",
        cursor_factory=RealDictCursor
    )

@app.route('/api/villages/metrics', methods=['GET'])
def get_village_indicators():
    """
    1. Surplus/Defisit Index Endpoint
    Calculates the detailed index by reading database metrics and real-time POS logs.
    Formula: ((Production - Expected_Demand) / Expected_Demand) * 100
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Query aggregates current metrics
            query = """
                SELECT 
                    v.id,
                    v.name,
                    v.region,
                    v.population,
                    v.consumption_per_capita_per_day_kg,
                    v.aggregate_production_per_day_kg,
                    v.is_3t,
                    COALESCE(s.pos_daily_demand_kg, v.population * v.consumption_per_capita_per_day_kg) AS real_time_demand,
                    COALESCE(s.allocated_reserves_kg, 0) AS allocated_reserves
                FROM villages v
                LEFT JOIN LATERAL (
                    -- Fetch most recent daily POS sync
                    SELECT pos_daily_demand_kg, allocated_reserves_kg
                    FROM inventory_snapshots
                    WHERE village_id = v.id
                    ORDER BY recorded_date DESC
                    LIMIT 1
                ) s ON TRUE;
            """
            cur.execute(query)
            records = cur.fetchall()
            
            payload = []
            for item in records:
                # Actual calculations
                prod = float(item['aggregate_production_per_day_kg'])
                demand = float(item['real_time_demand']) if float(item['real_time_demand']) > 0 else 1.0
                
                # Surplus/Deficit Index
                index = ((prod - demand) / demand) * 100
                
                # Retrieve price coefficients to assess volatility
                cur.execute(
                    "SELECT price_per_kg FROM daily_commodity_prices "
                    "WHERE village_id = %s AND commodity_name = 'Rice' "
                    "ORDER BY recorded_date DESC LIMIT 15",
                    (item['id'],)
                )
                pricesObj = cur.fetchall()
                price_history = [float(p['price_per_kg']) for p in pricesObj]
                
                # Calculate Price Volatility (Coefficient of Variation = SD / mean)
                volatility = 0.0
                if len(price_history) > 1:
                    mean_val = np.mean(price_history)
                    std_val = np.std(price_history)
                    if mean_val > 0:
                        volatility = float(std_val / mean_val)

                # Determine early warning status
                status = "Stable"
                if index < -20:
                    status = "Deficit" # Red Warning
                elif index > 15 and volatility < 0.05:
                    status = "Surplus" # Green Active
                if volatility > 0.08:
                    status = "Volatile_Price" # Orange fluctuation notice
                    
                payload.append({
                    "id": item['id'],
                    "name": item['name'],
                    "region": item['region'],
                    "population": item['population'],
                    "metrics": {
                        "production_kg_day": prod,
                        "consumption_demand_kg_day": demand,
                        "surplus_deficit_index_pct": round(index, 2),
                        "price_volatility_coefficient": round(volatility, 4),
                        "operator_status": status,
                        "current_price": price_history[0] if price_history else 12000
                    }
                })
                
            return jsonify({
                "status": "success",
                "total_monitored_nodes": len(payload),
                "data": payload
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/maps/geojson', methods=['GET'])
def get_control_tower_geojson():
    """
    2. GeoJSON Endpoint for Spatial Renderers
    Queries Postgres / PostGIS geometry directly, formatting coordinates, properties, 
    and SCM indexes into standardized GeoJSON features.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Query extracts geojson via ST_AsGeoJSON
            query = """
                SELECT 
                    id, 
                    name, 
                    region, 
                    is_3t,
                    ST_AsGeoJSON(geom)::json AS geometry,
                    aggregate_production_per_day_kg AS prod,
                    (population * consumption_per_capita_per_day_kg) AS req_demand
                FROM villages;
            """
            cur.execute(query)
            records = cur.fetchall()
            
            geojson_features = []
            for item in records:
                p = float(item['prod'])
                d = float(item['req_demand'])
                idx = round(((p - d) / d) * 100, 2)
                
                geojson_features.append({
                    "type": "Feature",
                    "geometry": item['geometry'],
                    "properties": {
                        "id": item['id'],
                        "name": item['name'],
                        "region": item['region'],
                        "is_3t": item['is_3t'],
                        "surplus_deficit_index": idx,
                        "alert_level": "RED" if idx < -20 else "GREEN" if idx >= 0 else "ORANGE"
                    }
                })
                
            return jsonify({
                "type": "FeatureCollection",
                "crs": {
                    "type": "name", 
                    "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
                },
                "features": geojson_features
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/supply-chain/sync-inventory', methods=['POST'])
def sync_distribution_buffers():
    """
    3. Bullwhip Effect Mitigator Endpoint
    Compares local Point-of-Sale Real-time Demand data and synchronizes it 
    with warehouses to adaptively scale forward shipments securely.
    """
    data = request.get_json() or {}
    village_id = data.get("village_id")
    current_pos_demand = data.get("pos_demand_kg")
    
    if not village_id or not current_pos_demand:
        return jsonify({"status": "error", "message": "Missing arguments"}), 400
        
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Look up closest active Warehouses
            cur.execute("SELECT id, name, rice_inventory_kg FROM distribution_centers")
            dcs = cur.fetchall()
            
            # Perform sync calculation & buffer allocation
            safety_factor = 1.35 # Mitigate demand amplification
            calculated_allocation = float(current_pos_demand) * safety_factor
            
            # Log new synchronization snapshot in PostGIS log
            cur.execute(
                "INSERT INTO inventory_snapshots (village_id, dc_id, pos_daily_demand_kg, allocated_reserves_kg) "
                "VALUES (%s, %s, %s, %s) RETURNING id",
                (village_id, dcs[0]['id'] if dcs else None, current_pos_demand, calculated_allocation)
            )
            snapshot_id = cur.fetchone()['id']
            conn.commit()
            
            return jsonify({
                "status": "synchronized",
                "snapshot_id": snapshot_id,
                "demand_matched_kg": current_pos_demand,
                "forward_reserves_allocated_kg": round(calculated_allocation, 2),
                "bullwhip_attenuation_ratio": float(current_pos_demand) / calculated_allocation if calculated_allocation > 0 else 0
            })
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

// 3. React Mapbox GL JS Component Blueprint String
export const MAPBOX_REACT_BLUEPRINT = `import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set access token (replace with your private credential or fetch from env)
mapboxgl.accessToken = 'YOUR_MAPBOX_PUBLIC_ACCESS_TOKEN';

interface MapComponentProps {
  villagesGeoJson: any; // GeoJSON featuring village locations & SCM metrics
  dcLocations: any[];   // List of Distribution Warehouses
  onNodeSelect: (id: string, type: 'VILLAGE' | 'DC') => void;
}

export const MapboxControlTower: React.FC<MapComponentProps> = ({
  villagesGeoJson,
  dcLocations,
  onNodeSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [zoom, setZoom] = useState(9.2);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Mapbox map context
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Professional clean layout
      center: [116.2730, -8.5833], // Geographic Center of Lombok, Indonesia
      zoom: zoom,
      pitch: 30 // Soft skew for depth perspective
    });

    const m = map.current;

    m.on('load', () => {
      // 1. Add Village Layer Source from dynamic API Endpoint
      m.addSource('villages-nodes', {
        type: 'geojson',
        data: villagesGeoJson
      });

      // 2. Render Village circles with adaptive colors based on surplus index
      m.addLayer({
        id: 'village-circles',
        type: 'circle',
        source: 'villages-nodes',
        paint: {
          // Dynamic color scale based on alert_level property
          'circle-color': [
            'match',
            ['get', 'alert_level'],
            'RED', '#F87171',      // Serious Deficit
            'ORANGE', '#FB923C',   // Volatile price spikes
            'GREEN', '#34D399',    // Safe surplus supply
            '#94A3B8'              // Unrecorded fallback
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 6,
            12, 14
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // 3. Set up Popup markers and Interactivity logic
      m.on('click', 'village-circles', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const { id, name, region, surplus_deficit_index } = feature.properties;

        // Ensure proper popup alignment
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(\`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; font-weight: 600;">\${name}</h4>
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #64748B;">Reg: \${region}</p>
              <div style="margin-top: 4px; font-weight: bold; color: \${surplus_deficit_index < -10 ? '#EF4444' : '#10B981'}">
                Index: \${surplus_deficit_index}%
              </div>
            </div>
          \`)
          .addTo(m);

        // Bubble selection event to the control panel state
        onNodeSelect(id, 'VILLAGE');
      });

      // Maintain hover cursor feedback
      m.on('mouseenter', 'village-circles', () => m.getCanvas().style.cursor = 'pointer');
      m.on('mouseleave', 'village-circles', () => m.getCanvas().style.cursor = '');
    });

    // 4. Draw static DC locations using Custom HTML Markers
    dcLocations.forEach(dc => {
      const el = document.createElement('div');
      el.className = 'dc-custom-marker';
      el.style.backgroundColor = '#0F172A'; // Obsidian dark icon for warehouses
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '6px';
      el.style.border = '2px solid #38BDF8';
      el.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg fill=\"white\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z\"/></svg>')";
      el.style.backgroundSize = '18px';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        onNodeSelect(dc.id, 'DC');
      });

      new mapboxgl.Marker(el)
        .setLngLat([dc.coordinates.lng, dc.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 })
            .setHTML(\`<strong>\${dc.name}</strong><br/><span style="color:#64748B;">Operator: \${dc.operator}</span>\`)
        )
        .addTo(m);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [villagesGeoJson, dcLocations]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 shadow-sm pointer-events-none text-xs">
        <span className="font-semibold text-slate-800">Mapbox Dynamic Render Engine</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Surplus</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 ml-1" />
          <span>Volatile</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 ml-1" />
          <span>Shortage</span>
        </div>
      </div>
    </div>
  );
};`;
