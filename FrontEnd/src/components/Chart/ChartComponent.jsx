import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { fetchChartData } from "../../utils/FetchData";

// Transform data to percentage values
const transformData = (data) => {
  return Object.keys(data).map((key) => ({
    name: key,
    value: (data[key] * 10).toFixed(1),
  }));
};

const ChartComponent = ({ selectedSector, selectedHazard, selectedLayer }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getChartData = async (
      selectedLayer,
      selectedSector,
      selectedHazard
    ) => {
      setLoading(true);
      setError(null);
      try {
        const fetchedData = await fetchChartData(
          selectedLayer,
          selectedSector,
          selectedHazard
        );
        const transformedData = transformData(fetchedData);

        const labels = transformedData.map((item) => item.name);
        const values = transformedData.map((item) => item.value);

        setChartData({
          labels,
          datasets: [
            {
              label: "Avarage Value",
              data: values,
              backgroundColor: "rgb(14,116,144,1)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (selectedLayer && selectedSector && selectedHazard) {
      getChartData(selectedLayer, selectedSector, selectedHazard);
    }
  }, [selectedLayer, selectedSector, selectedHazard]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-1/2 w-full bg-gray-50"></div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-1/2 w-full bg-gray-50">
        {error}
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    selectedSector &&
    selectedHazard && (
      <div className="w-full h-full flex flex-col max-h-96">
        {selectedLayer !== "dsd" && (
          <div className="flex-grow bg-gray-100 w-full">
            <Bar
              data={chartData}
              options={{ scales: { y: { beginAtZero: true } } }}
            />
          </div>
        )}
        <div className="flex-grow flex justify-center items-center bg-gray-100 w-full h-fit overflow-visible">
          <table className="bg-white border rounded shadow-md w-full h-full overflow-y-scroll">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b">
                  {selectedLayer === "pd"
                    ? "Province"
                    : selectedLayer === "disd"
                    ? "District"
                    : selectedLayer === "dsd"
                    ? "DSD"
                    : selectedLayer === "gnd"
                    ? "GND"
                    : "Unknown Layer"}
                </th>
                <th className="py-2 px-4 border-b">Value (%)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((label, index) => (
                <tr key={index} className="text-center border-b">
                  <td className="py-2 px-4">{label}</td>
                  <td className="py-2 px-4">
                    {chartData.datasets[0].data[index]}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  );
};

ChartComponent.propTypes = {
  selectedSector: PropTypes.any,
  selectedHazard: PropTypes.any,
  selectedLayer: PropTypes.any,
};

export default ChartComponent;
