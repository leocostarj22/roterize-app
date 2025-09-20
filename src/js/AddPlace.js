import React, { useState, useEffect } from 'react';
import { auth, addPlace, uploadPhoto } from './firebase';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import '../css/AddPlace.css';

const libraries = ['places'];

function AddPlace({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    latitude: null,
    longitude: null,
    openingHours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false }
    },
    priceRange: '',
    tags: '',
    website: '',
    phone: ''
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  const categories = [
    'Restaurante',
    'Atração Turística',
    'Hotel/Pousada',
    'Shopping',
    'Parque',
    'Museu',
    'Teatro/Cinema',
    'Bar/Balada',
    'Praia',
    'Trilha/Caminhada',
    'Esporte/Aventura',
    'Transporte',
    'Serviços',
    'Outros'
  ];

  const priceRanges = [
    { value: '$', label: '$ - Econômico' },
    { value: '$$', label: '$$ - Moderado' },
    { value: '$$$', label: '$$$ - Caro' },
    { value: '$$$$', label: '$$$$ - Muito Caro' }
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(userLocation);
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      setError('Máximo de 5 fotos permitidas');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada foto deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          id: Date.now() + Math.random()
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

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

    // Geocoding reverso para obter endereço
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
        }
      });
    }
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setSelectedLocation(location);
        setMapCenter(location);
        setFormData(prev => ({
          ...prev,
          name: place.name || prev.name,
          address: place.formatted_address || prev.address,
          latitude: location.lat,
          longitude: location.lng,
          phone: place.formatted_phone_number || prev.phone,
          website: place.website || prev.website
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome do lugar é obrigatório');
      return false;
    }
    if (!formData.category) {
      setError('Categoria é obrigatória');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Endereço é obrigatório');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Selecione a localização no mapa');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Upload das fotos
      const photoUrls = [];
      for (const photo of photos) {
        try {
          const url = await uploadPhoto(photo.file, `places/${Date.now()}_${photo.file.name}`);
          photoUrls.push(url);
        } catch (photoError) {
          console.error('Erro ao fazer upload da foto:', photoError);
        }
      }
      
      // Preparar dados do lugar
      const placeData = {
        ...formData,
        photos: photoUrls,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        contributorId: auth.currentUser?.uid,
        contributorName: auth.currentUser?.displayName || auth.currentUser?.email,
        createdAt: new Date(),
        verified: false,
        rating: 0,
        reviewCount: 0
      };
      
      await addPlace(placeData);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao adicionar lugar:', error);
      setError('Erro ao adicionar lugar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="add-place-overlay">
        <div className="add-place-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Lugar adicionado com sucesso!</h2>
            <p>Obrigado por contribuir com a comunidade Roterize!</p>
            <p>Seu lugar será revisado e publicado em breve.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-place-overlay">
      <div className="add-place-container">
        <div className="add-place-header">
          <h2>Adicionar Novo Lugar</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="add-place-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-section">
            <h3>Informações Básicas</h3>
            
            <div className="form-group">
              <label>Nome do Lugar *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Restaurante do João"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Categoria *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Descrição *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o lugar, suas características especiais, o que o torna único..."
                rows={4}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Faixa de Preço</label>
                <select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione</option>
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.exemplo.com"
              />
            </div>
            
            <div className="form-group">
              <label>Tags (separadas por vírgula)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Ex: comida italiana, ambiente romântico, vista para o mar"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Localização *</h3>
            
            <LoadScript
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <div className="form-group">
                <label>Buscar Endereço</label>
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Digite o endereço ou nome do lugar"
                    className="address-search"
                  />
                </Autocomplete>
              </div>
              
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
            </LoadScript>
            
            <div className="form-group">
              <label>Endereço *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Endereço completo"
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Horário de Funcionamento</h3>
            
            {Object.entries(formData.openingHours).map(([day, hours]) => (
              <div key={day} className="hours-row">
                <div className="day-name">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>
                
                <label className="closed-checkbox">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                  />
                  Fechado
                </label>
                
                {!hours.closed && (
                  <>
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      placeholder="Abertura"
                    />
                    <span>às</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      placeholder="Fechamento"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="form-section">
            <h3>Fotos (máximo 5)</h3>
            
            <div className="photo-upload">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                id="photo-input"
                style={{ display: 'none' }}
              />
              
              <label htmlFor="photo-input" className="upload-btn">
                📷 Adicionar Fotos
              </label>
              
              <div className="photo-preview">
                {photos.map(photo => (
                  <div key={photo.id} className="photo-item">
                    <img src={photo.preview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-photo"
                      onClick={() => removePhoto(photo.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Adicionando...' : 'Adicionar Lugar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPlace;