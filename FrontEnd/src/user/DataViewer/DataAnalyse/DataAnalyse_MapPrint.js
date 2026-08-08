import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useLocation } from "react-router-dom";
import "leaflet-easyprint";
import "../../User.css";

const DataAnalyse_MapPrint = () => {
  const location = useLocation();
  const {
    boundsArray,
    feature,
    name,
    avg,
    sector,
    hazard,
    adminLevel,
    polygons,
  } = location.state || {};
  const mapRef = useRef(null);
  const easyPrintRef = useRef(null);
  const [layersData, setLayersData] = useState({});

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map("printMap").setView([8, 81], 7.5);

      L.tileLayer(
        "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png",
        {}
      ).addTo(map);

      mapRef.current = map;

      if (polygons) {
        const color1 = "green";
        const color2 = "yellow";
        const color3 = "red";

        function getPolygonStyle(feature) {
          const avg_risk =
            adminLevel !== "gnd"
              ? feature.properties.avg_value
              : feature.properties.avg;
          const fillColor =
            avg_risk >= 1 && avg_risk < 4
              ? color1
              : avg_risk >= 4 && avg_risk < 7
              ? color2
              : avg_risk >= 7 && avg_risk < 10
              ? color3
              : "transparent";
          const color =
            avg_risk >= 1 && avg_risk < 10 ? "black" : "transparent";

          return {
            fillColor,
            fillOpacity: 0.7,
            weight: 2,
            opacity: 0.4,
            color,
          };
        }

        L.geoJSON(polygons, {
          style: getPolygonStyle,
          onEachFeature: (feature, layer) => {
            const layerName =
              adminLevel === "pd"
                ? feature.properties.pd
                : adminLevel === "disd"
                ? feature.properties.dis
                : adminLevel === "dsd"
                ? feature.properties.dsd
                : feature.properties.gnd;
            const levels = ["pd", "disd", "dsd"];
            const avg = levels.includes(adminLevel)
              ? feature.properties.avg_value
              : feature.properties.avg;

            // Calculate formatted percentage
            const avgPercentage = ((avg / 10) * 100).toFixed(2) + "%";

            // Bind popup to the polygon layer
            layer.bindPopup(
              `<p>Name: ${layerName}<br/>Avg Risk: ${avgPercentage}%</p>`
            );

            // Get centroid of the polygon and add a label
            if (
              (adminLevel === "pd" || adminLevel === "disd") &&
              avgPercentage !== "0.00%"
            ) {
              let centroid = layer.getBounds().getCenter();
              L.marker(centroid, {
                icon: L.divIcon({
                  className: "layer-label",
                  html: `<div>${layerName} <br> ${avgPercentage}%</div>`,
                  iconSize: [100, 40],
                }),
              }).addTo(map);
            }

            // Store layer data
            setLayersData((prevLayersData) => ({
              ...prevLayersData,
              [layerName]: feature,
            }));
          },
        }).addTo(map);

        // Adding Scale Control
        L.control.scale().addTo(map);

        // Add legend
        const legend = L.control({ position: "bottomright" });

        legend.onAdd = function () {
          const div = L.DomUtil.create("div", "info legend");
          div.innerHTML = `
          <div>
          <h8><b>Risk Levels</b></h8>
            <div class="info legend-item">
              <i style="background: ${color1}"></i>
              <span>0-30%</span>
            </div>
            <div class="info legend-item">
              <i style="background: ${color2}"></i>
              <span>40-60%</span>
            </div>
            <div class="info legend-item">
              <i style="background: ${color3}"></i>
              <span>70-100%</span>
            </div>
            </div>
          `;
          return div;
        };

        legend.addTo(map);
      } else if (boundsArray && feature) {
        // Fit to the bounds and add a red outline
        map.fitBounds(boundsArray);

        const color1 = "green";
        const color2 = "yellow";
        const color3 = "red";

        function getPolygonStyle(feature) {
          const avg_risk =
            adminLevel !== "gnd"
              ? feature.properties.avg_value
              : feature.properties.avg;
          const fillColor =
            avg_risk >= 1 && avg_risk < 4
              ? color1
              : avg_risk >= 4 && avg_risk < 7
              ? color2
              : avg_risk >= 7 && avg_risk < 10
              ? color3
              : "transparent";
          const color =
            avg_risk >= 1 && avg_risk < 10 ? "black" : "transparent";

          return {
            fillColor,
            fillOpacity: 0.4,
            weight: 2,
            opacity: 0.2,
            color,
          };
        }

        // Assuming 'feature' is your GeoJSON data
        L.geoJSON(feature, {
          style: getPolygonStyle,
          onEachFeature: function (feature, layer) {
            // Get centroid of the polygon and add a label
            let centroid = layer.getBounds().getCenter(); // Get centroid of the bounding box
            L.marker(centroid, {
              icon: L.divIcon({
                className: "layer-label",
                html: `<div>${name} <br> ${(avg / 10) * 100}</div>`,
                iconSize: [100, 40], // Adjust as needed
              }),
            }).addTo(map);
            // Optionally, you can also bind the same popup to the polygon layer
            layer.bindPopup(
              `<p>Name: ${name}<br/>Avg Risk: ${(avg / 10) * 100}%</p>`
            );
          },
        }).addTo(map);
      }

      // Add the print button
      easyPrintRef.current = L.easyPrint({
        tileLayer: L.tileLayer(
          "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png",
          {}
        ),
        sizeModes: ["Current", "A4Portrait", "A4Landscape"],
        filename: "Map",
        exportOnly: true,
        hideControlContainer: false,
      }).addTo(map);
    }
  }, [boundsArray, feature, polygons, adminLevel]);

  const handleLayerSelect = (event) => {
    const selectedLayerName = event.target.value;
    const selectedLayer = layersData[selectedLayerName];

    if (selectedLayer) {
      const layerBounds = L.geoJSON(selectedLayer).getBounds();
      mapRef.current.fitBounds(layerBounds);
    }
  };

  return (
    <div className="printing-page">
      <div className="printing-map">
        <div id="printMap" style={{ height: "1050px", width: "830px" }}></div>
      </div>
      <div className="printing-filter">
        <div>
          <h2 className="filter-txt">Filter Map</h2>
          <div className="filter-content">
            <select onChange={handleLayerSelect}>
              <option value="">Select a layer</option>
              {Object.keys(layersData).map((layerName) => (
                <option key={layerName} value={layerName}>
                  {layerName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalyse_MapPrint;
