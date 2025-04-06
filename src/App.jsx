import './App.css'
import React, {useEffect, useMemo, useRef, useState} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Tabs from "./Components/Tabs.jsx";
import BusinessCard from "./Components/Card.jsx";
import {DATA} from "./Data.js";
import { useNavigate } from 'react-router-dom';

const geoJsonData = {
    type: "FeatureCollection",
    features: DATA.map((location) => ({
        type: "Feature",
        properties: {
            title: location.title,
            address: location.address,
            logo: location.logo
        },
        geometry: {
            type: "Point",
            coordinates: [location.lng, location.lat]
        }
    }))
};

function App() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(80.5598);
    const [lat, setLat] = useState(78.9629);
    const [zoom, setZoom] = useState(9);
    const [tabs, setTabs] = useState(["All", "Zudio", "Westside", "Star Bazar"]);
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [data, setData] = useState(DATA);
    const navigate = useNavigate();

    const handleListButtonClick = () => {
        navigate('/list');
    };

    useEffect(() => {
        setData([]); // Clear data immediately

        const tabMapping = {
            "All": 0,
            "Zudio": 1,
            "Westside": 2,
            "Star Bazar": 3
        };

        const id = tabMapping[activeTab] ?? 0;
        const filteredData = id === 0 ? DATA : DATA.filter(item => item.id === id);

        setTimeout(() => {
            setData(filteredData);

            // Update the map source
            if (map.current && map.current.getSource("locations")) {
                const newGeoJsonData = {
                    type: "FeatureCollection",
                    features: filteredData.map((location) => ({
                        type: "Feature",
                        properties: {
                            title: location.title,
                            address: location.address,
                            logo: location.logo
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [location.lng, location.lat]
                        }
                    }))
                };

                map.current.getSource("locations").setData(newGeoJsonData);

                // Fit the map bounds to the filtered locations
                if (filteredData.length > 0) {
                    const bounds = new mapboxgl.LngLatBounds();
                    filteredData.forEach(location => {
                        bounds.extend([location.lng, location.lat]);
                    });

                    map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
                }
            }
        }, 0);
    }, [activeTab]);


    mapboxgl.accessToken = 'pk.eyJ1IjoiZGVzaWducGV0dGFpIiwiYSI6ImNtOG91cnlqZDA0cjQybHNhdmhvN2FjOGUifQ.F2bB6_s1MyTlsgooTuNDZA';

    useEffect(() => {
        if (map.current) {
            map.current.remove();
            map.current = null;
        }

        if (!mapContainer.current) return;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/light-v11",
                center: [lng, lat],
                zoom: zoom
            });

            map.current.addControl(new mapboxgl.NavigationControl());

            map.current.on("move", () => {
                setLng(map.current.getCenter().lng.toFixed(4));
                setLat(map.current.getCenter().lat.toFixed(4));
                setZoom(map.current.getZoom().toFixed(2));
            });

            // Add clustering source
            map.current.on("load", () => {
                map.current.addSource("locations", {
                    type: "geojson",
                    data: geoJsonData,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                // Cluster circles
                map.current.addLayer({
                    id: "clusters",
                    type: "circle",
                    source: "locations",
                    filter: ["has", "point_count"],
                    paint: {
                        "circle-color": "#f28cb1",
                        "circle-radius": [
                            "step",
                            ["get", "point_count"],
                            20, 5,
                            30, 10,
                            40
                        ],
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                    }
                });

                // Cluster count labels
                map.current.addLayer({
                    id: "cluster-count",
                    type: "symbol",
                    source: "locations",
                    filter: ["has", "point_count"],
                    layout: {
                        "text-field": "{point_count_abbreviated}",
                        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                        "text-size": 14
                    }
                });

                // Individual points
                map.current.addLayer({
                    id: "unclustered-point",
                    type: "circle",
                    source: "locations",
                    filter: ["!", ["has", "point_count"]],
                    paint: {
                        "circle-color": "#ff5733",
                        "circle-radius": 8,
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                    }
                });

                // Cluster click event - zoom into the cluster
                map.current.on("click", "clusters", (e) => {
                    const features = map.current.queryRenderedFeatures(e.point, {
                        layers: ["clusters"]
                    });
                    const clusterId = features[0].properties.cluster_id;
                    map.current
                        .getSource("locations")
                        .getClusterExpansionZoom(clusterId, (err, zoom) => {
                            if (err) return;
                            map.current.easeTo({
                                center: features[0].geometry.coordinates,
                                zoom: zoom
                            });
                        });
                });

                // Click on a single point - show popup
                map.current.on("click", "unclustered-point", (e) => {
                    const feature = e.features[0];
                    const coordinates = feature.geometry.coordinates.slice();
                    const { title, address, logo } = feature.properties;

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(`
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <img src="${logo}" alt="Logo" style="width:150px; height:50px; margin-bottom: 5px;" />
            <h4 style="margin: 5px 0;">${title}</h4>
            <p style="margin: 0; color: gray;">${address}</p>
        </div>
    `)
                        .addTo(map.current);
                });

                // Change cursor to pointer on hover
                map.current.on("mouseenter", "clusters", () => {
                    map.current.getCanvas().style.cursor = "pointer";
                });
                map.current.on("mouseleave", "clusters", () => {
                    map.current.getCanvas().style.cursor = "";
                });
            });

            console.log("Map initialized successfully");
        } catch (error) {
            console.error("Mapbox initialization error:", error);
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen p-4 relative">
            <div className="flex h-[calc(100vh-2rem)] w-full">
                {/* Left Sidebar */}
                <div className="w-1/3 bg-white p-1 rounded-md shadow-md border border-gray-300 h-full overflow-auto">
                    <div className="w-full p-2">
                        <div className="w-full max-w-3xl mx-auto flex border border-gray-300 rounded-lg shadow-sm">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full p-3 outline-none rounded-l-lg"
                            />
                        </div>
                        <Tabs setActiveTab={setActiveTab} activeTab={activeTab} tabs={tabs}/>

                        <div className="w-full max-w-6xl mx-auto ">
                            <div
                                className="h-[700px] overflow-y-auto">
                                <div className="space-y-2">

                                    {data.map((data) => (
                                        <BusinessCard
                                            data={data}
                                            onClick={() => {
                                                if (map.current) {
                                                    map.current.easeTo({
                                                        center: [data.lng, data.lat],
                                                        zoom: 14
                                                    });
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                            </div>
                        </div>

                    </div>

                </div>

                {/* Map Container */}
                <div className="w-2/3 h-full">
                    <div
                        ref={mapContainer}
                        className="w-full h-full rounded-lg"
                        style={{
                            minHeight: '500px',
                            height: '100%',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={handleListButtonClick}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none"
                style={{ zIndex: 1000 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            </button>
        </div>
    );
}

export default App;
