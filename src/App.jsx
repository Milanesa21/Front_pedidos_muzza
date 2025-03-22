import React, { useState, useEffect } from 'react';
import './App.css';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import { getPedidos, markPedidoAsRead, markPedidoAsDone } from "./services/pedidoServices";
import { io } from "socket.io-client"; // Importar Socket.IO

function App() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [sortOrder, setSortOrder] = useState('Time (Earliest)');

  // Obtener los pedidos del backend al cargar el componente
  useEffect(() => {
    fetchPedidos();

    // Configurar Socket.IO
    const socket = io("http://localhost:4000"); // URL del backend

    // Escuchar eventos de nuevos pedidos
    socket.on("nuevoPedido", (nuevoPedido) => {
      setOrders((prevOrders) => [nuevoPedido, ...prevOrders]);
    });

    // Limpiar el socket al desmontar el componente
    return () => {
      socket.disconnect();
    };
  }, []);

  // Verificar nuevos pedidos cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPedidos();
    }, 10000); // 10 segundos

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []);

  const fetchPedidos = async () => {
    try {
      const data = await getPedidos(); // Obtener todos los pedidos del backend
      const formattedOrders = data.map((pedido) => {
  // Verificar si items ya es un objeto o necesita ser parseado
  const items = typeof pedido.items === 'string'
    ? JSON.parse(pedido.items)
    : pedido.items;

  // Determinar el tipo usando el campo "delivery" (asumiendo que es booleano)
  const orderType = pedido.delivery ? "Delivery" : "Pickup";

  return {
    id: pedido.id,
    customer: pedido.nombre_cliente,
    time: pedido.horario,
    paymentMethod: pedido.metodo_pago,
    items: items.map((item) => item.nombre),
    details: pedido.detalles,
    total: pedido.total,
    type: orderType,
    isNew: pedido.is_new,
    // Solo usamos la dirección si es un pedido de delivery
    direccion: pedido.delivery ? pedido.direccion : "",
    isDone: pedido.is_done || false,
  };
});

      setOrders(formattedOrders); // Actualizar el estado con todos los pedidos
    } catch (error) {
      console.error("Error al obtener los pedidos:", error);
    }
  };

  // Marcar un pedido como leído
  const handleMarkAsRead = async (id) => {
    try {
      await markPedidoAsRead(id);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, isNew: false } : order
        )
      );
    } catch (error) {
      console.error("Error al marcar el pedido como leído:", error);
    }
  };

  // Marcar un pedido como listo
  const handleMarkAsDone = async (id) => {
    try {
      await markPedidoAsDone(id);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, isDone: true } : order
        )
      );
    } catch (error) {
      console.error("Error al marcar el pedido como listo:", error);
    }
  };

  // Filtrar los pedidos según los criterios seleccionados
 const filteredOrders = orders.filter((order) => {
  // Si hay búsqueda, se evalúa en todos los pedidos, sin excluir los terminados.
  if (searchQuery) {
    // Buscar en el nombre del cliente o en el ID (convertido a cadena)
    return (
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Si no hay búsqueda, se filtra según la pestaña activa
  if (activeTab === "Done") return order.isDone;

  // En las otras pestañas se excluyen los pedidos terminados
  if (order.isDone) return false;

  if (activeTab === "New" && !order.isNew) return false;
  if (activeTab === "Delivery" && order.type !== "Delivery") return false;
  if (activeTab === "Pickup" && order.type !== "Pickup") return false;


  return true;
});


  // Contar pedidos nuevos para el badge de notificaciones
  const newOrdersCount = orders.filter((order) => order.isNew && !order.isDone).length;

  return (
    <div className="order-dashboard">
      <header>
        <div className="header-title">
          <img src="/MuzzaIcon.webp" alt="Muzza Icon" className="header-icon" />
          <h1>Muzza Pedidos</h1>
        </div>
        <div className="header-actions">
          <button className="theme-toggle">
            <LightModeIcon style={{ color: "var(--gray-700)" }} />
          </button>
          <button className="notifications">
            <NotificationsIcon style={{ color: "var(--gray-700)" }} />
            {newOrdersCount > 0 && (
              <span className="notification-badge">{newOrdersCount}</span>
            )}
          </button>
        </div>
      </header>

      <div className="search-filter-container">
        <div className="search-container">
          <i className="icon-search"></i>
          <input
            type="text"
            placeholder="Busca por nombre de cliente, o, ID de pedido"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-dropdown">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>Tipos de pedido</option>
              <option>Delivery</option>
              <option>Pasa a buscar</option>
            </select>
          </div>

          <div className="sort-dropdown">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option>Time (mas recientes)</option>
              <option>Time (ultimos)</option>
              <option>Total (mas altos)</option>
              <option>Total (mas bajos)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "All Orders" ? "active" : ""}`}
          onClick={() => setActiveTab("All Orders")}
        >
          Todos los pedidos
        </button>
        <button
          className={`tab ${activeTab === "New" ? "active" : ""}`}
          onClick={() => setActiveTab("New")}
        >
          Nuevos <span className="badge">{newOrdersCount}</span>
        </button>
        <button
          className={`tab ${activeTab === "Delivery" ? "active" : ""}`}
          onClick={() => setActiveTab("Delivery")}
        >
          Delivery
        </button>
        <button
          className={`tab ${activeTab === "Pickup" ? "active" : ""}`}
          onClick={() => setActiveTab("Pickup")}
        >
          Pasa a buscar
        </button>
        <button
          className={`tab ${activeTab === "Done" ? "active" : ""}`}
          onClick={() => setActiveTab("Done")}
        >
          Pedidos terminados
        </button>
      </div>

      <div className="orders-grid">
        {filteredOrders.map((order) => (
          <div
            className={`order-card ${order.type.toLowerCase()}`}
            key={order.id}
            onClick={() => handleMarkAsRead(order.id)} // Marcar como leído al hacer clic
          >
            <div className="order-header">
              <div className="order-id">
                {order.id}
                {order.isNew && <span className="new-badge">New</span>}
              </div>
              <div className={`order-type ${order.type.toLowerCase()}`}>
                {order.type}
              </div>
            </div>

            <div className="customer-info">
              <h3>{order.customer}</h3>
              <p>
                {order.time} · {order.paymentMethod}
              </p>
            </div>

            <div className="order-items">
              <p className="section-label">Items:</p>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {order.details && (
              <div className="order-details">
                <p className="section-label">Detalles:</p>
                <p>{order.details}</p>
              </div>
            )}

            {order.type === "Delivery" && order.direccion && (
              <div className="order-direccion">
                <p className="section-label">Dirección:</p>
                <p>{order.direccion}</p>
              </div>
            )}

            <div className="order-total">
              <p className="section-label">Total:</p>
              <p className="price">${isNaN(Number(order.total)) ? order.total : Number(order.total).toFixed(2)}</p>
            </div>

            {/* Botón "Pedido listo" */}
            <button
              className="ready-button"
              onClick={(e) => {
                e.stopPropagation(); // Evitar que el clic se propague al contenedor
                handleMarkAsDone(order.id);
              }}
            >
              Pedido listo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;