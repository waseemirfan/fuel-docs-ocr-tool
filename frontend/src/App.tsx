import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import UploadPage from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import ReviewPage from "./pages/Review";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/fuel-docs-ocr-tool">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/review/:id" element={<ReviewPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
