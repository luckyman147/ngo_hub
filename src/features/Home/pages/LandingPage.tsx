import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Users, ArrowRight, Sparkles,
  Calendar, Club as ClubIcon
} from "lucide-react";
import { useAuth } from "../../Authentication/auth.context";
import LanguageSwitcher from "../../../Global_Components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { getClubs } from "../../Clubs/services/clubs.service";
import { activityService } from "../../Activities/services/activityService";
import type { Club } from "../../Clubs/types";
import type { Activity } from "../../Activities/models/Activity";
import ActivityCard from "../../Activities/components/list/ActivityCard";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.dir() === "rtl";

  const [clubs, setClubs] = useState<Club[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch top 3 clubs
    getClubs().then(data => {
      setClubs(data.slice(0, 3));
    }).catch(console.error);

    // Fetch top 3 activities (events)
    activityService.getActivities().then(data => {
      setActivities(data.slice(0, 3));
    }).catch(console.error);
  }, []);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-myFont selection:bg-blue-500/30 ${isRTL ? "rtl" : "ltr"}`}>

      {/* Ambient Premium Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight">NGO Hub</span>
        </div>
        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <LanguageSwitcher />
          {user ? (
            <>
              <Link to="/clubs" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors hidden sm:block">
                {t("nav.clubs", "Clubs")}
              </Link>
              <Link to="/activities" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors hidden sm:block">
                {t("nav.activities", "Events")}
              </Link>
              <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors hidden sm:block">
                {t("auth.login", "Login")}
              </Link>
              <Link to="/register" className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold transition-all shadow-lg">
                {t("common.getStarted", "Get Started")}
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-40 pb-32 flex flex-col items-center justify-center min-h-[85vh]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {t("home.heroBadge", "Empowering Communities Worldwide")}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            {t("home.heroTitle", "One platform for")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              {t("home.heroTitleHighlight", "all clubs and events")}
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t("home.heroSubtitle", "Create your club, manage events, invite members, and grow your impact—all in one place. Built for associations and communities of any size.")}
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                {t("nav.createClub", "Create a Club")}
              </Link>
              <Link
                to="/clubs"
                className="px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-lg hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                {t("nav.browseClubs", "Browse Clubs")}
              </Link>
            </div>
          )}
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />
      </section>

      {/* Featured Clubs Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {t("nav.clubs", "Discover Communities")}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Join thriving clubs, connect with like-minded individuals, and make a difference together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clubs.length > 0 ? clubs.map((club) => (
              <Link key={club.id} to={`/clubs/${club.id}`} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 border border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-500" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover" /> : <ClubIcon className="w-8 h-8 text-purple-500" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-1">{club.name}</h3>
                    <span className="text-sm font-semibold text-slate-500">{club.member_count} Members</span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 line-clamp-3 mb-6">
                  {club.description || "No description provided."}
                </p>
                <div className="flex items-center text-purple-600 font-bold text-sm tracking-wide">
                  View Club <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )) : (
              [1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            )}
          </div>

          <div className="mt-12 text-center">
            <Link to="/clubs" className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 font-bold shadow-sm hover:shadow-md transition-all group">
              Browse All Clubs <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {t("nav.activities", "Upcoming Events")}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Participate in activities, workshops, and gatherings happening around you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="hover:-translate-y-2 transition-transform duration-300">
                <ActivityCard activity={activity} />
              </div>
            )) : (
              <div className="col-span-full text-center py-12 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Upcoming Events</h3>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link to="/activities" className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 font-bold shadow-sm hover:shadow-md transition-all group">
              View All Events <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-blue-600 dark:bg-blue-900">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to make an impact?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join the platform today. Create your club, empower your members, and organize unforgettable events.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl bg-white text-blue-700 font-bold text-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Join NGO Hub Now
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
