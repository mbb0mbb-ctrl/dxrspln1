import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const btnClass =
    "bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded shadow-md transition-colors duration-300";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4">
      <div className="border border-gray-600 rounded-lg p-10 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-10 font-sans tracking-wide">
          Ders Çalışma Programı
        </h1>
        <div className="space-y-6">
          <button
            className={btnClass}
            onClick={() => navigate("/monthly")}
            aria-label="Aylık Plan"
          >
            Aylık Plan
          </button>
          <button
            className={btnClass}
            onClick={() => navigate("/weekly")}
            aria-label="Haftalık Plan"
          >
            Haftalık Plan
          </button>
          <button
            className={btnClass}
            onClick={() => navigate("/daily")}
            aria-label="Günlük Plan"
          >
            Günlük Plan
          </button>
        </div>
      </div>
    </div>
  );
}
