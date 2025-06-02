  import { useDarkMode } from "../../contexts/DarkModeContext";

  const FeatureCard = ({ imgSrc, imgAlt, title, description, benefits }) => {
    const { darkMode } = useDarkMode();
    
    return (
      <div className={`feature-card ${darkMode ? "dark-mode" : ""}`}>
        <div className="feature-card-image">
          <img src={imgSrc} alt={imgAlt} className="feature-image" />
        </div>
        <div className="feature-card-content">
          <h3 className="feature-card-title">{title}</h3>
          <p className="feature-card-description">{description}</p>
          
          {benefits && (
            <div className="feature-card-benefits">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <div className="benefit-icon">✓</div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  export default FeatureCard;