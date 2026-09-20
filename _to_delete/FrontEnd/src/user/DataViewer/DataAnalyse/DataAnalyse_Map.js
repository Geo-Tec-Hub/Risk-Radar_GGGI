import React, { useEffect, useState, useRef } from "react";
import API from "../../../../services/apiConfig";
import L from "leaflet";
import APIs from "../../../Services/APIs";
import "leaflet-easyprint";
import { useNavigate } from "react-router-dom";

const DataAnalyse_Map = (props) => {
  const sector = props.sector;
  const hazard = props.hazard;
  const adminLevel = props.adminLevel;

  const [polygons, setPolygons] = useState(null);
  const mapRef = useRef(null);
  const [printState, setPrintState] = useState(null);
  const [fullPrintData, setFullPrintData] = useState(null); // State for full print data

  const navigate = useNavigate();

  // Data fetching
  useEffect(() => {
    if (sector && hazard && adminLevel) {
      const apiUrl =
        adminLevel !== "gnd"
          ? APIs() +
            "api/users/vulndata/" +
            adminLevel +
            "/geom/avg/?sec=" +
            sector +
            "&hzd=" +
            hazard
          : APIs() +
            "api/users/vulndata/" +
            adminLevel +
            "/avg/sec=" +
            sector +
            "&hzd=" +
            hazard;

      API.get(apiUrl)
        .then((response) => {
          setPolygons(response.data);
        })
        .catch((error) => {
          console.error("Error fetching polygons:", error);
        });
    }
  }, [sector, hazard, adminLevel]);

  // Map setup
  useEffect(() => {
    if (polygons && !mapRef.current) {
      console.log("Initializing map...");
      const map = L.map("map").setView([8, 81], 7.5);

      L.tileLayer(
        "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png",
        {}
      ).addTo(map);

      mapRef.current = map;

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
        const color = avg_risk >= 1 && avg_risk < 10 ? "black" : "transparent";

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
          const name =
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

          layer.bindPopup(
            `<p>Name: ${name}
              <br/>
              Avg Risk: ${(avg / 10) * 100}%</p>`
          );

          // Zoom to layer on click and zoom out after a timeout
          layer.on("click", () => {
            console.log(feature.properties);
            const layerBounds = layer.getBounds();
            map.flyToBounds(layerBounds, { maxZoom: 15 });

            // Pass layerBounds and feature to the print page
            handlePrint(layerBounds, feature, name, avg);
            setTimeout(() => {
              // Reset style of the clicked layer
              layer.setStyle({ opacity: 0.4, fillOpacity: 0.7 });
              map.flyTo([8, 80], 8);
              setPrintState(null);
            }, 20000);
          });
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
      // Print Button
      const printButton = L.control({ position: "topleft" });

      printButton.onAdd = function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom"
        );
        container.innerHTML = "<button id='printButton'>Print</button>";
        container.onclick = function () {
          console.log("Print button clicked");
          handleFullPrint(); // Call handleFullPrint to set fullPrintData state
        };
        return container;
      };

      printButton.addTo(mapRef.current);
    } else {
      console.log("Polygons not yet loaded or map already initialized.");
    }
  }, [polygons, adminLevel]);

  // Handle Print Function
  const handlePrint = (layerBounds, feature, name, avg) => {
    const boundsArray = [
      [layerBounds.getSouthWest().lat, layerBounds.getSouthWest().lng],
      [layerBounds.getNorthEast().lat, layerBounds.getNorthEast().lng],
    ];

    setPrintState({
      sector,
      hazard,
      adminLevel,
      boundsArray,
      feature,
      name,
      avg,
    });
  };

  // Handle Full Print Function
  const handleFullPrint = () => {
    setFullPrintData({
      sector,
      hazard,
      adminLevel,
      polygons,
    });
  };

  useEffect(() => {
    if (printState !== null && mapRef.current) {
      // Print Button
      const selectorPrintButton = L.control({ position: "topleft" });

      selectorPrintButton.onAdd = function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom"
        );
        container.innerHTML =
          "<button id='printButton'>Print selector</button>";
        container.onclick = function () {
          console.log("Print button clicked");
          console.log(printState);
          navigate("print", {
            state: printState,
          });
        };
        return container;
      };

      selectorPrintButton.addTo(mapRef.current);

      // Cleanup function to remove the button when component unmounts or printState changes
      return () => {
        if (mapRef.current) {
          mapRef.current.removeControl(selectorPrintButton);
        }
      };
    }
  }, [printState, navigate]);

  // Navigate to the print page with full print data
  useEffect(() => {
    if (fullPrintData !== null) {
      navigate("print", {
        state: fullPrintData,
      });
    }
  }, [fullPrintData, navigate]);

  return (
    <div>
      <div>
        <div id="info">Map View</div>
        <div id="map" style={{ height: "600px", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default DataAnalyse_Map;
