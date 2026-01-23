import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import { useAuth } from "../Context/AuthContext";
import API from "../API/api";
import LessonPreviewCard from "../Components/LessonPreviewCard";

const levels = ["A1", "A2", "B1", "B2"];

const rank = { FREE: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
const canAccessLevel = (plan, level) => (rank[plan] || 0) >= (rank[level] || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const [currentLevel, setCurrentLevel] = useState("A1");

  const [lessons, setLessons] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);

  // ✅ Sync currentLevel from URL or user
  useEffect(() => {
    const levelFromUrl = searchParams.get("level");
    const fallback = user?.currentLevel || "A1";
    setCurrentLevel((levelFromUrl || fallback).toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

useEffect(() => {
  const sessionId = searchParams.get("session_id");
  if (!sessionId || !user?._id) return;

  (async () => {
    try {
      await API.get(`/api/stripe/sync?session_id=${sessionId}`);
      // now refetch subscription plan
      const res = await API.get(`/api/stripe/${user._id}`);
      setSubscriptionPlan((res.data?.plan || "FREE").toUpperCase());
    } catch (e) {
      console.error("Sync failed:", e?.response?.data || e.message);
    }
  })();
}, [searchParams, user]);

  // ✅ Fetch subscription plan
  useEffect(() => {
    if (!user) return;

    const fetchSub = async () => {
      try {
        const res = await API.get(`/api/stripe/${user._id}`);
        setSubscriptionPlan((res.data?.plan || "FREE").toUpperCase());
      } catch (e) {
        console.error("Failed to fetch subscription:", e?.response?.data || e.message);
        setSubscriptionPlan("FREE");
      }
    };

    fetchSub();
  }, [user]);

  // ✅ Fetch lessons by level
  useEffect(() => {
    if (!currentLevel) return;

    const fetchLessons = async () => {
      try {
        const res = await API.get(`/api/lessons/${currentLevel}`);
        setLessons(res.data);
      } catch (e) {
        console.error("Failed to fetch lessons:", e?.response?.data || e.message);
        setLessons([]);
      }
    };

    fetchLessons();
  }, [currentLevel]);

  // ✅ Fetch completed lessons
  useEffect(() => {
    if (!user || !currentLevel) return;

    const fetchProgress = async () => {
      try {
        const res = await API.get(`/api/lessons/progress/${user._id}?level=${currentLevel}`);
        setCompletedDays(res.data.map((p) => p.dayNumber));
      } catch (e) {
        console.error("Failed to fetch progress:", e?.response?.data || e.message);
        setCompletedDays([]);
      }
    };

    fetchProgress();
  }, [user, currentLevel]);

  const progressPercent = lessons.length
    ? Math.round((completedDays.length / lessons.length) * 100)
    : 0;

  const handleLevelChange = (level) => {
    const target = level.toUpperCase();
    const locked = !canAccessLevel(subscriptionPlan, target);

    if (locked) {
      alert("🔒 This level is locked. Please subscribe to access it.");
      navigate("/pricing");
      return;
    }

    setCurrentLevel(target);
    setSearchParams({ level: target });
  };

  const isLevelLocked = !canAccessLevel(subscriptionPlan, currentLevel);

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bonjour {user?.name}</h1>
          <p className="text-gray-600">Ready to continue your French learning journey?</p>
          <p className="text-sm text-gray-500 mt-1">
            Current plan: <span className="font-semibold">{subscriptionPlan}</span>
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{currentLevel} Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {levels.map((level) => {
            const locked = !canAccessLevel(subscriptionPlan, level);
            return (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition
                  ${currentLevel === level ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                  ${locked ? "opacity-60" : ""}`}
                title={locked ? "Locked - subscribe to access" : "Open level"}
              >
                {level} {locked ? "🔒" : ""}
              </button>
            );
          })}
        </div>

        {isLevelLocked ? (
          <div className="border rounded-lg p-5 bg-yellow-50">
            <div className="font-bold">🔒 Access denied</div>
            <div className="text-sm text-gray-700 mt-1">
              You need a subscription to view {currentLevel} lessons.
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Pricing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-3 gap-5">
            {lessons.map((lesson) => {
              const completed = completedDays.includes(lesson.dayNumber);

              return (
                <LessonPreviewCard
                  key={lesson._id}
                  lesson={lesson}
                  completed={completed}
                  locked={!canAccessLevel(subscriptionPlan, lesson.level)}
 onAction={() => {
    const canStart = canAccessLevel(subscriptionPlan, lesson.level);

    if (!canStart) {
      // 🔒 PREVIEW behavior
      alert(
        `👀 Preview\n\n${lesson.title}\nDay ${lesson.dayNumber}\n\nSubscribe to unlock full lesson.`
      );
      navigate("/pricing");
      return;
    }

    // ▶ START / REVIEW behavior
    navigate(`/lessons/${lesson.level}/${lesson.dayNumber}`);
  }}
                  
                  
                  
                  />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
