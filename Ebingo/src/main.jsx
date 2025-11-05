import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { SelectedOptionProvider } from "./context/OptionContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SnackbarProvider>
      <SelectedOptionProvider>
        <App />
      </SelectedOptionProvider>
    </SnackbarProvider>
  </BrowserRouter>
);
