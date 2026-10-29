import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import WorkersPage from "./pages/WorkersPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import WorkerProfilePage from "./pages/WorkerProfilePage";
import ChatPage from "./pages/ChatPage";
import CreateJobPage from "./pages/CreateJobPage";
import CabinetRedirectPage from "./pages/CabinetRedirectPage";
import CustomerCabinetPage from "./pages/CustomerCabinetPage";
import WorkerCabinetPage from "./pages/WorkerCabinetPage";
import AdminCabinetPage from "./pages/AdminCabinetPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobId" element={<JobDetailsPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="workers/:workerId" element={<WorkerProfilePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <ProtectedRoute>
              <SubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="jobs/new"
          element={
            <ProtectedRoute allowedRoles={["customer", "admin"]}>
              <CreateJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cabinet"
          element={
            <ProtectedRoute>
              <CabinetRedirectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cabinet/customer"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerCabinetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cabinet/worker"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerCabinetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cabinet/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCabinetPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
