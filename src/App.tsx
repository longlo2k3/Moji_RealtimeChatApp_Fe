import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import {
  messaging,
  onMessage,
  requestPermissionAndGetToken,
} from "./services/FCM/firebase";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);

  useEffect(() => {
    requestPermissionAndGetToken();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* protectect routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatAppPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
