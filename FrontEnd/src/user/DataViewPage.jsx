import DataViewerByName from "./DataViewer/DataViewerByName";
import DataViewerMap from "./DataViewer/DataViewerMap";
import "./User.css";
import Nav from "../components/Nav";

export default function DataViewPage() {
  return (
    <div className="w-screen">
      <Nav />
      <DataViewerByName />
      <DataViewerMap />
    </div>
  );
}
