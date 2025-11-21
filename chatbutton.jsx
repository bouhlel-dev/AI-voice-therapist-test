import { FaRobot } from "react-icons/fa";

const ChatButton = ({ onClick }) => {
  const buttonStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: 'linear-gradient(to right, #3B82F6, #9333EA)',
    color: 'white',
    padding: '16px',
    borderRadius: '50%',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  return (
    <button onClick={onClick} style={buttonStyle}>
      <FaRobot size={24} />
    </button>
  );
};

export default ChatButton;