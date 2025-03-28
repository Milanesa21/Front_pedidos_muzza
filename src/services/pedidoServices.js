import axios from "axios";

const API_URL = "tablaspedidosmuzza.com/pedidos"; // URL de tu backend

// Obtener todos los pedidos
export const getPedidos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    throw error;
  }
};

// Crear un nuevo pedido
export const createPedido = async (pedido) => {
  try {
    const response = await axios.post(API_URL, pedido);
    return response.data;
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    throw error;
  }
};

// Actualizar un pedido
export const updatePedido = async (id, pedido) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, pedido);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    throw error;
  }
};

// Eliminar un pedido
export const deletePedido = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    throw error;
  }
};

// Marcar un pedido como "no nuevo" (leído)
export const markPedidoAsRead = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/markAsRead`);
    return response.data;
  } catch (error) {
    console.error("Error al marcar el pedido como leído:", error);
    throw error;
  }
};

// Marcar un pedido como "listo"
export const markPedidoAsDone = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/markAsDone`);
    return response.data;
  } catch (error) {
    console.error("Error al marcar el pedido como listo:", error);
    throw error;
  }
};