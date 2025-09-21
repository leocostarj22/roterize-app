import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserRoutes, saveRoute, deleteRoute, updateRoute } from './firebase';
import Login from './Login';
import UserProfile from './UserProfile';
import AddPlace from './AddPlace';
import AddTip from './AddTip';
import '../css/App.css';
import { LoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import roterizelogo from '../img/roterize.png';

const libraries = ['places'];

function App() {
  const [input, setInput] = useState('');
  const [places, setPlaces] = useState([]);
  const [mode, setMode] = useState('WALKING');
  const [directions, setDirections] = useState(null);
  const [steps, setSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState('new'); // 'new', 'update', 'choose'
  const [currentRouteId, setCurrentRouteId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showAddTip, setShowAddTip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
    // Estados para opções expandidas de roteiros
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  // Estados para o mapa com localização atual
  const [mapCenter, setMapCenter] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisboa como padrão
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await loadUserRoutes(currentUser.uid);
        setUser(currentUser);
      } else {
        setUser(null);
        setSavedRoutes([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // useEffect para obter localização atual do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(location);
          setUserLocation(location);
        },
        (error) => {
          // Manter localização padrão (Lisboa)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  const loadUserRoutes = async (userId) => {
    try {
      setLoadingRoutes(true);
      const routes = await getUserRoutes(userId);
      setSavedRoutes(routes);
    } catch (error) {
      // Erro silencioso
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      alert('Por favor, digite um nome para o roteiro.');
      return;
    }

    if (!directions || places.length < 2) {
      alert('Gere um roteiro antes de salvá-lo.');
      return;
    }

    try {
      // Calcular distância e duração de forma mais segura
      let totalDistance = 0;
      let totalDuration = 0;
      
      if (steps && steps.length > 0) {
        steps.forEach((step) => {
          // Extrair distância de forma mais robusta
          if (step.distance) {
            const distanceMatch = step.distance.match(/([\d,.]+)/);
            if (distanceMatch) {
              const distance = parseFloat(distanceMatch[1].replace(',', '.'));
              if (!isNaN(distance)) {
                totalDistance += distance;
              }
            }
          }
          
          // Extrair duração de forma mais robusta
          if (step.duration) {
            const durationMatch = step.duration.match(/(\d+)/);
            if (durationMatch) {
              const duration = parseInt(durationMatch[1]);
              if (!isNaN(duration)) {
                totalDuration += duration;
              }
            }
          }
        });
      }
      
      const routeData = {
        name: routeName.trim(),
        places: places,
        travelMode: mode,
        steps: steps,
        directions: directions,
        mapCenter: mapCenter,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      };
      
      let routeId;
      
      if (currentRouteId && saveMode === 'update') {
        await updateRoute(currentRouteId, routeData);
        routeId = currentRouteId;
        alert('✅ Roteiro atualizado com sucesso!');
      } else {
        routeId = await saveRoute(user.uid, routeData);
        
        if (saveMode === 'new') {
          setCurrentRouteId(null);
        }
        
        alert('✅ Novo roteiro salvo com sucesso!');
      }
      
      await loadUserRoutes(user.uid);
      setShowSaveDialog(false);
      setSaveMode('new');
      
      if (saveMode === 'new') {
        setCurrentRouteId(routeId);
      }
      
    } catch (error) {
      alert(`❌ Erro ao salvar roteiro: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleLoadRoute = (route) => {
    setPlaces(route.places);
    setMode(route.travelMode);
    setCurrentRouteId(route.id); // Rastrear qual roteiro está carregado
    setRouteName(route.name); // Pré-preencher o nome
    setShowSavedRoutes(false);
    // Regenerar o roteiro com os dados salvos
    setTimeout(() => {
      handleGenerateRoute();
    }, 100);
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      await deleteRoute(routeId);
      await loadUserRoutes(user.uid);
      alert('Roteiro deletado com sucesso!');
    } catch (error) {
      alert('Erro ao deletar roteiro: ' + error.message);
    }
  };

  // Função para gerar texto do roteiro para exportação
  const generateRouteText = (route) => {
    let text = `🗺️ ${route.name}\n\n`;
    text += `📍 Locais (${route.places?.length || 0}):\n`;
    
    if (route.places) {
      route.places.forEach((place, index) => {
        text += `${index + 1}. ${place}\n`;
      });
    }
    
    text += `\n🚗 Modo de transporte: ${route.travelMode}\n`;
    
    if (route.totalDistance) {
      text += `📏 Distância total: ${route.totalDistance}\n`;
    }
    
    if (route.totalDuration) {
      text += `⏱️ Tempo estimado: ${route.totalDuration} min\n`;
    }
    
    if (route.steps && route.steps.length > 0) {
      text += `\n📋 Roteiro Detalhado:\n`;
      route.steps.forEach((step, index) => {
        // Usar diferentes fontes para os nomes dos locais
        const startName = step.startName || 
                         (route.places && route.places[index]) || 
                         (step.start && step.start.split(',')[0]) || 
                         'Local não identificado';
        
        const endName = step.endName || 
                       (route.places && route.places[index + 1]) || 
                       (step.end && step.end.split(',')[0]) || 
                       'Local não identificado';
        
        text += `\n${index + 1}. ${startName} → ${endName}\n`;
        text += `   📏 ${step.distance || 'N/A'} • ⏱️ ${step.duration || 'N/A'}\n`;
        
        // Adicionar endereços completos se disponíveis
        if (step.start && step.end) {
          text += `   📍 De: ${step.start}\n`;
          text += `   🎯 Para: ${step.end}\n`;
        }
      });
    }
    
    text += `\n📅 Criado em: ${route.createdAt ? new Date(route.createdAt.seconds * 1000).toLocaleDateString() : 'Data não disponível'}`;
    text += `\n\n🌟 Gerado pelo Roterize`;
    
    return text;
  };

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPlaces([]);
      setDirections(null);
      setSteps([]);
      setSavedRoutes([]);
      setShowMenu(false);
      setShowSavedRoutes(false);
    } catch (error) {
      alert('Erro ao fazer logout: ' + error.message);
    }
  };

  // Função para mudanças no input de busca
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Buscar sugestões se o input tiver 2+ caracteres
    if (value.length >= 2) {
      searchPlaces(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Função para buscar locais (Places API)
  const searchPlaces = (searchText) => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API não carregada');
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: searchText,
        // Remover ou comentar a linha abaixo para permitir buscas globais
        // componentRestrictions: { country: 'br' },
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
  };

  // Função para cliques nas sugestões
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Função para adicionar local
  const handleAddPlace = () => {
    if (input.trim() && !places.includes(input.trim())) {
      setPlaces([...places, input.trim()]);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Função para remover local
  const handleRemovePlace = (index) => {
    const newPlaces = places.filter((_, i) => i !== index);
    setPlaces(newPlaces);
    
    // Limpar direções se restarem menos de 2 locais
    if (newPlaces.length < 2) {
      setDirections(null);
      setSteps([]);
    }
  };

  // Função para gerar roteiro
  const handleGenerateRoute = () => {
    const validPlaces = places.filter(place => place.trim() !== '');
    
    if (validPlaces.length < 2) {
      alert('Por favor, adicione pelo menos 2 locais para gerar o roteiro.');
      return;
    }

    if (!window.google || !window.google.maps) {
      alert('Google Maps não está carregado. Tente novamente.');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    // Configurar waypoints (locais intermediários)
    const origin = validPlaces[0];
    const destination = validPlaces[validPlaces.length - 1];
    const waypoints = validPlaces.slice(1, -1).map(place => ({
      location: place,
      stopover: true
    }));

    const request = {
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode[mode],
      optimizeWaypoints: true,
      avoidHighways: false,
      avoidTolls: false,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      provideRouteAlternatives: false
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        
        // Ajustar o mapa para mostrar toda a rota
        const bounds = new window.google.maps.LatLngBounds();
        const route = result.routes[0];
        
        // Adicionar todos os pontos da rota aos bounds
        route.legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        
        // Calcular centro e zoom apropriados
        const center = bounds.getCenter();
        setMapCenter({
          lat: center.lat(),
          lng: center.lng()
        });
        
        // Extrair passos detalhados com informações de otimização
        const legs = route.legs;
        const routeSteps = [];
        let totalDistance = 0;
        let totalDuration = 0;
        
        legs.forEach((leg, index) => {
          // Somar distâncias e tempos totais
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
          
          // Extrair nome do local do endereço (primeira parte antes da vírgula)
          const startName = validPlaces[index] || leg.start_address.split(',')[0];
          const endName = validPlaces[index + 1] || leg.end_address.split(',')[0];
          
          routeSteps.push({
            stepNumber: index + 1,
            startName: startName,
            endName: endName,
            start: leg.start_address,
            end: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text,
            distanceValue: leg.distance.value,
            durationValue: leg.duration.value
          });
        });
        
        setSteps(routeSteps);
      } else {
        let errorMessage = 'Erro ao gerar roteiro. ';
        
        switch(status) {
          case 'NOT_FOUND':
            errorMessage += 'Um ou mais locais não foram encontrados.';
            break;
          case 'ZERO_RESULTS':
            errorMessage += 'Não foi possível encontrar uma rota entre os locais.';
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage += 'Limite de consultas excedido. Tente novamente mais tarde.';
            break;
          case 'REQUEST_DENIED':
            errorMessage += 'Solicitação negada.';
            break;
          default:
            errorMessage += 'Erro desconhecido.';
        }
        
        alert(errorMessage);
      }
    });
  };

  // Função de teste da base de dados - temporariamente suspensa
  /*
  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 TESTE: Testando conexão com Firebase...');
      
      // Verificar se o usuário está logado
      if (!user) {
        console.error('🧪 TESTE: Usuário não está logado!');
        alert('❌ Erro: Você precisa estar logado para testar a conexão!');
        return;
      }
      
      console.log('🧪 TESTE: Usuário logado:', user.uid);
      console.log('🧪 TESTE: Email do usuário:', user.email);
      // Teste 2: Tentar salvar um documento de teste
      const testData = {
        name: 'Teste de Conexão',
        places: ['Local Teste 1', 'Local Teste 2'],
        travelMode: 'DRIVING',
        steps: [],
        totalDistance: 0,
        totalDuration: 0,
        isTest: true
      };
      
      console.log('🧪 TESTE: Salvando documento de teste...');
      const testId = await saveRoute(user.uid, testData);
      console.log('🧪 TESTE: Documento de teste salvo com ID:', testId);
      
      // Teste 3: Tentar carregar roteiros
      console.log('🧪 TESTE: Carregando roteiros do usuário...');
      const routes = await getUserRoutes(user.uid);
      console.log('🧪 TESTE: Roteiros carregados:', routes.length);
      
      // Teste 4: Deletar documento de teste
      console.log('🧪 TESTE: Deletando documento de teste...');
      await deleteRoute(testId);
      console.log('🧪 TESTE: Documento de teste deletado');
      
      alert('✅ Teste de conexão com Firebase: SUCESSO!\n\nTodos os testes passaram. A base de dados está funcionando corretamente.');
    } catch (error) {
      console.error('🧪 TESTE: Erro durante o teste:', error);
      alert('❌ Erro no teste de conexão: ' + error.message);
    }
  };
  */

  return (
    <>
      {authLoading ? (
        <div className="loading-screen">
          <div className="loading-content">
            <img src={roterizelogo} alt="Roterize" className="loading-logo" />
            <div className="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        </div>
      ) : !user ? (
        <Login />
      ) : (
        <LoadScript
          googleMapsApiKey="AIzaSyAXh77iqGaYjKccJPfQEFbYEBN6EpKSFCM"
          libraries={libraries}
        >
          {showAddTip ? (
            <AddTip onClose={() => setShowAddTip(false)} />
          ) : (
            <div className="app-container">
              <div className="header">
                <div className="header-left">
                  <img src={roterizelogo} alt="Roterize" className="logomarca" />
                </div>
                <div className="header-right">
                  <button 
                    onClick={() => setShowProfile(true)} 
                    className="profile-btn"
                    title="Meu Perfil"
                  >
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Foto do perfil" 
                        className="profile-photo-small"
                      />
                    ) : (
                      <div className="profile-initial">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </div>
                    )}
                  </button>
                  
                  <div className="menu-container">
                    <button 
                      onClick={() => setShowMenu(!showMenu)} 
                      className="menu-btn"
                      title="Menu"
                    >
                      ☰
                    </button>
                    
                    {showMenu && (
                      <div className="dropdown-menu">
                        <button 
                          className="menu-item"
                          onClick={async () => {
                            console.log('🔍 BOTÃO: Forçando recarregamento de roteiros');
                            if (user) {
                              console.log('🔍 BOTÃO: user.uid:', user.uid);
                              await loadUserRoutes(user.uid);
                            }
                            setShowSavedRoutes(!showSavedRoutes);
                            setShowMenu(false);
                          }}
                        >
                          📁 Roteiros Salvos
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            setShowAddTip(true);
                            setShowMenu(false);
                          }}
                        >
                          💡 Compartilhar Dica
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            alert('Funcionalidade de notificações em desenvolvimento');
                            setShowMenu(false);
                          }}
                        >
                          🔔 Notificações
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            alert('Funcionalidade de configurações em desenvolvimento');
                            setShowMenu(false);
                          }}
                        >
                          ⚙️ Configurações
                        </button>
                        <div className="menu-divider"></div>
                        <button 
                          className="menu-item logout-item"
                          onClick={handleLogout}
                        >
                          🚪 Sair
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO PRINCIPAL DE CRIAÇÃO DE ROTEIROS - RESTAURADA */}
              <div className="main-content">
                <div className="route-builder">
                  <h3 style={{ marginBottom: '10px' }}>🗺️ Criar Rotas Rápidas</h3>
                  
                  <div className="input-section">
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
                        <label className="mode-option">
                          <input
                            type="radio"
                            value="WALKING"
                            checked={mode === 'WALKING'}
                            onChange={(e) => setMode(e.target.value)}
                          />
                          <span className="mode-icon">🚶</span>
                          <span className="mode-text">A pé</span>
                        </label>
                        <label className="mode-option">
                          <input
                            type="radio"
                            value="DRIVING"
                            checked={mode === 'DRIVING'}
                            onChange={(e) => setMode(e.target.value)}
                          />
                          <span className="mode-icon">🚗</span>
                          <span className="mode-text">Carro</span>
                        </label>
                      </div>
                      
                      <button onClick={handleGenerateRoute} className="btn-gerar-roteiro">
                        🗺️ Gerar Roteiro
                      </button>
                    </div>
                  )}
                </div>

                {/* MAPA com localização atual */}
                <div className="map-container">
                  <GoogleMap
                    mapContainerStyle={{ 
                      width: '100%', 
                      height: '100%'
                    }}
                    center={mapCenter}
                    zoom={directions ? 11 : 13}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,
                      gestureHandling: 'greedy',
                      disableDefaultUI: false,
                      clickableIcons: false,
                      styles: [
                        {
                          featureType: "poi",
                          elementType: "labels",
                          stylers: [{ visibility: "off" }]
                        }
                      ]
                    }}
                    onLoad={(map) => {
                      // Ajustar o mapa aos bounds quando há rota
                      if (directions && directions.routes && directions.routes[0]) {
                        const bounds = new window.google.maps.LatLngBounds();
                        directions.routes[0].legs.forEach(leg => {
                          bounds.extend(leg.start_location);
                          bounds.extend(leg.end_location);
                        });
                        map.fitBounds(bounds, { padding: 50 });
                      }
                    }}
                  >
                    {userLocation && (
                      <Marker 
                        position={userLocation}
                        icon={{
                          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                              <circle cx="12" cy="12" r="3" fill="white"/>
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(24, 24)
                        }}
                        title="Sua localização atual"
                      />
                    )}
                    {directions && (
                      <DirectionsRenderer 
                        directions={directions}
                        options={{
                          suppressMarkers: false,
                          polylineOptions: {
                            strokeColor: '#4285F4',
                            strokeWeight: 4,
                            strokeOpacity: 0.8
                          }
                        }}
                      />
                    )}
                  </GoogleMap>
                  <p className="map-location-info">
                    📍 {userLocation ? 'Sua localização atual' : 'Localização padrão (Lisboa)'}
                  </p>
                </div>

                {/* PASSOS DO ROTEIRO */}
                {steps.length > 0 && (
                  <div className="steps-container">
                    <div className="steps-header">
                      <h3>📋 Roteiro Detalhado:</h3>
                      <button onClick={() => setShowSaveDialog(true)} className="save-route-btn">
                        💾 Salvar Roteiro
                      </button>
                    </div>
                    {steps.map((step, index) => (
                      <div key={index} className="step-item">
                        <div className="step-number">{index + 1}</div>
                        <div className="step-details">
                          <div className="location-info">
                            <div className="location-block">
                              <span className="location-label">📍 Origem:</span>
                              <div className="location-name">{step.startName}</div>
                              <div className="location-address">{step.start}</div>
                            </div>
                            <div className="route-arrow">→</div>
                            <div className="location-block">
                              <span className="location-label">🎯 Destino:</span>
                              <div className="location-name">{step.endName}</div>
                              <div className="location-address">{step.end}</div>
                            </div>
                          </div>
                          <div className="route-stats">
                            <span className="stat-item">📏 {step.distance}</span>
                            <span className="stat-item">⏱️ {step.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showSavedRoutes && (
                <div className="saved-routes-panel">
                  <div className="saved-routes-header">
                    <h3>Roteiros Salvos</h3>
                    <button 
                      onClick={() => setShowSavedRoutes(false)}
                      className="close-panel-btn"
                      title="Fechar"
                    >
                      ✕
                    </button>
                  </div>
                  {loadingRoutes ? (
                    <p>🔄 Carregando roteiros...</p>
                  ) : savedRoutes.length === 0 ? (
                    <div>
                      <p>Nenhum roteiro salvo ainda.</p>
                    </div>
                  ) : (
                    <div>
                      <p>📊 {savedRoutes.length} roteiro(s) encontrado(s)</p>
                      {savedRoutes.map((route) => (
                        <div key={route.id} className="saved-route-item">
                          <div className="route-info">
                            <h4>{route.name}</h4>
                            <p>{route.places?.length || 0} locais • {route.travelMode}</p>
                            <div className="route-stats">
                              {route.totalDistance && <span>📏 {route.totalDistance}</span>}
                              {route.totalDuration && <span>⏱️ {route.totalDuration} min</span>}
                            </div>
                            <small>Criado em: {route.createdAt ? new Date(route.createdAt.seconds * 1000).toLocaleDateString() : 'Data não disponível'}</small>
                          </div>
                          <div className="route-actions">
                            <button 
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowRouteOptions(true);
                              }} 
                              className="options-btn"
                              title="Opções do Roteiro"
                            >
                              ⚙️
                            </button>
                            <button 
                              onClick={() => handleLoadRoute(route)} 
                              className="load-btn"
                              title="Carregar Roteiro"
                            >
                              📂
                            </button>
                            <button 
                              onClick={() => handleDeleteRoute(route.id)} 
                              className="delete-btn"
                              title="Excluir Roteiro"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showSaveDialog && (
                <div className="save-dialog-overlay">
                  <div className="save-dialog">
                    <h3>💾 Salvar Roteiro</h3>
                    
                    {currentRouteId ? (
                      <div className="save-options">
                        <p className="current-route-info">
                          📋 Roteiro atual: <strong>{routeName}</strong>
                        </p>
                        
                        <div className="save-mode-selection">
                          <label className="save-option">
                            <input
                              type="radio"
                              name="saveMode"
                              value="update"
                              checked={saveMode === 'update'}
                              onChange={(e) => setSaveMode(e.target.value)}
                            />
                            <div className="option-content">
                              <strong>🔄 Atualizar roteiro existente</strong>
                              <small>Substituir o roteiro "{routeName}" pelas alterações</small>
                            </div>
                          </label>
                          
                          <label className="save-option">
                            <input
                              type="radio"
                              name="saveMode"
                              value="new"
                              checked={saveMode === 'new'}
                              onChange={(e) => setSaveMode(e.target.value)}
                            />
                            <div className="option-content">
                              <strong>✨ Salvar como novo roteiro</strong>
                              <small>Criar um novo roteiro mantendo o original</small>
                            </div>
                          </label>
                        </div>
                        
                        {saveMode === 'new' && (
                          <input
                            type="text"
                            placeholder="Nome do novo roteiro"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="route-name-input"
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="new-route-info">✨ Criando novo roteiro</p>
                        <input
                          type="text"
                          placeholder="Nome do roteiro"
                          value={routeName}
                          onChange={(e) => setRouteName(e.target.value)}
                          className="route-name-input"
                        />
                      </div>
                    )}
                    
                    <div className="dialog-actions">
                      <button 
                        onClick={() => {
                          setShowSaveDialog(false);
                          setSaveMode('new');
                        }} 
                        className="cancel-btn"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveRoute} 
                        className="save-btn"
                        disabled={!routeName.trim()}
                      >
                        {currentRouteId && saveMode === 'update' ? '🔄 Atualizar' : '💾 Salvar Novo'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showProfile && (
                <UserProfile 
                  user={user} 
                  onClose={() => setShowProfile(false)} 
                />
              )}

              {showAddPlace && (
                <AddPlace 
                  onClose={() => setShowAddPlace(false)} 
                />
              )}

              {/* Modal de Opções do Roteiro */}
              {showRouteOptions && selectedRoute && (
                <div className="modal-overlay">
                  <div className="route-options-modal">
                    <div className="modal-header">
                      <h3>📋 {selectedRoute.name}</h3>
                      <button 
                        onClick={() => {
                          setShowRouteOptions(false);
                          setSelectedRoute(null);
                        }}
                        className="close-btn"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="modal-content">
                      <div className="route-summary">
                        <p><strong>Locais:</strong> {selectedRoute.places?.length || 0}</p>
                        <p><strong>Modo:</strong> {selectedRoute.travelMode}</p>
                        {selectedRoute.totalDistance && <p><strong>Distância:</strong> {selectedRoute.totalDistance}</p>}
                        {selectedRoute.totalDuration && <p><strong>Tempo:</strong> {selectedRoute.totalDuration} min</p>}
                      </div>
                      
                      <div className="route-options-grid">
                        <button 
                          onClick={() => {
                            handleLoadRoute(selectedRoute);
                            setShowRouteOptions(false);
                            setSelectedRoute(null);
                          }}
                          className="option-btn load-option"
                        >
                          🗺️ Carregar no Mapa
                        </button>
                        
                        <button 
                          onClick={() => {
                            handleLoadRoute(selectedRoute);
                            setShowRouteOptions(false);
                            setSelectedRoute(null);
                            // Scroll para o roteiro detalhado
                            setTimeout(() => {
                              const stepsContainer = document.querySelector('.steps-container');
                              if (stepsContainer) {
                                stepsContainer.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 500);
                          }}
                          className="option-btn details-option"
                        >
                          📋 Ver Roteiro Detalhado
                        </button>
                        
                        <button 
                          onClick={() => {
                            // Exportar roteiro como texto
                            const routeText = generateRouteText(selectedRoute);
                            navigator.clipboard.writeText(routeText).then(() => {
                              alert('📋 Roteiro copiado para a área de transferência!');
                            });
                          }}
                          className="option-btn export-option"
                        >
                          📤 Exportar Roteiro
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: selectedRoute.name,
                                text: generateRouteText(selectedRoute),
                              });
                            } else {
                              const routeText = generateRouteText(selectedRoute);
                              navigator.clipboard.writeText(routeText);
                              alert('📋 Roteiro copiado! Cole onde desejar compartilhar.');
                            }
                          }}
                          className="option-btn share-option"
                        >
                          🔗 Compartilhar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </LoadScript>
      )}
    </>
  );
}

export default App;



