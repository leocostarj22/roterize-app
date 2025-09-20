import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import './App.css';
import { LoadScript, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import roterizelogo from './roterize.png';

const libraries = ['places'];

function App() {
  const [input, setInput] = useState('');
  const [places, setPlaces] = useState([]);
  const [mode, setMode] = useState('WALKING');
  const [directions, setDirections] = useState(null);
  const [steps, setSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Estado de autenticação mudou:', currentUser?.email || 'Nenhum usuário');
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função para buscar sugestões usando Places API diretamente
  const searchPlaces = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        
        service.getPlacePredictions(
          {
            input: query,
            types: ['establishment', 'geocode']
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions.slice(0, 5));
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce para evitar muitas chamadas à API
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(input);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input]);

  // Mostrar tela de loading
  if (loading) {
    return (
      <div className="loading-container">
        <div>Carregando...</div>
      </div>
    );
  }

  // Mostrar tela de login se não estiver autenticado
  if (!user) {
    return <Login />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddPlace = () => {
    if (input.trim()) {
      setPlaces([...places, input]);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleRemovePlace = (index) => {
    setPlaces(places.filter((_, i) => i !== index));
  };

  const handleGenerateRoute = () => {
    if (places.length < 2) {
      alert('Adicione pelo menos 2 locais para gerar um roteiro.');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: places[0],
        destination: places[places.length - 1],
        waypoints: places.slice(1, -1).map(place => ({ location: place, stopover: true })),
        travelMode: mode,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          const route = result.routes[0];
          setSteps(route.legs.map((leg) => ({
            start: leg.start_address,
            end: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text,
          })));
        } else {
          alert('Não foi possível gerar o roteiro. Verifique se os endereços são válidos.');
        }
      }
    );
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyAXh77iqGaYjKccJPfQEFbYEBN6EpKSFCM"
      libraries={libraries}
    >
      <div className="app-container">
        <div className="header">
          <div className="header-left">
            <button className="back-btn" onClick={handleLogout} title="Sair">←</button>
            <img src={roterizelogo} alt="Roterize" className="logomarca" />
          </div>
          <div className="header-right">
            <button className="notification-btn">🔔</button>
          </div>
        </div>

        <div className="main-content">
          <div className="location-card">
            <div className="location-header">
              <h3 className="location-title">Adicionar Locais</h3>
              <button className="filter-btn">Filtros</button>
            </div>
            
            <div className="input-container" style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Insira um local"
                value={input}
                onChange={handleInputChange}
                className="input-local"
                autoComplete="off"
                onFocus={() => input.length >= 3 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <div className="location-icon">📍</div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">{suggestion.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button onClick={handleAddPlace} className="btn-gerar-roteiro">Adicionar Local</button>
          </div>

          {places.length > 0 && (
            <div className="locais-box">
              <h4>Locais Adicionados:</h4>
              {places.map((place, idx) => (
                <div key={idx} className="local-item">
                  <span>{place}</span>
                  <button onClick={() => handleRemovePlace(idx)} className="remove-btn">×</button>
                </div>
              ))}
            </div>
          )}

          {places.length >= 2 && (
            <div className="route-options">
              <h4>Opções de Roteiro:</h4>
              <div className="mode-selector">
                <label>
                  <input
                    type="radio"
                    value="WALKING"
                    checked={mode === 'WALKING'}
                    onChange={e => setMode(e.target.value)}
                  />
                  🚶 Caminhada
                </label>
                <label>
                  <input
                    type="radio"
                    value="DRIVING"
                    checked={mode === 'DRIVING'}
                    onChange={e => setMode(e.target.value)}
                  />
                  🚗 Carro
                </label>
                <label>
                  <input
                    type="radio"
                    value="TRANSIT"
                    checked={mode === 'TRANSIT'}
                    onChange={e => setMode(e.target.value)}
                  />
                  🚌 Transporte Público
                </label>
              </div>
              <button onClick={handleGenerateRoute} className="btn-gerar-roteiro">
                Gerar Roteiro
              </button>
            </div>
          )}

          {directions && (
            <div className="map-container">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '400px' }}
                center={{ lat: -14.235, lng: -51.9253 }}
                zoom={5}
              >
                <DirectionsRenderer directions={directions} />
              </GoogleMap>
            </div>
          )}

          {steps.length > 0 && (
            <div className="steps-container">
              <h4>Roteiro Detalhado:</h4>
              {steps.map((step, idx) => (
                <div key={idx} className="step-item">
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-details">
                    <div className="step-route">
                      <strong>De:</strong> {step.start} <br />
                      <strong>Para:</strong> {step.end}
                    </div>
                    <div className="step-info">
                      <span className="distance">📏 {step.distance}</span>
                      <span className="duration">⏱️ {step.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LoadScript>
  );
}

export default App;
