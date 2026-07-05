import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/Toast";
import { RequireAuth } from "./components/ui/RequireAuth";
import { AppShell } from "./components/ui/AppShell";
import { LoginPage } from "./routes/LoginPage";
import { SignupPage } from "./routes/SignupPage";
import { DashboardPage } from "./routes/DashboardPage";
import { CreateRacePage } from "./routes/CreateRacePage";
import { RaceLobbyPage } from "./routes/RaceLobbyPage";
import { LiveRacePage } from "./routes/LiveRacePage";
import { RaceResultsPage } from "./routes/RaceResultsPage";
import { RaceHistoryPage } from "./routes/RaceHistoryPage";
import { ProfilePage } from "./routes/ProfilePage";
import { JoinRacePage } from "./routes/JoinRacePage";
import { GaragePage } from "./routes/GaragePage";
import { CarFormPage } from "./routes/CarFormPage";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/join/:raceId" element={<JoinRacePage />} />
            <Route element={<RequireAuth />}>
              {/* Full-screen focused flows: no bottom tab bar */}
              <Route path="/races/:raceId/lobby" element={<RaceLobbyPage />} />
              <Route path="/races/:raceId/live" element={<LiveRacePage />} />
              <Route path="/races/:raceId/results" element={<RaceResultsPage />} />
              <Route path="/garage" element={<GaragePage />} />
              <Route path="/garage/new" element={<CarFormPage />} />
              <Route path="/garage/:carId" element={<CarFormPage />} />

              {/* Main tabs: shell with bottom nav */}
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/races/new" element={<CreateRacePage />} />
                <Route path="/history" element={<RaceHistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
