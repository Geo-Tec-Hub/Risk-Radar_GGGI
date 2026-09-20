// import React, { useEffect } from "react";
// import Basemaps from "../../../Services/Basemaps";
// import { fromLonLat } from "ol/proj";
// import { Map, View } from "ol";
// import OSM from "ol/source/OSM";
// import TileLayer from "ol/layer/Tile";
// import APIs from "../../../Services/APIs";

// import MultiPolygon from "ol/geom/MultiPolygon.js";
// import { Polygon } from "ol/geom";
// import Feature from "ol/Feature";
// import VectorSource from "ol/source/Vector";
// import GeoJSON from "ol/format/GeoJSON";
// import VectorLayer from "ol/layer/Vector";

// const DataAnalyse_Map = (props) => {
//   const sector = props.sector;
//   const hazard = props.hazard;
//   const adminLevel = props.adminLevel;

//   useEffect(() => {
//     if (sector && hazard && adminLevel) {
//       const fetchData = async () => {
//         try {
//           const response = await fetch(
//             APIs() +
//               "api/users/vulndata/" +
//               adminLevel +
//               "/geom/avg/?sec=" +
//               sector +
//               "&hzd=" +
//               hazard
//           );

//           console.log(
//             APIs() +
//               "api/users/vulndata/" +
//               adminLevel +
//               "/geom/avg/?sec=" +
//               sector +
//               "&hzd=" +
//               hazard
//           );

//           if (!response.ok) {
//             throw new Error("Network response was not ok");
//           }

//           const jsonData1 = await response.json();
//           const jsonData = jsonData1[0];

//           console.log(jsonData);
//           // alert(JSON.stringify(jsonData));
//           // console.log(JSON.stringify(jsonData));

//           // Create a vector source and a vector layer for the fetched GeoJSON data
//           const vectorSource = new VectorSource({
//             features: new GeoJSON().readFeatures(jsonData),
//           });

//           const vectorLayer = new VectorLayer({
//             source: vectorSource,
//           });

//           const testJ = {
//             type: "FeatureCollection",
//             features: [
//               {
//                 type: "Feature",
//                 properties: {},
//                 geometry: {
//                   coordinates: [
//                     [
//                       [80.44921483978555, 7.093955884099643],
//                       [80.6071145167436, 6.522438246982233],
//                       [81.28483074010319, 6.550065315721682],
//                       [81.28459086456843, 7.05710416980169],
//                       [80.44921483978555, 7.093955884099643],
//                     ],
//                   ],
//                   type: "Polygon",
//                 },
//               },
//             ],
//           };

//           // const geojson = new GeoJSON().readFeature()
//           const vectorSource2 = new VectorSource({
//             features: new GeoJSON().readFeatures(testJ),
//           });
//           const vectorLayer2 = new VectorLayer({
//             source: vectorSource2,
//           });

//           console.log("hello");

//           // Create the map and add layers
//           const map = new Map({
//             target: "map",
//             layers: [
//               new TileLayer({
//                 source: new OSM(),
//               }),
//               vectorLayer, // Add the vector layer to the map
//               vectorLayer2,
//             ],
//             view: new View({
//               center: fromLonLat([80.5, 8]),
//               zoom: 7,
//               projection: "EPSG:4326",
//             }),
//           });
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         }
//       };

//       // Call the fetchData function
//       fetchData();
//     }
//   }, [sector, hazard, adminLevel]);

//   return <div id="map" style={{ width: "100%", height: "100vh" }}></div>;
// };

// export default DataAnalyse_Map;

/////////////////////////////////////////////

import React, { useEffect, useState } from "react";
import { fromLonLat } from "ol/proj";
import { Map, View } from "ol";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";

import APIs from "../../../Services/APIs";

const DataAnalyse_Map = (props) => {
  const sector = props.sector;
  const hazard = props.hazard;
  const adminLevel = props.adminLevel;

  const [jsn, setJsn] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (sector && hazard && adminLevel) {
        console.log("test 1");
        try {
          const response = await fetch(
            APIs() +
              "api/users/vulndata/" +
              adminLevel +
              "/geom/avg/?sec=" +
              sector +
              "&hzd=" +
              hazard
          );

          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const jsonData1 = await response.json();
          const jsonData = jsonData1[0];
          console.log(jsonData);
          setJsn(jsonData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      //*-------------
      const gjsn = new GeoJSON();
      const gjsnFeature = gjsn.readFeatures(jsn);
      console.log(JSON.stringify(gjsnFeature));

      const vs = new VectorSource({
        features: gjsnFeature,
      });

      const vl = new VectorLayer({
        source: vs,
      });
      //*--------------
    };

    fetchData();

    const testJ = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [80.44921483978555, 7.093955884099643],
                [80.6071145167436, 6.522438246982233],
                [81.28483074010319, 6.550065315721682],
                [81.28459086456843, 7.05710416980169],
                [80.44921483978555, 7.093955884099643],
              ],
            ],
          },
        },
      ],
    };

    // console.log(testJ);
    // console.log(jsn);
    // console.log(JSON.stringify(jsn));

    // Parse GeoJSON data
    const geoJsonFormat = new GeoJSON();
    const geoJsonFeature = geoJsonFormat.readFeatures(testJ);
    console.log(JSON.stringify(geoJsonFeature));

    // Create vector source
    const vectorSource = new VectorSource({
      features: geoJsonFeature,
    });

    // Create vector layer
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    // Initialize map
    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: [80.5, 8],
        zoom: 7,
        projection: "EPSG:4326",
      }),
    });
  }, [sector]);

  return <div id="map" style={{ width: "100%", height: "100vh" }}></div>;
};

export default DataAnalyse_Map;
