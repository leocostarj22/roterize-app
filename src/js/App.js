import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserRoutes, saveRoute, deleteRoute } from './firebase';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showAddTip, setShowAddTip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Estados para o mapa com localização atual
  const [mapCenter, setMapCenter] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisboa como padrão
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 AUTH: Estado de autenticação mudou:', currentUser);
      if (currentUser) {
        console.log('🔐 AUTH: Usuário logado:', {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        });
        await loadUserRoutes(currentUser.uid);
      } else {
        console.log('🔐 AUTH: Usuário não está logado');
        setSavedRoutes([]);
      }
      setUser(currentUser);
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
          console.log('📍 Localização detectada na tela inicial:', location);
          setMapCenter(location);
          setUserLocation(location);
        },
        (error) => {
          console.log('❌ Erro ao obter localização na tela inicial:', error);
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
      setLoadingRoutes(true); // Iniciar loading
      console.log('🔍 LOAD: Carregando roteiros para:', userId);
      const routes = await getUserRoutes(userId);
      console.log('🔍 LOAD: Roteiros carregados:', routes.length);
      setSavedRoutes(routes);
    } catch (error) {
      console.error('❌ LOAD: Erro:', error);
    } finally {
      setLoadingRoutes(false); // Finalizar loading
    }
  };

  const handleSaveRoute = async () => {
    console.log('🔍 TESTE: Iniciando salvamento do roteiro');
    console.log('🔍 TESTE: Usuário logado:', user ? user.uid : 'Não logado');
    console.log('🔍 TESTE: Nome do roteiro:', routeName.trim());
    console.log('🔍 TESTE: Lugares:', places);
    console.log('🔍 TESTE: Direções:', directions ? 'Existem' : 'Não existem');
    console.log('🔍 TESTE: Steps:', steps);
    
    if (!routeName.trim()) {
      alert('Por favor, insira um nome para o roteiro.');
      return;
    }
  
    if (!directions || places.length < 2) {
      alert('Gere um roteiro antes de salvá-lo.');
      return;
    }
  
    try {
      console.log('🔍 TESTE: Preparando dados do roteiro...');
      
      // Calcular distância e duração de forma mais segura
      let totalDistance = 0;
      let totalDuration = 0;
      
      if (steps && steps.length > 0) {
        steps.forEach((step, index) => {
          console.log(`🔍 TESTE: Step ${index}:`, step);
          
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
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 TESTE: Dados finais do roteiro:', routeData);
      console.log('🔍 TESTE: Chamando saveRoute...');
      
      const routeId = await saveRoute(user.uid, routeData);
      console.log('🔍 TESTE: Roteiro salvo com sucesso! ID:', routeId);
      
      await loadUserRoutes(user.uid);
      console.log('🔍 TESTE: Roteiros recarregados');
      
      setShowSaveDialog(false);
      setRouteName('');
      alert('✅ Roteiro salvo com sucesso!');
      
    } catch (error) {
      console.error('❌ TESTE: Erro detalhado ao salvar roteiro:', error);
      console.error('❌ TESTE: Stack trace:', error.stack);
      console.error('❌ TESTE: Código do erro:', error.code);
      console.error('❌ TESTE: Mensagem do erro:', error.message);
      
      // Mostrar erro mais detalhado para o usuário
      alert(`❌ Erro ao salvar roteiro:\n\nCódigo: ${error.code || 'Desconhecido'}\nMensagem: ${error.message || 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleLoadRoute = (route) => {
    setPlaces(route.places);
    setMode(route.travelMode);
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
      console.error('Erro ao deletar roteiro:', error);
      alert('Erro ao deletar roteiro: ' + error.message);
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    console.log('🚪 LOGOUT: Iniciando processo de logout...');
    try {
      console.log('🚪 LOGOUT: Chamando signOut...');
      await signOut(auth);
      console.log('🚪 LOGOUT: signOut executado com sucesso');
      setUser(null);
      setSavedRoutes([]);
      setPlaces([]);
      setDirections(null);
      setSteps([]);
      setShowMenu(false);
      console.log('🚪 LOGOUT: Estados limpos com sucesso');
    } catch (error) {
      console.error('🚪 LOGOUT: Erro ao fazer logout:', error);
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
    if (places.length < 2) {
      alert('Adicione pelo menos 2 locais para gerar um roteiro.');
      return;
    }

    if (!window.google || !window.google.maps) {
      alert('Google Maps API não está carregada.');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    // Configurar waypoints (locais intermediários)
    const waypoints = places.slice(1, -1).map(place => ({
      location: place,
      stopover: true
    }));

    const request = {
      origin: places[0],
      destination: places[places.length - 1],
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode[mode],
      optimizeWaypoints: true
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
        
        // Extrair passos detalhados
        const legs = route.legs;
        const routeSteps = [];
        
        legs.forEach((leg, index) => {
          routeSteps.push({
            start: leg.start_address,
            end: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text
          });
        });
        
        setSteps(routeSteps);
      } else {
        console.error('Erro ao gerar roteiro:', status);
        alert('Erro ao gerar roteiro. Verifique os locais inseridos.');
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
                      height: '500px',
                      minHeight: '450px'
                    }}
                    center={mapCenter}
                    zoom={directions ? 12 : 13}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,
                      gestureHandling: 'greedy'
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
                          <p><strong>De:</strong> {step.start}</p>
                          <p><strong>Para:</strong> {step.end}</p>
                          <p><strong>Distância:</strong> {step.distance} • <strong>Tempo:</strong> {step.duration}</p>
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
                            <small>Criado em: {route.createdAt ? new Date(route.createdAt.seconds * 1000).toLocaleDateString() : 'Data não disponível'}</small>
                          </div>
                          <div className="route-actions">
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
                    <h3>Salvar Roteiro</h3>
                    <input
                      type="text"
                      placeholder="Nome do roteiro"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      className="route-name-input"
                    />
                    <div className="dialog-actions">
                      <button onClick={() => setShowSaveDialog(false)} className="cancel-btn">
                        Cancelar
                      </button>
                      <button onClick={handleSaveRoute} className="save-btn">
                        Salvar
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
            </div>
          )}
        </LoadScript>
      )}
    </>
  );
}

export default App;
