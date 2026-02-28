import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Sparkles, ArrowRight, Building2, Calendar,
  Users, ChevronRight, Activity as ActivityIcon, Club as ClubIcon
} from "lucide-react";
import Navbar from "../../../Global_Components/navBar";
import ActivitiesFilter from "../components/ActivitiesFilter";
import { useActivities } from "../../Activities/hooks/useActivities";
import type { ActivityFilterDTO } from "../../Activities/dto/ActivityDTOs";
import TopPerformers from "../components/TopPerformers";
import TeamsOverview from "../components/TeamsOverview";
import PendingCandidates from "../components/PendingCandidates";
import ComplaintsOverview from "../../../Global_Components/ComplaintsOverview";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { useTranslation } from "react-i18next";
import { getMemberById } from "../../Members/services/members.service";
import ActivityCard from "../../Activities/components/list/ActivityCard";
import AIPersonalizationWidget from "../components/AIPersonalizationWidget";
import { getClubs } from "../../Clubs/services/clubs.service";
import type { Club } from "../../Clubs/types";

const Home = () => {
  const { t, i18n } = useTranslation();
  const { activities, loading: activitiesLoading, fetchActivities } = useActivities();
  const { user, role } = useAuth();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || "");
  const isRTL = i18n.dir() === "rtl";

  const fetchClubsData = useCallback(async () => {
    try {
      setClubsLoading(true);
      const clubsData = await getClubs();
      setClubs(clubsData);
    } catch (err) {
      console.error("Error fetching clubs:", err);
    } finally {
      setClubsLoading(false);
    }
  }, []);

  const checkProfileCompleteness = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getMemberById(user.id);
      if (profile) {
        const isIncomplete =
          !profile.job_title ||
          !profile.description ||
          !profile.avatar_url ||
          (profile.specialties?.length || 0) === 0;
        setProfileIncomplete(isIncomplete);
      }
    } catch (error) {
      console.error("Error checking profile completeness:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchClubsData();
    checkProfileCompleteness();
  }, [fetchClubsData, checkProfileCompleteness]);

  const handleFilterChange = useCallback((filters: ActivityFilterDTO) => {
    fetchActivities(filters);
  }, [fetchActivities]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-myFont selection:bg-blue-500/30">
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-6 pb-20 md:pb-0 flex-1 relative flex flex-col">
        {/* Ambient Premium Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-amber-400/10 blur-[120px]" />
        </div>

        {/* =========================================
            GUEST HERO SECTION (Landing Page)
           ========================================= */}
        {!user && (
          <section className="relative px-4 sm:px-6 lg:px-8 pt-24 pb-32 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="max-w-5xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  NGO Hub v2.0 Is Here
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                {t("home.heroTitle")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {t("home.heroTitleHighlight")}
                </span>{" "}
                <br className="hidden md:block" /> {t("home.heroTitleSuffix")}
              </h1>

              <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                {t("home.heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  {t("common.getStarted")}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-lg hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl flex items-center justify-center"
                >
                  {t("common.memberLogin")}
                </Link>
              </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />
          </section>
        )}

        {/* =========================================
            USER DASHBOARD SECTION
           ========================================= */}
        {user && (
          <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 space-y-8">
            {/* Profile Completeness Alert */}
            {profileIncomplete && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-[22px] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 border border-white/20">
                  <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white relative shadow-inner">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-white rounded-full animate-bounce" />
                  </div>
                  <div className="flex-1 text-center md:text-start">
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      {t("home.completeProfileTitle")}
                    </h3>
                    <p className="text-blue-100 text-base max-w-2xl">
                      {t("home.completeProfileDesc")}
                    </p>
                  </div>
                  <Link
                    to="/me"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 group whitespace-nowrap"
                  >
                    {t("home.completeNow")}
                    <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRTL ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <ActivityIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t("home.dashboardTitle")}
                </h2>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200/50 dark:border-blue-800/50 mt-1">
                  {t("common.internal")} Dashboard
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <TopPerformers />
              <TeamsOverview />
              {isExecutive && <ComplaintsOverview />}
              {isExecutive && <PendingCandidates />}
              <div className="md:col-span-2 xl:col-span-3">
                <AIPersonalizationWidget />
              </div>
            </div>
          </section>
        )}

        {/* =========================================
            PUBLIC/SHARED SECTIONS (Events & Clubs)
           ========================================= */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-16 pb-20 relative z-10">

          {/* ----- EVENTS SECTION ----- */}
          <section className="relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Calendar className="w-4 h-4" /> Discover
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t("nav.activities")}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                  {t("home.activitiesSubtitle")}
                </p>
              </div>
              <Link to="/activities" className="hidden md:inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group">
                View All {t("nav.activities")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mb-8">
              <ActivitiesFilter onFilterChange={handleFilterChange} />
            </div>

            {activitiesLoading ? (
              <div className="flex justify-center items-center py-32 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            ) : activities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities.slice(0, 6).map((activity, i) => (
                  <div key={activity.id} className="h-full animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="hover:scale-[1.02] transition-transform duration-300 h-full">
                      <ActivityCard activity={activity} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t("common.noActivities")}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Check back later or try adjusting your filters to find what you're looking for.
                </p>
                <button
                  onClick={() => fetchActivities()}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  {t("common.clearFilters")}
                </button>
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Link to="/activities" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold shadow-sm">
                View All {t("nav.activities")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* ----- CLUBS SECTION ----- */}
          <section className="relative pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Building2 className="w-4 h-4" /> Communities
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t("nav.clubs", "Active Clubs")}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                  Join expert-led communities and connect with like-minded individuals.
                </p>
              </div>
              <Link to="/clubs" className="hidden md:inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group">
                Browse All Clubs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {clubsLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : clubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.slice(0, 3).map((club, i) => (
                  <Link key={club.id} to={`/clubs/${club.id}`} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 border border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/40 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-800/50 flex flex-shrink-0 items-center justify-center overflow-hidden shadow-inner">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                          <ClubIcon className="w-8 h-8 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors line-clamp-1">{club.name}</h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium">
                          <Users className="w-4 h-4" />
                          {club.member_count} Members
                        </div>
                      </div>
                    </div>
                    <p className="mt-5 text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {club.description || "No description provided for this club."}
                    </p>
                    <div className="mt-6 flex items-center text-purple-600 font-semibold text-sm uppercase tracking-wider">
                      Explore Club <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <ClubIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Clubs Yet</h3>
                <p className="text-slate-500">There are currently no active clubs to display.</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default Home;
