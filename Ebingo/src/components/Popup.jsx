import PropTypes from "prop-types";

const Popup = ({ children, onClose }) => {
  return (
    <div style={overlayStyles}>
      <div className="w-11/12">
        <button
          onClick={onClose}
          className="bg-red-600 text-white border-none py-1 px-3 rounded-md absolute top-4 left-4"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
};

// Styles for the popup
const overlayStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

Popup.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Popup;
