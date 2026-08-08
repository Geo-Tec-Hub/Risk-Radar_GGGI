import Nav from "../components/Nav";

export default function About() {
  return (
    <>
      <Nav />
      <div className="bg-gray-100 py-10">
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            About Our Organization
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Welcome to riskradar, where we are dedicated to hazard vulnerability
            mapping and cutting-edge data visualization. Our mission is to
            provide valuable insights and tools to enhance understanding and
            decision-making in the face of environmental challenges.
          </p>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Mission
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8">
            At riskradar, we strive to contribute to the safety and resilience
            of communities by mapping hazards and visualizing data to inform
            strategic planning and response efforts. We believe in the power of
            data-driven solutions to mitigate risks and build a more sustainable
            and secure future.
          </p>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            What Sets Us Apart
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8">
            With a team of passionate experts, cutting-edge technology, and a
            commitment to excellence, we stand out in providing comprehensive
            hazard vulnerability mapping services. Our approach integrates the
            latest advancements in data science, GIS technology, and risk
            assessment to deliver actionable insights for better
            decision-making.
          </p>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Collaborate With Us
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Whether you are a government agency, non-profit organization, or a
            community looking to enhance your hazard preparedness, we invite you
            to collaborate with us. Together, we can create meaningful impact
            and build a resilient future.
          </p>
        </div>
      </div>
    </>
  );
}
