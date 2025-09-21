import React, { useState, useEffect, useCallback } from 'react';
import { auth, createUserProfile, getUserRoutes, uploadPhoto } from './firebase';
import { updateProfile } from 'firebase/auth';
import '../css/UserProfile.css';

function UserProfile({ user, onClose }) {
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    location: '',
    favoriteDestinations: [],
    totalContributions: 0,
    badges: [],
    level: 1
  });
  const [userRoutes, setUserRoutes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL || null);
  const [newDestination, setNewDestination] = useState('');

  const loadUserData = useCallback(async () => {
    if (user) {
      try {
        const routes = await getUserRoutes(user.uid);
        setUserRoutes(routes);
        
        // Calcular estatísticas do usuário
        const totalRoutes = routes.length;
        
        setProfile(prev => ({
          ...prev,
          totalContributions: totalRoutes,
          level: Math.floor(totalRoutes / 5) + 1 // 1 nível a cada 5 roteiros
        }));
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Carregar dados do usuário se necessário
      } catch (error) {
        // Erro silencioso
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      // Lógica para salvar perfil
      alert('Perfil salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Lógica para upload de foto
      } catch (error) {
        alert('Erro ao fazer upload da foto: ' + error.message);
      }
    }
  };

  const handleAddDestination = () => {
    if (newDestination.trim() && !profile.favoriteDestinations.includes(newDestination.trim())) {
      setProfile(prev => ({
        ...prev,
        favoriteDestinations: [...prev.favoriteDestinations, newDestination.trim()]
      }));
      setNewDestination('');
    }
  };

  const handleRemoveDestination = (destination) => {
    setProfile(prev => ({
      ...prev,
      favoriteDestinations: prev.favoriteDestinations.filter(d => d !== destination)
    }));
  };

  const getBadges = () => {
    const badges = [];
    if (profile.totalContributions >= 1) badges.push({ name: 'Primeiro Roteiro', icon: '🎯' });
    if (profile.totalContributions >= 5) badges.push({ name: 'Explorador', icon: '🗺️' });
    if (profile.totalContributions >= 10) badges.push({ name: 'Aventureiro', icon: '🏔️' });
    if (profile.totalContributions >= 20) badges.push({ name: 'Mestre dos Roteiros', icon: '👑' });
    return badges;
  };

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        <div className="profile-header">
          <div className="header-left">
            <button className="back-btn" onClick={onClose} title="Voltar">←</button>
            <h2>Perfil do Usuário</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {/* Foto e informações básicas */}
          <div className="profile-basic-info">
            <div className="profile-photo-section">
              <div className="profile-photo">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Foto do perfil" />
                ) : (
                  <div className="default-avatar">👤</div>
                )}
              </div>
              {isEditing && (
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    id="photo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="photo-upload" className="upload-btn">
                    📷 Alterar Foto
                  </label>
                </div>
              )}
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className="profile-input"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={profile.email}
                    disabled
                    className="profile-input disabled"
                  />
                  <textarea
                    placeholder="Biografia"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="profile-textarea"
                    rows="3"
                  />
                  <input
                    type="text"
                    placeholder="Localização"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="profile-input"
                  />
                </div>
              ) : (
                <div className="profile-display">
                  <h3>{profile.displayName || 'Nome não informado'}</h3>
                  <p className="email">{profile.email}</p>
                  {profile.bio && <p className="bio">{profile.bio}</p>}
                  {profile.location && <p className="location">📍 {profile.location}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{profile.totalContributions}</span>
              <span className="stat-label">Roteiros Criados</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{userRoutes.reduce((total, route) => total + (route.places?.length || 0), 0)}</span>
              <span className="stat-label">Lugares Visitados</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profile.level}</span>
              <span className="stat-label">Nível</span>
            </div>
          </div>

          {/* Badges */}
          <div className="profile-badges">
            <h4>Conquistas</h4>
            <div className="badges-grid">
              {getBadges().map((badge, index) => (
                <div key={index} className="badge-item">
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destinos Favoritos */}
          <div className="favorite-destinations">
            <h4>Destinos Favoritos</h4>
            {isEditing && (
              <div className="add-destination">
                <input
                  type="text"
                  placeholder="Adicionar destino favorito"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="destination-input"
                />
                <button onClick={handleAddDestination} className="add-btn">+</button>
              </div>
            )}
            <div className="destinations-list">
              {profile.favoriteDestinations.map((destination, index) => (
                <div key={index} className="destination-tag">
                  <span>{destination}</span>
                  {isEditing && (
                    <button 
                      onClick={() => handleRemoveDestination(destination)}
                      className="remove-destination"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roteiros Recentes */}
          <div className="recent-routes">
            <h4>Roteiros Recentes</h4>
            <div className="routes-list">
              {userRoutes.slice(0, 3).map((route) => (
                <div key={route.id} className="route-item">
                  <h5>{route.name}</h5>
                  <p>{route.places?.length || 0} locais • {route.travelMode}</p>
                  <small>{new Date(route.createdAt.seconds * 1000).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="profile-actions">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)} 
                className="cancel-btn"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProfile} 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="edit-btn"
            >
              ✏️ Editar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;