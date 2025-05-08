import axios from "axios";

// Configuración global de Axios
axios.defaults.headers.common["Content-Type"] = "application/json";

const API_URL = "https://botwhatsapprailway1-production.up.railway.app/pedidos";
// Obtener todos los pedidos
export const getPedidos = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    throw error;
  }
};

// Crear un nuevo pedido
export const createPedido = async (pedido) => {
  try {
    const response = await axios.post(API_URL, pedido, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    throw error;
  }
};

// Actualizar un pedido
export const updatePedido = async (id, pedido) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, pedido, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    throw error;
  }
};

// Eliminar un pedido
export const deletePedido = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    throw error;
  }
};

// Marcar un pedido como "no nuevo" (leído)
export const markPedidoAsRead = async (id) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}/markAsRead`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al marcar el pedido como leído:", error);
    throw error;
  }
};

// Marcar un pedido como "listo"
export const markPedidoAsDone = async (id) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}/markAsDone`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al marcar el pedido como listo:", error);
    throw error;
  }
};
