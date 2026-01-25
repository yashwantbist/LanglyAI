import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import API from "../API/api";

const Plan = ["A1", "A2", "B1", "B2"];

export default function Pricing() {
  const { user, loading } = useAuth();
  const [subscribing, setSubscribing] = useState(false);

  if (loading) return <div className="p-6">Loading...</div>;

  const handleSubscribe = async (plan) => {
    if (!user) {
      alert("Please log in first");
      return;
    }
    setSubscribing(true);

    try {
      const res = await API.post(
        "/api/stripe/create-checkout-session",
        { userId: user._id, planName: plan }
      );
    window.location.href = res.data.url; 

    
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Stripe checkout failed. Use test card 4242 4242 4242 4242.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Plan.map((plan) => (
          <div key={plan} className="border rounded p-4 shadow">
            <h2 className="text-xl font-bold mb-2">{plan} Plan</h2>
            <p className="mb-4">Access all {plan} level lessons.</p>
            <button
              className=" bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              onClick={() => handleSubscribe(plan)}
              disabled={subscribing}
            >
              {subscribing ? "Processing..." : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
