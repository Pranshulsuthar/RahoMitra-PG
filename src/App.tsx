import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { Home } from './pages/Home'
import { ExplorePGs } from './pages/ExplorePGs'
import { PGDetails } from './pages/PGDetails'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { Terms } from './pages/Terms'
import { NotFound } from './pages/NotFound'

// Authentication & Route Security
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicAuthRoute } from './components/auth/ProtectedRoute'

// Section 02 — authentication pages
import { AuthLanding } from './pages/auth/AuthLanding'
import { StudentSignup } from './pages/auth/StudentSignup'
import { OwnerSignup } from './pages/auth/OwnerSignup'
import { RoleLogin } from './pages/auth/RoleLogin'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'

// Section 03 — Super Admin dashboard
import { AdminStoreProvider } from './context/AdminStore'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { PlatformOverview } from './pages/admin/PlatformOverview'
import { PGManagement } from './pages/admin/PGManagement'
import { OwnerApplications } from './pages/admin/OwnerApplications'
import { OwnerManagement } from './pages/admin/OwnerManagement'
import { StudentManagement } from './pages/admin/StudentManagement'
import { SubscriptionPlans } from './pages/admin/SubscriptionPlans'
import { Subscriptions } from './pages/admin/Subscriptions'
import { PaymentRecords } from './pages/admin/PaymentRecords'
import { FeaturedListings } from './pages/admin/FeaturedListings'
import { Advertisements } from './pages/admin/Advertisements'
import { Support } from './pages/admin/Support'
import { PlatformSupport } from './pages/admin/PlatformSupport'
import { Notifications } from './pages/admin/Notifications'
import { Reports } from './pages/admin/Reports'
import { PlatformReports } from './pages/admin/PlatformReports'
import { ActivityLogs } from './pages/admin/ActivityLogs'
import { AdminSettings } from './pages/admin/Settings'

// Section 04 — PG Owner dashboard
import { OwnerLayout } from './components/owner/OwnerLayout'
import { OwnerDashboard } from './pages/owner/OwnerDashboard'
import { Properties } from './pages/owner/Properties'
import { PropertyDetail } from './pages/owner/PropertyDetail'
import { PropertyEdit } from './pages/owner/PropertyEdit'
import { Rooms } from './pages/owner/Rooms'
import { Students } from './pages/owner/Students'
import { Admissions } from './pages/owner/Admissions'
import { Staff } from './pages/owner/Staff'
import { Availability } from './pages/owner/Availability'
import { OwnerProfile } from './pages/owner/OwnerProfile'
import { OwnerSettings } from './pages/owner/OwnerSettings'
import { OwnerSubscription } from './pages/owner/OwnerSubscription'

// Section 05 — Student dashboard
import { StudentLayout } from './components/student/StudentLayout'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { MyAccommodation } from './pages/student/MyAccommodation'
import { MyRoom } from './pages/student/MyRoom'
import { StudentProfile } from './pages/student/StudentProfile'
import { Notices } from './pages/student/Notices'
import { StudentSupport } from './pages/student/StudentSupport'
import { StudentSettings } from './pages/student/StudentSettings'

// Section 06 — Billing & Payments (shared owner + student demo store)
import { BillingStoreProvider } from './context/BillingStore'
import { OwnerBilling } from './pages/owner/OwnerBilling'
import { StudentBilling } from './pages/student/StudentBilling'

// Section 07 — Communication & Complaints (shared owner + student demo store)
import { CommunicationStoreProvider } from './context/CommunicationStore'
import { OwnerCommunication } from './pages/owner/OwnerCommunication'
import { OwnerComplaints } from './pages/owner/OwnerComplaints'
import { OwnerAnnouncements } from './pages/owner/OwnerAnnouncements'
import { StudentMessages } from './pages/student/StudentMessages'
import { StudentComplaints } from './pages/student/StudentComplaints'

export default function App() {
  return (
    <AuthProvider>
      <AdminStoreProvider>
        <BillingStoreProvider>
          <CommunicationStoreProvider>
            <Routes>
              {/* ------------------------------------------- Section 01: public site */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<ExplorePGs />} />
                <Route path="/pg/:slug" element={<PGDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Legacy entry points */}
                <Route path="/owner/register" element={<Navigate to="/signup/owner" replace />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ----------------------------------------- Section 02: authentication */}
              <Route
                path="/auth"
                element={
                  <PublicAuthRoute>
                    <AuthLanding />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/signup/student"
                element={
                  <PublicAuthRoute>
                    <StudentSignup />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/signup/owner"
                element={
                  <PublicAuthRoute>
                    <OwnerSignup />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/login/student"
                element={
                  <PublicAuthRoute>
                    <RoleLogin role="student" />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/login/owner"
                element={
                  <PublicAuthRoute>
                    <RoleLogin role="owner" />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/login/admin"
                element={
                  <PublicAuthRoute>
                    <RoleLogin role="admin" />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicAuthRoute>
                    <ForgotPassword />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicAuthRoute>
                    <ResetPassword />
                  </PublicAuthRoute>
                }
              />

              {/* -------------------------------------- Section 04: PG Owner console */}
              <Route
                path="/owner"
                element={
                  <ProtectedRoute allowedRole="owner">
                    <OwnerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/owner/dashboard" replace />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="properties" element={<Properties />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="properties/:id/edit" element={<PropertyEdit />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="students" element={<Students />} />
                <Route path="admissions" element={<Admissions />} />
                <Route path="staff" element={<Staff />} />
                <Route path="availability" element={<Availability />} />
                <Route path="billing" element={<OwnerBilling />} />
                <Route path="communication" element={<OwnerCommunication />} />
                <Route path="complaints" element={<OwnerComplaints />} />
                <Route path="announcements" element={<OwnerAnnouncements />} />
                <Route path="profile" element={<OwnerProfile />} />
                <Route path="settings" element={<OwnerSettings />} />
                <Route path="subscription" element={<OwnerSubscription />} />
                <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
              </Route>

              {/* ------------------------------------- Section 03: Super Admin panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="platform" element={<PlatformOverview />} />
                <Route path="pgs" element={<PGManagement />} />
                <Route path="applications" element={<OwnerApplications />} />
                <Route path="owners" element={<OwnerManagement />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="plans" element={<SubscriptionPlans />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="payments" element={<PaymentRecords />} />
                <Route path="featured-listings" element={<FeaturedListings />} />
                <Route path="advertisements" element={<Advertisements />} />
                <Route path="support" element={<Support />} />
                <Route path="platform-support" element={<PlatformSupport />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reports" element={<Reports />} />
                <Route path="platform-reports" element={<PlatformReports />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>

              {/* --------------------------------------- Section 05: Student console */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="accommodation" element={<MyAccommodation />} />
                <Route path="room" element={<MyRoom />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="notices" element={<Notices />} />
                <Route path="messages" element={<StudentMessages />} />
                <Route path="complaints" element={<StudentComplaints />} />
                <Route path="billing" element={<StudentBilling />} />
                <Route path="support" element={<StudentSupport />} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Route>
            </Routes>
          </CommunicationStoreProvider>
        </BillingStoreProvider>
      </AdminStoreProvider>
    </AuthProvider>
  )
}
