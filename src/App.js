import React, { useState } from 'react';
import { LoadScript, Autocomplete, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import './App.css';
import roterizelogo from './roterize.png';

const libraries = ['places'];

function App() {
  const [input, setInput] = useState('');
  const [places, setPlaces] = useState([]);
  const [mode, setMode] = useState('WALKING');
  const [autocomplete, setAutocomplete] = useState(null);
  const [directions, setDirections] = useState(null);
  const [steps, setSteps] = useState([]);

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
            <button className="back-btn">←</button>
            <img src={roterizelogo} alt="Roterize" className="logo-image" />
          </div>
          <button className="notification-btn">🔔</button>
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
                    Remover
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
