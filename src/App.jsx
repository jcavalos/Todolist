// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [hoveredTask, setHoveredTask] = useState(null);
  const [user, setUser] = useState('');
  const [isUserCreated, setIsUserCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUserForm, setShowUserForm] = useState(false); // Agregue esta linea por que se me hizo buena idea poder cambiar de usuario
  const [newUsername, setNewUsername] = useState(''); // Agregue esta linea por que se me hizo buena idea poder cambiar de usuario y cerrar sesion del anterior

  const API_BASE = 'https://playground.4geeks.com/todo';

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('todo-current-user'); //Estoy aprendiendo y entiuendo la persistencia de datos no se si es correcto aun como se escribe
    if (savedUser) {
      setUser(savedUser);
      loadTasks(savedUser);
    }
  }, []);

  // Crear usuario
  const createUser = async (username) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/users/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUser(username);
        setIsUserCreated(true);
        localStorage.setItem('todo-current-user', username);
        await loadTasks(username);
      } else if (response.status === 422) {
        // Usuario ya existe, intentar cargar sus tareas
        setUser(username);
        localStorage.setItem('todo-current-user', username);
        await loadTasks(username);
        setIsUserCreated(true);
      } else {
        throw new Error('Error al crear usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Error al conectar con el usuario. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar tareas del usuario
  const loadTasks = async (username) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users/${username}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.todos || []);
        setIsUserCreated(true);
      } else {
        throw new Error('Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar de usuario
  const switchUser = async () => {
    if (!newUsername.trim()) return;
    
    setShowUserForm(false);
    setNewUsername('');
    await createUser(newUsername.trim());
  };

  // Cerrar sesión
  const logout = () => {
    setUser('');
    setIsUserCreated(false);
    setTasks([]);
    localStorage.removeItem('todo-current-user');
  };

  // Añadir nueva tarea
  const addTask = async () => {
    if (!inputValue.trim() || !isUserCreated) return;

    try {
      setLoading(true);
      setError('');

      const newTask = {
        label: inputValue.trim(),
        is_done: false
      };

      const response = await fetch(`${API_BASE}/todos/${user}`, {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setInputValue('');
        await loadTasks(user);
      } else {
        throw new Error('Error al añadir tarea');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Error al añadir la tarea');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar tarea
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/todos/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadTasks(user);
      } else {
        throw new Error('Error al eliminar tarea');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Error al eliminar la tarea');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar todas las tareas
  const clearAllTasks = async () => {
    if (!isUserCreated || tasks.length === 0) return;

    try {
      setLoading(true);
      setError('');

      const deletePromises = tasks.map(task => 
        fetch(`${API_BASE}/todos/${task.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);
      await loadTasks(user);
    } catch (error) {
      console.error('Error clearing tasks:', error);
      setError('Error al limpiar las tareas');
    } finally {
      setLoading(false);
    }
  };

  // Manejar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!isUserCreated && user.trim()) {
        handleUserSubmit();
      } else if (isUserCreated && !showUserForm) {
        addTask();
      } else if (showUserForm && newUsername.trim()) {
        switchUser();
      }
    }
  };

  // Manejar envío de usuario inicial
  const handleUserSubmit = () => {
    if (user.trim()) {
      createUser(user.trim());
    }
  };

  // Si no hay usuario creado, mostrar formulario inicial
  if (!isUserCreated) {
    return (
      <div className="app-container">
        <div className="todo-card">
          <div className="header">
            <h1 className="title">todos</h1>
          </div>
          <div className="content">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', color: '#495057', marginBottom: '20px' }}>
                Ingresa tu nombre de usuario
              </h2>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nombre de usuario..."
                className="task-input"
                disabled={loading}
              />
              <button
                onClick={handleUserSubmit}
                disabled={loading || !user.trim()}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: loading || !user.trim() ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: loading || !user.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                {loading ? 'Conectando...' : 'Comenzar'}
              </button>
              {error && (
                <div style={{ 
                  color: '#dc3545', 
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '5px'
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="todo-card">
        {/* Header con gestión de usuarios */}
        <div className="header">
          <h1 className="title">todos</h1>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Usuario: <strong>{user}</strong>
            </div>
            <div>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                style={{
                  background: 'none',
                  border: '1px solid #007bff',
                  color: '#007bff',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginRight: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#007bff';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#007bff';
                }}
              >
                Cambiar Usuario
              </button>
              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: '1px solid #6c757d',
                  color: '#6c757d',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#6c757d';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6c757d';
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {error && (
            <div style={{ 
              color: '#dc3545', 
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Formulario para cambiar usuario */}
          {showUserForm && (
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '18px', 
                color: '#495057' 
              }}>
                Cambiar a otro usuario
              </h3>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nombre del nuevo usuario..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
                disabled={loading}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={switchUser}
                  disabled={loading || !newUsername.trim()}
                  style={{
                    padding: '8px 16px',
                    background: loading || !newUsername.trim() ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: loading || !newUsername.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Cambiando...' : 'Cambiar'}
                </button>
                <button
                  onClick={() => {
                    setShowUserForm(false);
                    setNewUsername('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    color: '#6c757d',
                    border: '1px solid #6c757d',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Input para tareas (solo si no está el formulario de usuario) */}
          {!showUserForm && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="task-input"
              disabled={loading}
            />
          )}

          {/* Tasks List */}
          <div className="tasks-container">
            {loading ? (
              <div className="empty-state">
                Cargando...
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="task-item"
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <span className="task-text">{task.label}</span>
                  {hoveredTask === task.id && (
                    <button
                      className="delete-button"
                      onClick={() => deleteTask(task.id)}
                      disabled={loading}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                No hay tareas, añadir tareas
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="task-count">
                {tasks.length} item{tasks.length !== 1 ? 's' : ''} left
              </span>
              {tasks.length > 0 && (
                <button
                  onClick={clearAllTasks}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.background = '#dc3545';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#dc3545';
                  }}
                >
                  Limpiar todo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}