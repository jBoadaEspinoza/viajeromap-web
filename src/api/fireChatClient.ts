import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { OrderItemResponse } from './orders';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ChatDocument {
  orderItemId: string;
  orderId: string;
  activityId: string;
  customerId: string;
  providerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage: string;
  unreadForCustomer: number;
  unreadForProvider: number;
}

export interface MessageDocument {
  senderId: string;
  senderType: 'customer' | 'provider';
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: 'customer' | 'provider';
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
}

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

/**
 * Obtiene o crea un chat basado en orderItemId
 * El chatId es EXACTAMENTE orderItem.id (convertido a string)
 * @param orderItem - Item de la orden
 * @returns El chatId (orderItemId como string)
 */
export const getOrCreateChat = async (orderItem: OrderItemResponse): Promise<string> => {
  try {
    // Validar que db esté inicializado
    if (!db) {
      throw new Error('Firestore no está inicializado. Por favor, verifica la configuración de Firebase.');
    }

    // El chatId es EXACTAMENTE orderItem.id (convertido a string)
    const chatId = orderItem.id.toString();

    console.log('getOrCreateChat - chatId:', chatId);
    console.log('getOrCreateChat - orderItem:', {
      id: orderItem.id,
      orderId: orderItem.orderId,
      activityId: orderItem.activity?.id,
    });

    // Verificar si el chat ya existe
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      console.log('getOrCreateChat - Chat existente encontrado');
      return chatId;
    }

    // Si no existe, crear el chat con todos los campos obligatorios
    console.log('getOrCreateChat - Creando nuevo chat...');

    // Obtener providerId del supplier
    // El providerId debe ser consistente con el flujo del proveedor
    // Usamos el nombre del supplier o el activityId como fallback
    const providerId = orderItem.activity?.supplier?.name || orderItem.activity?.id || 'unknown';

    // customerId se actualizará cuando se envíe el primer mensaje
    // Por ahora usamos un placeholder para permitir la creación del chat
    const customerId = 'pending';

    const chatData: Omit<ChatDocument, 'createdAt' | 'updatedAt'> = {
      orderItemId: chatId,
      orderId: orderItem.orderId,
      activityId: orderItem.activity?.id || '',
      customerId,
      providerId,
      lastMessage: '',
      unreadForCustomer: 0,
      unreadForProvider: 0,
    };

    await setDoc(chatRef, {
      ...chatData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('getOrCreateChat - Nuevo chat creado con ID:', chatId);
    return chatId;
  } catch (error) {
    console.error('Error en getOrCreateChat:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        throw new Error('No tienes permisos para crear chats. Por favor, verifica las reglas de seguridad de Firestore.');
      } else if (error.message.includes('unavailable')) {
        throw new Error('Firestore no está disponible. Por favor, verifica tu conexión a internet.');
      } else {
        throw new Error(`Error de Firestore: ${error.message}`);
      }
    }
    
    throw error;
  }
};

/**
 * Escucha mensajes en tiempo real de un chat
 * @param chatId - ID del chat (orderItemId como string)
 * @param callback - Función que se ejecuta cuando hay nuevos mensajes
 * @returns Función para desuscribirse
 */
export const listenMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('sentAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as MessageDocument),
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up message listener:', error);
    // Retornar función vacía si hay error
    return () => {};
  }
};

/**
 * Envía un mensaje como cliente
 * @param chatId - ID del chat (orderItemId como string)
 * @param customerId - ID del cliente (auth.uid)
 * @param text - Texto del mensaje (opcional)
 * @param imageFile - Archivo de imagen (opcional)
 * @returns El ID del mensaje creado
 */
export const sendMessageAsCustomer = async (
  chatId: string,
  customerId: string,
  text?: string,
  imageFile?: File
): Promise<string> => {
  try {
    // Validar que haya texto o imagen
    if (!text?.trim() && !imageFile) {
      throw new Error('El mensaje debe contener texto o una imagen');
    }

    if (!db || !storage) {
      throw new Error('Firebase no está inicializado');
    }

    let imageUrl: string | null = null;

    // Si hay imagen, subirla a Storage
    if (imageFile) {
      const messageId = doc(collection(db, 'chats', chatId, 'messages')).id;
      const storagePath = `chat_uploads/${chatId}/${messageId}`;
      const storageRef = ref(storage, storagePath);

      // Subir imagen
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    // Crear el mensaje en Firestore
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageRef = await addDoc(messagesRef, {
      senderId: customerId,
      senderType: 'customer',
      message: text?.trim() || null,
      imageUrl,
      sentAt: serverTimestamp(),
    });

    // Actualizar el chat: lastMessage, updatedAt, unreadForProvider += 1
    const chatRef = doc(db, 'chats', chatId);
    
    // Obtener el chat actual para incrementar unreadForProvider
    const chatSnap = await getDoc(chatRef);
    const currentUnread = chatSnap.exists() 
      ? (chatSnap.data().unreadForProvider || 0) 
      : 0;

    const updateData: any = {
      updatedAt: serverTimestamp(),
      unreadForProvider: currentUnread + 1,
      // Actualizar customerId si estaba como 'pending'
      customerId: customerId,
    };

    // Actualizar lastMessage con el texto o indicador de imagen
    if (text?.trim()) {
      updateData.lastMessage = text.trim();
    } else if (imageFile) {
      updateData.lastMessage = '📷 Imagen';
    }

    await updateDoc(chatRef, updateData);

    console.log('sendMessageAsCustomer - Mensaje enviado con ID:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message as customer:', error);
    throw error;
  }
};

/**
 * Marca los mensajes de un chat como leídos por el cliente
 * Esto resetea el contador unreadForCustomer a 0
 * @param chatId - ID del chat (orderItemId como string)
 */
export const markAsSeenByCustomer = async (chatId: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadForCustomer: 0,
    });

    console.log('markAsSeenByCustomer - Chat marcado como leído:', chatId);
  } catch (error) {
    console.error('Error marking chat as seen by customer:', error);
    // No lanzar error para no interrumpir el flujo
    // El error se loguea pero no se propaga
  }
};

/**
 * Obtiene un chat por su ID
 * @param chatId - ID del chat (orderItemId como string)
 * @returns El documento del chat o null si no existe
 */
export const getChat = async (chatId: string): Promise<ChatDocument | null> => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      return {
        ...(chatSnap.data() as ChatDocument),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

