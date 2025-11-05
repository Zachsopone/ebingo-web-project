import { createContext, useState } from "react";
import PropTypes from "prop-types";

export const SelectedOptionContext = createContext();

export const SelectedOptionProvider = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState("");

  return (
    <SelectedOptionContext.Provider
      value={{ selectedOption, setSelectedOption }}
    >
      {children}
    </SelectedOptionContext.Provider>
  );
};

SelectedOptionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};