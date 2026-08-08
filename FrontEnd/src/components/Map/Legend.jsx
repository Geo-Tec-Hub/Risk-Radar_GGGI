export default function Legend() {
  return (
    <div className="absolute bottom-10 left-5 bg-white p-2 rounded shadow-md text-nowrap">
      <h2 className=" text-xs mb-2">Risk Levels</h2>
      <div className="mb-1">
        <span
          className="inline-block w-4 h-4 mr-2"
          style={{ background: "rgba(0, 255, 0, 0.6)" }}
        ></span>
        <span className="text-xs">1%-39%</span>
      </div>
      <div className="mb-1">
        <span
          className="inline-block w-4 h-4 mr-2"
          style={{ background: "rgba(255, 255, 0, 0.6)" }}
        ></span>
        <span className="text-xs">40-69%</span>
      </div>
      <div className="mb-1">
        <span
          className="inline-block w-4 h-4 mr-2"
          style={{ background: "rgba(255, 0, 0, 0.6)" }}
        ></span>
        <span className="text-xs">70-100%</span>
      </div>
    </div>
  );
}
