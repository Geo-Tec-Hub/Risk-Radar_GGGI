import { useEffect, useState } from "react";
import { fetchUserData, fetchUserUploadedData } from "../utils/FetchData";
import Nav from "../components/Nav";

export default function Data() {
  const [userData, setUserData] = useState(null);
  const [userUploadedData, setUserUploadedData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const getProfileData = async () => {
      const data = await fetchUserData(token);
      setUserData(data);
    };

    getProfileData();
  }, []);

  useEffect(() => {
    if (userData) {
      const getUserUploadedData = async () => {
        const uploadedData = await fetchUserUploadedData(userData.email);
        setUserUploadedData(uploadedData);
      };

      getUserUploadedData();
    }
  }, [userData]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Nav />
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4 text-center">User Information</h1>
        <table className="min-w-full bg-white border border-gray-300 mb-4">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">First Name</th>
              <th className="py-2 px-4 border-b">Last Name</th>
              <th className="py-2 px-4 border-b">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">{userData.first_name}</td>
              <td className="py-2 px-4 border-b">{userData.last_name}</td>
              <td className="py-2 px-4 border-b">{userData.email}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-lg font-bold mb-4 text-center">
          User Uploaded Data
        </h2>
        {userUploadedData ? (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Sector</th>
                <th className="py-2 px-4 border-b">Hazard</th>
                <th className="py-2 px-4 border-b">Value</th>
                <th className="py-2 px-4 border-b">Date Created</th>
                <th className="py-2 px-4 border-b">Date Updated</th>
                <th className="py-2 px-4 border-b">Province</th>
                <th className="py-2 px-4 border-b">District</th>
                <th className="py-2 px-4 border-b">DSD</th>
                <th className="py-2 px-4 border-b">GND</th>
              </tr>
            </thead>
            <tbody>
              {userUploadedData.map((data) => (
                <tr key={data.id}>
                  <td className="py-2 px-4 border-b">{data.sec}</td>
                  <td className="py-2 px-4 border-b">{data.hzd}</td>
                  <td className="py-2 px-4 border-b">{data.value}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(data.date_created).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(data.date_updated).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">{data.pd}</td>
                  <td className="py-2 px-4 border-b">{data.disd}</td>
                  <td className="py-2 px-4 border-b">{data.dsd}</td>
                  <td className="py-2 px-4 border-b">{data.gnd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>Loading user uploaded data...</div>
        )}
      </div>
    </>
  );
}
