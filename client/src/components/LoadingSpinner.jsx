import logoBook from '../assets/logoBook.png';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <img src={logoBook} alt="Loading..." className="loading-logo" />
    </div>
  );
};

export default LoadingSpinner;