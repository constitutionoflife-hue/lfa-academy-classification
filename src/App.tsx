/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import ScrollToTop from "./components/ScrollToTop";
import LandingPage from "./LandingPage";
import SignupPage from "./Signup";
import AcademyDashboard from "./AcademyDashboard";
import SigninPage from "./Signin";
import VerifyEmailPage from "./VerifyEmail";
import AcademyProfilePage from "./AcademyProfile";
import { AuthProvider, useAuth } from "./lib/AuthContext";

import ClassificationALeadership from "./ClassificationALeadership";
import ClassificationAPlanning from "./ClassificationAPlanning";
import ClassificationAOrganization from "./ClassificationAOrganization";
import ClassificationATechnical from "./ClassificationATechnical";
import ClassificationABudget from "./ClassificationABudget";
import ClassificationAFacilities from "./ClassificationAFacilities";
import ClassificationAHealth from "./ClassificationAHealth";
import ClassificationASafeguarding from "./ClassificationASafeguarding";
import ClassificationAEquipment from "./ClassificationAEquipment";
import ClassificationASocialMedia from "./ClassificationASocialMedia";
import ClassificationBLeadership from "./ClassificationBLeadership";
import ClassificationBPlanning from "./ClassificationBPlanning";
import ClassificationBOrganization from "./ClassificationBOrganization";
import ClassificationBTechnical from "./ClassificationBTechnical";
import ClassificationBFacilities from "./ClassificationBFacilities";
import ClassificationBSafeguarding from "./ClassificationBSafeguarding";
import ClassificationBEquipment from "./ClassificationBEquipment";

import AcademyRegistry from "./AcademyRegistry";
import Standards from "./Standards";
import FAQ from "./FAQ";
import Contact from "./Contact";
import Profile from "./Profile";
import AdminDashboard from "./AdminDashboard";
import AdminReviewPanel from "./components/AdminReviewPanel";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F1E7]">
        <div className="w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F1E7]">
        <div className="w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!isAdmin && user.email !== 'grassroots@the-lfa.com.lb' && user.email !== 'constitutionoflife@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F1E7]">
        <div className="w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user) {
    if (isAdmin || user.email === 'grassroots@the-lfa.com.lb' || user.email === 'constitutionoflife@gmail.com') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      <AdminReviewPanel />
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        
        <Route path="/signup" element={
          <GuestGuard>
            <PageWrapper><SignupPage /></PageWrapper>
          </GuestGuard>
        } />
        
        <Route path="/signin" element={
          <GuestGuard>
            <PageWrapper><SigninPage /></PageWrapper>
          </GuestGuard>
        } />

        <Route path="/academy-profile" element={<PageWrapper><AcademyProfilePage /></PageWrapper>} />
 
        <Route path="/verify-email" element={<PageWrapper><VerifyEmailPage /></PageWrapper>} />
        
        <Route path="/dashboard" element={
          <AuthGuard>
            <PageWrapper><AcademyDashboard /></PageWrapper>
          </AuthGuard>
        } />

        <Route path="/academy-registry" element={
          <AuthGuard>
            <PageWrapper><AcademyRegistry /></PageWrapper>
          </AuthGuard>
        } />

        <Route path="/standards" element={<PageWrapper><Standards /></PageWrapper>} />
        <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
        
        <Route path="/profile" element={
          <AuthGuard>
            <PageWrapper><Profile /></PageWrapper>
          </AuthGuard>
        } />

        <Route path="/admin/*" element={
          <AdminGuard>
            <PageWrapper><AdminDashboard /></PageWrapper>
          </AdminGuard>
        } />

        <Route path="/classification/a/leadership" element={<AuthGuard><PageWrapper><ClassificationALeadership /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/planning" element={<AuthGuard><PageWrapper><ClassificationAPlanning /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/organization" element={<AuthGuard><PageWrapper><ClassificationAOrganization /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/technical" element={<AuthGuard><PageWrapper><ClassificationATechnical /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/budget" element={<AuthGuard><PageWrapper><ClassificationABudget /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/facilities" element={<AuthGuard><PageWrapper><ClassificationAFacilities /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/health" element={<AuthGuard><PageWrapper><ClassificationAHealth /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/safeguarding" element={<AuthGuard><PageWrapper><ClassificationASafeguarding /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/equipment" element={<AuthGuard><PageWrapper><ClassificationAEquipment /></PageWrapper></AuthGuard>} />
        <Route path="/classification/a/social-media" element={<AuthGuard><PageWrapper><ClassificationASocialMedia /></PageWrapper></AuthGuard>} />
        
        <Route path="/classification/b/leadership" element={<AuthGuard><PageWrapper><ClassificationBLeadership /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/planning" element={<AuthGuard><PageWrapper><ClassificationBPlanning /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/organization" element={<AuthGuard><PageWrapper><ClassificationBOrganization /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/technical" element={<AuthGuard><PageWrapper><ClassificationBTechnical /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/facilities" element={<AuthGuard><PageWrapper><ClassificationBFacilities /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/safeguarding" element={<AuthGuard><PageWrapper><ClassificationBSafeguarding /></PageWrapper></AuthGuard>} />
        <Route path="/classification/b/equipment" element={<AuthGuard><PageWrapper><ClassificationBEquipment /></PageWrapper></AuthGuard>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}
