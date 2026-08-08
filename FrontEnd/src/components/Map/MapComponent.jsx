import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import OSM from "ol/source/OSM";
import { Fill, Stroke, Style, Text } from "ol/style";
import { ScaleLine } from "ol/control";
import "ol-ext/dist/ol-ext.css";
import Legend from "./Legend";
import html2canvas from "html2canvas";
import { PrinterOutlined } from "@ant-design/icons";

const MapComponent = ({
  geoData,
  selectedLayer,
  selectedView,
  selectedProvinceGeom,
  selectedSector,
  selectedHazard,
  selectedProvince,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapTitle, setMapTitle] = useState(null);
  const [labelsVisible, setLabelsVisible] = useState(true);

  useEffect(() => {
    const sector = selectedSector;
    const hazard = selectedHazard;

    let vice;
    if (selectedProvince) {
      vice = selectedProvince + "  Province";
    } else {
      vice =
        selectedView || selectedLayer === "pd"
          ? "Provincial Vulnerability Data"
          : selectedView || selectedLayer === "disd"
          ? "District Vulnerability Data"
          : selectedView || selectedLayer === "dsd"
          ? "DSD Vulnerability Data"
          : selectedView || selectedLayer === "gnd"
          ? "GND Vulnerability Data"
          : "Unknown";
    }

    setMapTitle(`Data Of ${sector} Sector ${hazard} Hazard ${vice}`);
  }, [
    selectedSector,
    selectedHazard,
    selectedProvince,
    selectedView,
    selectedLayer,
    setMapTitle,
  ]);

  const color1 = "rgba(9, 205, 137, 0.6)";
  const color2 = "rgba(229, 227, 12, 0.6)";
  const color3 = "rgba(227, 9, 9, 0.6)";

  const getName = (feature, selectedLayer) => {
    if (selectedView) {
      switch (selectedView) {
        case "pd":
          return feature.get("pd");

        case "gnd":
          return feature.get("gnd");

        case "dsd":
          return feature.get("dsd");

        case "disd":
          return feature.get("disd");

        default:
          break;
      }
    }
    switch (selectedLayer) {
      case "pd":
        return feature.get("pd");
      case "disd":
        return feature.get("dis");
      case "dsd":
        return feature.get("dsd");
      default:
        return feature.get("gnd");
    }
  };

  const getAvgRisk = (feature, selectedLayer) => {
    if (selectedView) {
      switch (selectedView) {
        case "pd":
          return feature.get("avg_value");

        case "gnd":
          return feature.get("avg");

        case "dsd":
          return feature.get("avg_value");

        case "disd":
          return feature.get("avg_value");

        default:
          break;
      }
    }
    if (selectedLayer) {
      return selectedLayer !== "gnd"
        ? feature.get("avg_value")
        : feature.get("avg");
    }
    return feature.get("avg");
  };

  const getFillColor = (avgRisk) => {
    if (avgRisk >= 1 && avgRisk < 4) return color1;
    if (avgRisk >= 4 && avgRisk < 7) return color2;
    if (avgRisk >= 7 && avgRisk <= 10) return color3;
    return "transparent";
  };

  const getTextColor = (avgRisk) => {
    return avgRisk >= 1 && avgRisk <= 10 ? "black" : "transparent";
  };

  const getPolygonStyle = (feature) => {
    const name = getName(feature, selectedLayer);
    const avgRisk = getAvgRisk(feature, selectedLayer);
    const fillColor = getFillColor(avgRisk);
    const color = getTextColor(avgRisk);

    return new Style({
      fill: new Fill({
        color: fillColor,
        opacity: 1,
      }),
      stroke: new Stroke({
        color: color,
        width: 1,
        opacity: 0.5,
      }),
      text: labelsVisible
        ? new Text({
            text: `${name}\n${(avgRisk * 10).toFixed(2)}%`,
            fill: new Fill({
              color: "#000",
              size: "10px",
            }),
            stroke: new Stroke({
              color: "#fff",
              width: 3,
            }),
          })
        : undefined,
    });
  };

  const getSelectedProvinceStyle = () => {
    return new Style({
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.2)",
      }),
      stroke: new Stroke({
        color: "#000",
        width: 1,
      }),
    });
  };

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Initialize the map
      mapInstanceRef.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([80.5, 7.7]), // Initial center of the map
          zoom: 7.7, // Initial zoom level
        }),
      });

      // Adding Scale Control
      const scaleControl = new ScaleLine();
      mapInstanceRef.current.addControl(scaleControl);
    }

    if (mapInstanceRef.current) {
      // Get the vector layers
      mapInstanceRef.current
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer instanceof VectorLayer) {
            // Update the style of each feature in the vector layer
            layer
              .getSource()
              .getFeatures()
              .forEach((feature) => {
                feature.setStyle(getPolygonStyle(feature));
              });
          }
        });
    }

    const mapData = geoData?.length;

    if (mapData) {
      // Clear existing vector layers
      mapInstanceRef.current
        .getLayers()
        .getArray()
        .filter((layer) => layer instanceof VectorLayer)
        .forEach((layer) => mapInstanceRef.current.removeLayer(layer));

      // Create a new vector source and add the geoData to it
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(
          {
            type: "FeatureCollection",
            features: geoData,
          },
          {
            featureProjection: "EPSG:3857", // Ensure the features are in the correct projection
          }
        ),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: getPolygonStyle,
      });

      // Add the vector layer to the map
      mapInstanceRef.current.addLayer(vectorLayer);

      // Add selected province geometry
      if (selectedProvinceGeom) {
        const selectedProvinceSource = new VectorSource({
          features: new GeoJSON().readFeatures(selectedProvinceGeom, {
            featureProjection: "EPSG:3857",
          }),
        });

        const selectedProvinceLayer = new VectorLayer({
          source: selectedProvinceSource,
          style: getSelectedProvinceStyle,
        });

        mapInstanceRef.current.addLayer(selectedProvinceLayer);
      }

      // Add click event for zooming and displaying popup
      // Add click event for zooming and displaying popup
      const clickHandler = (event) => {
        const features = vectorSource.getFeatures();

        // Change the style of the clicked feature and reset the styles of all other features
        mapInstanceRef.current.forEachFeatureAtPixel(
          event.pixel,
          (clickedFeature) => {
            const geometry = clickedFeature.getGeometry();

            // Zoom to the feature
            mapInstanceRef.current
              .getView()
              .fit(geometry.getExtent(), { maxZoom: 15 });

            // Set styles
            features.forEach((feature) => {
              if (feature === clickedFeature) {
                feature.setStyle(getPolygonStyle(clickedFeature));
              } else {
                feature.setStyle(new Style({})); // Remove style
              }
            });

            // Reset styles after timeout
            setTimeout(() => {
              features.forEach((feature) => {
                feature.setStyle(getPolygonStyle(feature));
              });
              mapInstanceRef.current
                .getView()
                .setCenter(fromLonLat([80.5, 7.7]));
              mapInstanceRef.current.getView().setZoom(7.7);
            }, 20000);
          }
        );
      };

      mapInstanceRef.current.on("singleclick", clickHandler);

      return () => {
        // Clean up event listener
        mapInstanceRef.current.un("singleclick", clickHandler);
      };
    }
  }, [geoData, selectedLayer, labelsVisible]);

  const dims = {
    a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],
    a3: [420, 297],
    a4: [297, 210],
    a5: [210, 148],
  };

  const exportPDF = () => {
    const exportButton = document.getElementById("export-pdf");
    exportButton.disabled = true;
    document.body.style.cursor = "progress";

    const map = mapInstanceRef.current;

    const format = "a4";
    const resolution = 100;
    const dim = dims[format];
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const viewResolution = map.getView().getResolution();

    // Save the current map view properties
    const originalSize = {
      width: map.getTargetElement().style.width,
      height: map.getTargetElement().style.height,
      center: map.getView().getCenter(),
      resolution: map.getView().getResolution(),
    };

    map.once("rendercomplete", () => {
      html2canvas(map.getViewport(), { width, height }).then((canvas) => {
        // Add text to the canvas
        const context = canvas.getContext("2d");
        const text = mapTitle;
        const x = 400; // X-coordinate for the text
        const y = 800; // Y-coordinate for the text
        context.font = "20px Arial"; // Font size and style
        context.fillStyle = "black"; // Text color
        context.fillText(text, x, y);

        // Save the canvas as a JPEG file
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg");
        link.download = "map.jpeg";
        link.click();

        // Reset the original map size and view
        map.getTargetElement().style.width = originalSize.width;
        map.getTargetElement().style.height = originalSize.height;
        map.updateSize();
        map.getView().setCenter(originalSize.center);
        map.getView().setResolution(originalSize.resolution);

        exportButton.disabled = false;
        document.body.style.cursor = "auto";
      });
    });

    // Set print size without changing the map view resolution
    map.getTargetElement().style.width = width + "px";
    map.getTargetElement().style.height = height + "px";
    map.updateSize();
    map.getView().setResolution(viewResolution);
  };

  return (
    <div style={{ width: "100%", height: "94vh", position: "relative" }}>
      <div ref={mapRef} className="w-full h-full"></div>
      <Legend />
      <button
        className=" absolute top-10 right-0 mr-5 bg-red-200 px-2 py-2"
        id="export-pdf"
        onClick={exportPDF}
      >
        <PrinterOutlined className="text-2xl" />
      </button>
      {geoData && (
        <button
          className="absolute top-24 right-0 mr-5 bg-cyan-700 text-white px-2 py-1 rounded-xl font-bold"
          onClick={() => setLabelsVisible(!labelsVisible)}
        >
          {labelsVisible ? "Hide Details " : "Show Details "}
        </button>
      )}
    </div>
  );
};

export default MapComponent;

MapComponent.propTypes = {
  geoData: PropTypes.any,
  selectedLayer: PropTypes.any,
  selectedView: PropTypes.any,
  selectedProvinceGeom: PropTypes.any,
  selectedSector: PropTypes.any,
  selectedHazard: PropTypes.any,
  selectedProvince: PropTypes.any,
};
