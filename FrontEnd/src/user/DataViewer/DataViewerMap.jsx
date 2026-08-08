import { useEffect, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Select from "ol/interaction/Select";
import { click, pointerMove } from "ol/events/condition";
import Text from "ol/style/Text";
import "../User.css";
import GndDataView from "./DataView_SidePanel";
import DataInput from "./DataInput_SidePanel"; // old panel
import DataInput2 from "./DataInput_SidePanel_v2";
import Basemaps from "../../services/Basemaps";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";

const DataViewerMap = () => {
  const satellite = Basemaps().satellitelayer;
  const osm = Basemaps().osmlayer;
  const gjsonBaseURL = "https://riskradarback.geoinfobox.com/api/users/";

  const [selectedGndId, setSelectedGndId] = useState(null);
  const [selectedGndName, setSelectedGndName] = useState(null);
  const [showSidePanel2, setShowSidePanel2] = useState(false);
  const [showDataInputPanel, setShowDataInputPanel] = useState(false);

  satellite.setVisible(false);

  const handleDataInputClose = () => setShowDataInputPanel(false);

  const toggleOsm = () => {
    osm.setVisible(true);
    satellite.setVisible(false);
  };

  const toggleSatellite = () => {
    osm.setVisible(false);
    satellite.setVisible(true);
  };

  const closeSidePanel = () => {
    setSelectedGndId(null);
    setShowSidePanel2(false);
  };

  const closeSidePanel_2 = () => setShowSidePanel2(false);

  const openSidePanel2 = () => setShowSidePanel2(true);

  const createTextStyle = (text, placement) => {
    return new Style({
      text: new Text({
        text: text,
        font: "16px Calibri,sans-serif",
        fill: new Fill({ color: "#000" }),
        stroke: new Stroke({
          color: "#fff",
          width: 3,
        }),
      }),
    });
  };

  const createVectorLayer = (sourceURL, property, visible = true) => {
    const vectorSource = new VectorSource({
      format: new GeoJSON(),
      url: sourceURL,
    });

    return new VectorLayer({
      source: vectorSource,
      visible,
      style: (feature) => {
        const name = feature.get(property);
        return [
          new Style({
            fill: new Fill({ color: "rgba(0, 0, 0, 0)" }),
            stroke: new Stroke({ color: "black" }),
          }),
          createTextStyle(name),
        ];
      },
    });
  };

  const pd_vector_layer = createVectorLayer(gjsonBaseURL + "pd/", "pd");
  const dist_vector_layer = createVectorLayer(
    gjsonBaseURL + "disd/",
    "disd",
    false
  );
  const dsd_vector_layer = createVectorLayer(
    gjsonBaseURL + "dsd/",
    "dsd",
    false
  );

  useEffect(() => {
    const map = new Map({
      target: "map",
      layers: [
        osm,
        satellite,
        pd_vector_layer,
        dist_vector_layer,
        dsd_vector_layer,
      ],
      view: new View({
        center: fromLonLat([80.5, 7.7]), // Initial center of the map
        zoom: 7.7, // Initial zoom level
      }),
    });

    const Get_gnd = (gnd_url) => {
      map.getLayers().forEach((layer) => {
        const layerName = layer.get("name");
        if (layerName && layerName.startsWith("gnd_")) {
          map.removeLayer(layer);
        }
      });

      const gnd_vector_source = new VectorSource({
        format: new GeoJSON(),
        url: gnd_url,
      });

      const gnd_vector_layer = new VectorLayer({
        source: gnd_vector_source,
        name: `gnd_${new Date().getTime()}`,
        style: (feature) => {
          const gnd_name = feature.get("gnd");
          return [
            new Style({
              fill: new Fill({ color: "rgba(255, 255, 255, 0.5)" }),
              stroke: new Stroke({
                color: "rgba(49,47,50, 1)",
                width: 2,
              }),
            }),
            createTextStyle(gnd_name),
          ];
        },
      });

      map.addLayer(gnd_vector_layer);

      const selectInteraction_gnd = new Select({
        condition: click,
        layers: [gnd_vector_layer],
        style: (feature) => {
          const gnd_name = feature.get("gnd");
          return [
            new Style({
              fill: new Fill({ color: "rgba(238,46,43, 1)" }),
              stroke: new Stroke({ color: "rgba(49,47,50, 1)", width: 3 }),
            }),
            createTextStyle(gnd_name),
          ];
        },
      });

      map.addInteraction(selectInteraction_gnd);

      selectInteraction_gnd.on("select", (event) => {
        if (event.selected.length > 0) {
          const selectedFeature = event.selected[0];
          const extent = selectedFeature.getGeometry().getExtent();

          map
            .getView()
            .fit(extent, { duration: 1000, padding: [20, 20, 20, 20] });

          const gnd_name = selectedFeature.getProperties()["gnd"];
          const gnd_id = selectedFeature.getProperties()["gid"];

          setSelectedGndId(gnd_id);
          setSelectedGndName(gnd_name);
        }
      });
    };

    pd_vector_layer.getSource().once("change", () => {
      if (pd_vector_layer.getSource().getState() === "ready") {
        map.getView().fit(pd_vector_layer.getSource().getExtent(), {
          padding: [20, 20, 20, 20],
          duration: 1000,
        });

        setTimeout(() => {
          map.getView().getZoom();
        }, 1100);
      }
    });

    const updateLayerVisibility = () => {
      const currentZoom = map.getView().getZoom();
      const zoom_1 = 9;
      const zoom_2 = 10.5;
      const zoom_3 = 13.5;

      pd_vector_layer.setVisible(currentZoom < zoom_2);
      dist_vector_layer.setVisible(
        currentZoom >= zoom_1 && currentZoom < zoom_3
      );
      dsd_vector_layer.setVisible(currentZoom >= zoom_2);
    };

    const createSelectInteraction = (condition, layers, hover = false) => {
      return new Select({
        condition,
        layers,
        style: (feature) => {
          const name = feature.get(
            layers[0] === pd_vector_layer
              ? "pd"
              : layers[0] === dist_vector_layer
              ? "disd"
              : "dsd"
          );
          return [
            new Style({
              fill: new Fill({
                color: hover
                  ? "rgba(255,214,48, 1)"
                  : "rgba(255, 255, 255, 0.3)",
              }),
              stroke: new Stroke({ color: "rgba(49,47,50, 1)", width: 3 }),
            }),
            createTextStyle(name),
          ];
        },
      });
    };

    const selectInteraction_hover_pd = createSelectInteraction(
      pointerMove,
      [pd_vector_layer],
      true
    );
    const selectInteraction_hover_dist = createSelectInteraction(
      pointerMove,
      [dist_vector_layer],
      true
    );
    const selectInteraction_hover_dsd = createSelectInteraction(
      pointerMove,
      [dsd_vector_layer],
      true
    );
    const selectInteraction = createSelectInteraction(click, [
      pd_vector_layer,
      dist_vector_layer,
    ]);
    const selectInteraction_dsd = createSelectInteraction(click, [
      dsd_vector_layer,
    ]);

    selectInteraction.on("select", (event) => {
      if (event.selected.length > 0) {
        const selectedFeature = event.selected[0];
        const extent = selectedFeature.getGeometry().getExtent();

        map.getView().fit(extent, { duration: 500, padding: [20, 20, 20, 20] });
      }
    });

    selectInteraction_dsd.on("select", (event) => {
      if (event.selected.length > 0) {
        const selectedFeature_dsd = event.selected[0];
        const extent = selectedFeature_dsd.getGeometry().getExtent();
        map.getView().fit(extent, { duration: 500, padding: [20, 20, 20, 20] });
        const dsd_code = selectedFeature_dsd.getProperties()["dsd"];
        const gnd_url = `${gjsonBaseURL}gnd/sql/?dsd=${dsd_code}`;
        // https://riskradarback.geoinfobox.com/api/users/gnd/sql/?dsd=Bandarawela
        Get_gnd(gnd_url);
      }
    });

    map.addInteraction(selectInteraction_hover_pd);
    map.addInteraction(selectInteraction_hover_dist);
    map.addInteraction(selectInteraction_hover_dsd);
    map.addInteraction(selectInteraction);
    map.addInteraction(selectInteraction_dsd);

    map.on("moveend", updateLayerVisibility);

    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <div>
      <div className="flex">
        <div className="flex-grow-0 w-14 sm:w-16 md:w-20 bg-gray-700 h-full">
          <div className="flex flex-col items-center py-3 h-screen overflow-auto">
            <div className="w-full flex-grow-0 mb-2">
              <button
                className="w-full h-full py-2 px-1 sm:px-2 bg-gray-800 text-white text-xs sm:text-sm md:text-base"
                onClick={toggleOsm}
              >
                OSM
              </button>
            </div>
            <div className="w-full flex-grow-0 mb-2">
              <button
                className="w-full h-full py-2 px-1 sm:px-2 bg-gray-800 text-white text-xs sm:text-sm md:text-base"
                onClick={toggleSatellite}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>
        <div className="relative flex-grow">
          <div id="map" className="w-full h-screen"></div>
        </div>
        {selectedGndId !== null && (
          <div className=" flex h-fit w-96 bg-gray-50 absolute flex-wrap justify-center px-2 py-2 right-0 rounded-lg text-nowrap space-y-1">
            <button
              title="Close"
              className="w-full text-left"
              onClick={closeSidePanel}
            >
              <CloseOutlined className=" text-red-600 text-2xl" />
            </button>
            <h5 className="w-full text-xl font-bold">
              Selected Grama Niladari Division
            </h5>
            <p className="w-full text-base">
              <b>Name: </b>
              {selectedGndName} | <b>ID: </b>
              {selectedGndId}
            </p>
            <GndDataView gnd_id={selectedGndId} />
          </div>
        )}
        {showSidePanel2 && (
          <div className=" flex h-fit w-96 bg-gray-50 absolute flex-wrap justify-center px-2 py-2 right-0 rounded-lg text-nowrap space-y-1">
            <button
              title="Close"
              className="w-full text-left"
              onClick={closeSidePanel}
            >
              <CloseOutlined className=" text-red-600 text-2xl" />
            </button>
            <h5>Selected Grama Niladari Division</h5>
            <p>
              <b>Name: </b>
              {selectedGndName} | <b>ID: </b>
              {selectedGndId}
            </p>
            <DataInput gnd_id={selectedGndId} />
          </div>
        )}
      </div>
      {showDataInputPanel && (
        <div>
          <button
            title="Close"
            className="close-button"
            onClick={closeSidePanel}
          >
            <CloseOutlined className=" text-red-600 text-2xl" />
          </button>
          <h5>Selected Grama Niladari Division</h5>
          <p>
            <b>Name: </b>
            {selectedGndName} | <b>ID: </b>
            {selectedGndId}
          </p>
          <DataInput2 gnd_id={selectedGndId} />
        </div>
      )}
      {selectedGndId && (
        <div
          className="absolute right-0 bottom-0 m-4 p-4 rounded-full shadow-md cursor-pointer bg-blue-50"
          onClick={openSidePanel2}
        >
          <PlusOutlined className="text-3xl text-gray-700" />
        </div>
      )}
    </div>
  );
};

export default DataViewerMap;
