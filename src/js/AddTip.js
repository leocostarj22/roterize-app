import React, { useState, useEffect } from 'react';
import { auth, addTip, getTipsByCategory, uploadPhoto } from './firebase';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import '../css/AddTip.css';

const libraries = ['places'];

function AddTip({ onClose }) {
  // Estados existentes
  const [currentView, setCurrentView] = useState('feed');
  const [tips, setTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [formData, setFormData] = useState({
    placeName: '',
    description: '',
    category: '',
    address: '',
    latitude: null,
    longitude: null,
    rating: 0,
    priceRange: '',
    tags: '',
    tip: '',
    bestTimeToVisit: '',
    accessibility: false,
    familyFriendly: false
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Mudando a localização padrão para Lisboa
  const [mapCenter, setMapCenter] = useState({ lat: 38.7223, lng: -9.1393 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  // Estados para busca de endereço
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // useEffect para obter localização atual do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          // Usar localização padrão
        }
      );
    } else {
      // Geolocalização não suportada
    }
  }, []);

  const loadTips = async () => {
    try {
      const tips = await getTipsByCategory(selectedCategory, 20);
      setTips(tips);
    } catch (error) {
      // Erro silencioso
    }
  };

  const categories = [
    'Todos',
    'Restaurante/Comida',
    'Hotel/Hospedagem',
    'Turismo/Pontos Turísticos',
    'Compras/Shopping',
    'Parque/Natureza',
    'Museu/Cultura',
    'Teatro/Cinema',
    'Bar/Vida Noturna',
    'Praia/Água',
    'Trilha/Aventura',
    'Esporte/Fitness',
    'Transporte',
    'Serviços',
    'Mercado/Feira',
    'Outros'
  ];

  const priceRanges = [
    { value: 'gratis', label: 'Gratuito' },
    { value: '$', label: '$ - Econômico (até R$30)' },
    { value: '$$', label: '$$ - Moderado (R$30-80)' },
    { value: '$$$', label: '$$$ - Caro (R$80-150)' },
    { value: '$$$$', label: '$$$$ - Muito Caro (R$150+)' }
  ];

  // Função para obter ícones das categorias
  const getCategoryIcon = (category) => {
    const icons = {
      'Todos': '📂',
      'Restaurante/Comida': '🍽️',
      'Hotel/Hospedagem': '🏨',
      'Turismo/Pontos Turísticos': '🏛️',
      'Compras/Shopping': '🛍️',
      'Parque/Natureza': '🌳',
      'Museu/Cultura': '🎨',
      'Teatro/Cinema': '🎭',
      'Bar/Vida Noturna': '🍻',
      'Praia/Água': '🏖️',
      'Trilha/Aventura': '🥾',
      'Esporte/Fitness': '⚽',
      'Transporte': '🚌',
      'Serviços': '🔧',
      'Mercado/Feira': '🛒',
      'Outros': '📍'
    };
    return icons[category] || '📍';
  };

  // Função para buscar endereços
  const searchAddresses = (searchText) => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API não carregada');
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: searchText,
        types: ['establishment', 'geocode']
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setAddressSuggestions(predictions.slice(0, 5));
          setShowAddressSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowAddressSuggestions(false);
        }
      }
    );
  };

  // Função para mudanças no input de endereço
  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    
    if (value.length >= 2) {
      searchAddresses(value);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Função para cliques nas sugestões de endereço
  const handleAddressSuggestionClick = (suggestion) => {
    setAddressInput(suggestion.description);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    
    if (window.google && window.google.maps) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['geometry', 'name', 'formatted_address']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            
            // Atualizar mapa e localização
            setSelectedLocation(location);
            setMapCenter(location);
            
            // Atualizar dados do formulário
            setFormData(prev => ({
              ...prev,
              placeName: place.name || prev.placeName,
              address: place.formatted_address || suggestion.description,
              latitude: location.lat,
              longitude: location.lng
            }));
            
            console.log('📍 Localização selecionada:', {
              name: place.name,
              address: place.formatted_address,
              coordinates: location
            });
          }
        }
      );
    }
  };

  // Função para mudanças nos inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Função para upload de fotos
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      setError('Máximo de 5 fotos permitidas');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Função para remover foto
  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleMapClick = (e) => {
    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  // Modificar handleSubmit para voltar ao feed após salvar
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('Você precisa estar logado para adicionar uma dica!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload das fotos primeiro
      const photoUrls = [];
      for (const photo of photos) {
        if (photo.file) {
          const photoUrl = await uploadPhoto(photo.file, 'tips');
          photoUrls.push(photoUrl);
        }
      }

      const tipData = {
        ...formData,
        photos: photoUrls,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName || 'Usuário Anônimo'
      };

      await addTip(tipData);
      setSuccess(true);
      
      // Após 2 segundos, voltar ao feed
      setTimeout(() => {
        setCurrentView('feed');
        setSuccess(false);
        // Reset form
        setFormData({
          placeName: '',
          description: '',
          category: '',
          address: '',
          latitude: null,
          longitude: null,
          rating: 0,
          priceRange: '',
          tags: '',
          tip: '',
          bestTimeToVisit: '',
          accessibility: false,
          familyFriendly: false
        });
        setPhotos([]);
        // Adicionar a função loadTips após os useEffect existentes
        const loadTips = async () => {
          try {
            setLoading(true);
            const tipsData = await getTipsByCategory(selectedCategory);
            setTips(tipsData || []);
          } catch (error) {
            console.error('Erro ao carregar dicas:', error);
            setError('Erro ao carregar dicas');
          } finally {
            setLoading(false);
          }
        };
        loadTips();
      }, 2000);

    } catch (error) {
      console.error('Erro ao adicionar dica:', error);
      setError('Erro ao adicionar dica: ' + error.message);
    }
    
    setLoading(false);
  };

  // Função para renderizar estrelas
  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Se está mostrando sucesso
  if (success) {
    return (
      <div className="add-tip-container">
        <div className="add-tip-screen">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Dica adicionada com sucesso!</h2>
            <p>Obrigado por contribuir com a comunidade!</p>
          </div>
        </div>
      </div>
    );
  }

  // Se está na visualização de adicionar dica
  if (currentView === 'add') {
    return (
      <div className="add-tip-container">
        <div className="add-tip-screen">
          <div className="add-tip-header">
            <div className="header-top">
              <button onClick={() => setCurrentView('feed')} className="back-btn">
                ←
              </button>
              <h1 className="header-title">Adicionar Dica</h1>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="add-tip-form">
            {error && <div className="error-message">{error}</div>}
            
            {/* Nome do Local */}
            <div className="form-group">
              <label>📍 Nome do Local *</label>
              <input
                type="text"
                name="placeName"
                value={formData.placeName}
                onChange={handleInputChange}
                placeholder="Ex: Restaurante da Maria"
                className="form-input"
                required
              />
            </div>

            {/* Categoria */}
            <div className="form-group">
              <label>🏷️ Categoria *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.filter(cat => cat !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="form-group">
              <label>📝 Descrição *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva sua experiência neste local..."
                className="form-textarea"
                required
              />
            </div>

            {/* Dica Extra */}
            <div className="form-group">
              <label>💡 Dica Especial</label>
              <textarea
                name="tip"
                value={formData.tip}
                onChange={handleInputChange}
                placeholder="Compartilhe uma dica especial sobre este local..."
                className="form-textarea"
              />
            </div>

            {/* Avaliação */}
            <div className="form-group">
              <label>⭐ Avaliação *</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value={0}>Selecione uma avaliação</option>
                <option value={1}>⭐ (1 estrela)</option>
                <option value={2}>⭐⭐ (2 estrelas)</option>
                <option value={3}>⭐⭐⭐ (3 estrelas)</option>
                <option value={4}>⭐⭐⭐⭐ (4 estrelas)</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5 estrelas)</option>
              </select>
            </div>

            {/* Endereço com Sugestões Melhoradas */}
            <div className="form-group">
              <label>📍 Endereço *</label>
              <div className="address-input-container">
                <input
                  type="text"
                  value={addressInput}
                  onChange={handleAddressInputChange}
                  placeholder="Digite o endereço para buscar no mapa..."
                  className="form-input"
                  required
                />
                
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="address-suggestions-dropdown">
                    <div className="suggestions-header">
                      <span>📍 Sugestões de locais:</span>
                    </div>
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => handleAddressSuggestionClick(suggestion)}
                        className="address-suggestion-item"
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-content">
                          <div className="suggestion-main">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
                          <div className="suggestion-secondary">{suggestion.structured_formatting?.secondary_text || ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="field-help">
                💡 Digite o endereço e selecione uma sugestão para localizar no mapa
              </p>
            </div>

            {/* Mapa - logo após o endereço */}
            <div className="form-group">
              <label>🗺️ Localização no Mapa *</label>
              <div className="map-container">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '300px' }}
                  center={mapCenter}
                  zoom={15}
                  onClick={handleMapClick}
                >
                  {selectedLocation && (
                    <Marker position={selectedLocation} />
                  )}
                </GoogleMap>
              </div>
              <p className="map-help">
                📍 {selectedLocation ? 'Localização selecionada' : 'Localização atual detectada'}. Clique no mapa para alterar.
              </p>
            </div>

            {/* Faixa de Preço */}
            <div className="form-group">
              <label>💰 Faixa de Preço</label>
              <select
                name="priceRange"
                value={formData.priceRange}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Selecione a faixa de preço</option>
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Melhor Época */}
            <div className="form-group">
              <label>🕒 Melhor Época para Visitar</label>
              <input
                type="text"
                name="bestTimeToVisit"
                value={formData.bestTimeToVisit}
                onChange={handleInputChange}
                placeholder="Ex: Manhã, Final de semana, Verão..."
                className="form-input"
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>🏷️ Tags (separadas por vírgula)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Ex: romântico, família, barato, vista incrível"
                className="form-input"
              />
            </div>

            {/* Checkboxes */}
            <div className="form-group">
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  name="accessibility"
                  checked={formData.accessibility}
                  onChange={handleInputChange}
                />
                ♿ Acessível para pessoas com deficiência
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  name="familyFriendly"
                  checked={formData.familyFriendly}
                  onChange={handleInputChange}
                />
                👨‍👩‍👧‍👦 Adequado para famílias
              </label>
            </div>

            {/* Upload de Fotos */}
            <div className="form-group">
              <label>📸 Fotos (máximo 5)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="form-input"
              />
              
              {photos.length > 0 && (
                <div className="photos-preview">
                  {photos.map(photo => (
                    <div key={photo.id} className="photo-preview">
                      <img src={photo.preview} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="remove-photo-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={() => setCurrentView('feed')} className="cancel-btn">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Salvando...' : '🌟 Adicionar Dica'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Visualização principal - Feed de dicas
  return (
    <div className="add-tip-container">
      <div className="add-tip-screen">
        <div className="add-tip-header">
          <div className="header-top">
            <button onClick={onClose} className="back-btn">
              ←
            </button>
            <h1 className="header-title">Dicas da Comunidade</h1>
            <button 
              onClick={() => setCurrentView('add')} 
              className="add-btn"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {/* Usar o select simples de categorias */}
        <div className="category-filter">
          <div className="form-group">
            <label>Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Todos">Todas as categorias</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="tips-feed">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando dicas...</p>
            </div>
          ) : tips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3 className="empty-title">Nenhuma dica encontrada</h3>
              <p className="empty-message">
                Seja o primeiro a compartilhar uma experiência nesta categoria!
              </p>
              <button 
                onClick={() => setCurrentView('add')} 
                className="main-action-btn"
              >
                ✨ Adicionar primeira dica
              </button>
            </div>
          ) : (
            tips.map(tip => (
              <div key={tip.id} className="tip-card">
                <div className="tip-header">
                  <div className="tip-user">
                    <span className="user-name">{tip.userName}</span>
                    <span className="tip-category">{tip.category}</span>
                  </div>
                  <div className="tip-rating">
                    {renderStars(tip.rating)}
                  </div>
                </div>
                
                <h3 className="tip-title">{tip.placeName}</h3>
                <p className="tip-description">{tip.description}</p>
                
                {tip.tip && (
                  <div className="tip-extra">
                    <strong>💡 Dica:</strong> {tip.tip}
                  </div>
                )}
                
                {tip.address && (
                  <p className="tip-address">📍 {tip.address}</p>
                )}
                
                <div className="tip-details">
                  {tip.bestTimeToVisit && (
                    <span className="tip-detail">🕒 {tip.bestTimeToVisit}</span>
                  )}
                  {tip.priceRange && (
                    <span className="tip-detail">💰 {tip.priceRange}</span>
                  )}
                </div>
                
                {tip.photos && tip.photos.length > 0 && (
                  <div className="tip-photos">
                    {tip.photos.map((photo, index) => (
                      <img key={index} src={photo} alt="Foto da dica" className="tip-photo" />
                    ))}
                  </div>
                )}
                
                <div className="tip-footer">
                  <span className="tip-date">
                    {new Date(tip.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AddTip;
