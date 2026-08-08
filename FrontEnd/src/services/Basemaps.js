import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";

const Basemaps = () => {
  const osmlayer = new TileLayer({
    source: new OSM(),
  });

  const satellitelayer = new TileLayer({
    source: new XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attributions: "© Esri",
    }),
  });

  return {
    osmlayer, // Correctly returning an object with the osmlayer property
    satellitelayer,
  };
};

export default Basemaps;
