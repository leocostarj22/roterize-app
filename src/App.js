import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import './App.css';
import { LoadScript, Autocomplete, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import roterizelogo from './roterize.png';

const libraries = ['places'];

function App() {
  const [input, setInput] = useState('');
  const [places, setPlaces] = useState([]);
  const [mode, setMode] = useState('WALKING');
  const [autocomplete, setAutocomplete] = useState(null);
  const [directions, setDirections] = useState(null);
  const [steps, setSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = () => {
    // Força uma re-renderização após mudanças de autenticação
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login user={user} onAuthChange={handleAuthChange} />;
  }

  const handleAddPlace = () => {
    if (input.trim()) {
      setPlaces([...places, input]);
      setInput('');
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
            <button className="back-btn"onClick={handleLogout} title="Sair">←</button>
            <img src={roterizelogo} alt="Roterize" className="logo-image" />
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
            
            <div className="input-container">
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={() => {
                  if (autocomplete !== null) {
                    const place = autocomplete.getPlace();
                    if (place && (place.formatted_address || place.name)) {
                      setInput(place.formatted_address || place.name);
                    }
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Insira um local"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="input-local"
                  autoComplete="off"
                />
              </Autocomplete>
              <div className="location-icon">📍</div>
            </div>
            
            <button onClick={handleAddPlace} className="btn-gerar-roteiro">Adicionar Local</button>
          </div>

          {places.length > 0 && (
            <div className="locais-box">
              <h4>Locais Adicionados:</h4>
              {places.map((place, idx) => (
                <div key={idx} className="local-item">
                  <span>{place}</span>
                  <button
                    className="btn-remover"
                    onClick={() => handleRemovePlace(idx)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="routes-section">
            <div className="routes-header">
              <h3>Modo de Viagem</h3>
            </div>
            
            <div className="transport-tabs">
              <button 
                className={`transport-tab ${mode === 'WALKING' ? 'active' : ''}`}
                onClick={() => setMode('WALKING')}
              >
                🚶 A pé
              </button>
              <button 
                className={`transport-tab ${mode === 'DRIVING' ? 'active' : ''}`}
                onClick={() => setMode('DRIVING')}
              >
                🚗 Carro
              </button>
            </div>
            
            <button onClick={handleGenerateRoute} className="btn-gerar-roteiro">
              Gerar Roteiro Otimizado
            </button>
          </div>

          {directions && (
            <div className="routes-section">
              <h3>Mapa do Roteiro</h3>
              <div className="mapa-container">
                <GoogleMap
                  mapContainerStyle={{ height: '300px', width: '100%' }}
                  zoom={13}
                  center={{
                    lat: directions.routes[0].legs[0].start_location.lat(),
                    lng: directions.routes[0].legs[0].start_location.lng(),
                  }}
                >
                  <DirectionsRenderer directions={directions} />
                </GoogleMap>
              </div>
              
              <h4>Resumo do Roteiro</h4>
              {steps.map((step, idx) => (
                <div key={idx} className="route-item">
                  <div className="route-icon">{idx + 1}</div>
                  <div className="route-details">
                    <div className="route-number">{step.start} → {step.end}</div>
                    <div className="route-time">Tempo: {step.duration}</div>
                    <div className="route-departure">Distância: {step.distance}</div>
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
