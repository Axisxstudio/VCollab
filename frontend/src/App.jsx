import AppRouter from "./router/AppRouter";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" />
    </>
  );
}
