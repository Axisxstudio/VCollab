import AppRouter from "./router/AppRouter";
import { Toaster } from "react-hot-toast";
import FeedbackWidget from "./components/feedback/FeedbackWidget";

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" />
      <FeedbackWidget />
    </>
  );
}
