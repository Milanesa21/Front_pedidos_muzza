// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import { getPedidos, markPedidoAsRead, markPedidoAsDone } from "./services/pedidoServices";
import { io } from "socket.io-client";

function App() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [sortOrder, setSortOrder] = useState('Time (mas recientes)');
  const [isLoading, setIsLoading] = useState(true);

  // Función para transformar un pedido crudo en tu formato de UI
  const formatPedido = (pedido) => {
    const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
    return {
      id: pedido.id,
      customer: pedido.nombre_cliente,
      time: pedido.horario,
      paymentMethod: pedido.metodo_pago,
      items: items.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad || 1,
        precioUnitario: item.precioUnitario || item.precio,
        precioTotal: item.precioTotal || item.precio * (item.cantidad || 1),
      })),
      details: pedido.detalles,
      total: parseFloat(pedido.total) || 0,
      type: pedido.delivery ? "Delivery" : "Pickup",
      isNew: pedido.is_new,
      direccion: pedido.direccion || "",
      isDone: pedido.is_done || false,
      createdAt: new Date(pedido.created_at || pedido.horario),
    };
  };

  // Carga inicial de pedidos y configuración de Socket.io
  useEffect(() => {
    const fetchAndSet = async () => {
      setIsLoading(true);
      try {
        const data = await getPedidos();
        const formatted = data.map(formatPedido)
                              .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(formatted);
      } catch (err) {
        console.error("Error al obtener los pedidos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndSet();

    const socket = io("https://botwhatsapprailway1-production.up.railway.app", {
      transports: ['websocket', 'polling'],
      extraHeaders: { "Content-Type": "application/json" }
    });

    socket.on("connect", () => {
      console.log("Conectado a Socket.io:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("Error Socket.io:", err);
    });

    // Escuchamos nuevos pedidos “push”
    socket.on("nuevoPedido", (nuevoPedido) => {
      console.log("Nuevo pedido recibido:", nuevoPedido);
      setOrders(prev => {
        const formatted = formatPedido(nuevoPedido);
        return [formatted, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ——— El efecto de polling QUEDA ELIMINADO ———
  // useEffect(() => {
  //   const interval = setInterval(fetchAndSet, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markPedidoAsRead(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, isNew: false } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsDone = async (id) => {
    try {
      await markPedidoAsDone(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, isDone: true } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      return (
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toString().includes(searchQuery)
      );
    }

    if (activeTab === "Done") return order.isDone;
    if (order.isDone) return false;
    if (activeTab === "New" && !order.isNew) return false;
    if (activeTab === "Delivery" && order.type !== "Delivery") return false;
    if (activeTab === "Pickup" && order.type !== "Pickup") return false;
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortOrder === "Time (mas recientes)") return b.createdAt - a.createdAt;
    if (sortOrder === "Time (ultimos)") return a.createdAt - b.createdAt;
    if (sortOrder === "Total (mas altos)") return b.total - a.total;
    if (sortOrder === "Total (mas bajos)") return a.total - b.total;
    return 0;
  });

  const newOrdersCount = orders.filter(order => order.isNew && !order.isDone).length;

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
            placeholder="Busca por nombre de cliente o ID de pedido"
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
              <option value="All Types">Todos los tipos</option>
              <option value="Delivery">Delivery</option>
              <option value="Pickup">Pasa a buscar</option>
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

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      ) : (
        <div className="orders-grid">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => (
              <div
                className={`order-card ${order.type.toLowerCase()} ${order.isDone ? "done" : ""}`}
                key={order.id}
                onClick={() => handleMarkAsRead(order.id)}
              >
                <div className="order-header">
                  <div className="order-id">
                    #{order.id}
                    {order.isNew && !order.isDone && <span className="new-badge">New</span>}
                    {order.isDone && <span className="done-badge">Listo</span>}
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
                      <li key={index}>
                        <span className="item-name">{item.nombre}</span>
                        <span className="item-meta">
                          <span className="item-quantity">x{item.cantidad}</span>
                          {item.precioUnitario && (
                            <span className="item-price">${item.precioUnitario.toFixed(2)} c/u</span>
                          )}
                        </span>
                      </li>
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

                <div className="order-footer">
                  <div className="order-total">
                    <p className="section-label">Total:</p>
                    <p className="price">${order.total.toFixed(2)}</p>
                  </div>

                  {!order.isDone && (
                    <button
                      className="ready-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDone(order.id);
                      }}
                    >
                      Pedido listo
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-orders">
              <p>No hay pedidos que coincidan con tu búsqueda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;