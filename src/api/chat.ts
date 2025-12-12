import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Chat {
  id: string;
  orderId: string;
  activityId: string;
  customerId: string;
  providerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage: string;
  unreadForProvider: number;
  unreadForCustomer: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: 'customer' | 'provider';
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
}

export interface CreateChatParams {
  orderId: string;
  customerId: string;
  providerId: string;
  activityId: string;
}

export interface SendMessageParams {
  chatId: string;
  customerId: string;
  text?: string;
  imageFile?: File;
}

export interface SendProviderMessageParams {
  chatId: string;
  providerId: string;
  text?: string;
  imageFile?: File;
}

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

/**
 * Crea o obtiene un chat existente entre cliente y proveedor para una orden
 * @param params - Parámetros del chat
 * @returns El ID del chat (nuevo o existente)
 */
export const createOrGetChat = async (params: CreateChatParams): Promise<string> => {
  const { orderId, customerId, providerId, activityId } = params;

  try {
    console.log('createOrGetChat - Starting with params:', { orderId, customerId, providerId, activityId });
    console.log('createOrGetChat - Firestore db initialized:', !!db);

    // Validar que db esté inicializado
    if (!db) {
      throw new Error('Firestore no está inicializado. Por favor, verifica la configuración de Firebase.');
    }

    // Buscar si ya existe un chat para esta orden
    console.log('createOrGetChat - Searching for existing chat...');
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('orderId', '==', orderId),
      where('customerId', '==', customerId),
      where('providerId', '==', providerId)
    );

    const querySnapshot = await getDocs(q);
    console.log('createOrGetChat - Query result:', querySnapshot.empty ? 'No existing chat found' : 'Existing chat found');

    // Si existe, retornar su ID
    if (!querySnapshot.empty) {
      const existingChat = querySnapshot.docs[0];
      console.log('createOrGetChat - Returning existing chat ID:', existingChat.id);
      return existingChat.id;
    }

    // Si no existe, crear uno nuevo
    console.log('createOrGetChat - Creating new chat...');
    const newChatRef = doc(collection(db, 'chats'));
    await setDoc(newChatRef, {
      orderId,
      activityId,
      customerId,
      providerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      unreadForProvider: 0,
      unreadForCustomer: 0,
    });

    console.log('createOrGetChat - New chat created with ID:', newChatRef.id);
    return newChatRef.id;
  } catch (error) {
    console.error('Error creating or getting chat:', error);
    
    // Mejorar el mensaje de error
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
 * Envía un mensaje en un chat
 * @param params - Parámetros del mensaje
 * @returns El ID del mensaje creado
 */
export const sendMessage = async (params: SendMessageParams): Promise<string> => {
  const { chatId, customerId, text, imageFile } = params;

  try {
    // Validar que haya texto o imagen
    if (!text?.trim() && !imageFile) {
      throw new Error('El mensaje debe contener texto o una imagen');
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

    // Actualizar el chat: lastMessage, updatedAt, unreadForProvider
    const chatRef = doc(db, 'chats', chatId);
    const updateData: any = {
      updatedAt: serverTimestamp(),
      unreadForProvider: await incrementUnreadCount(chatId),
    };

    // Actualizar lastMessage con el texto o indicador de imagen
    if (text?.trim()) {
      updateData.lastMessage = text.trim();
    } else if (imageFile) {
      updateData.lastMessage = '📷 Imagen';
    }

    await updateDoc(chatRef, updateData);

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Incrementa el contador de mensajes no leídos para el proveedor
 */
const incrementUnreadCount = async (chatId: string): Promise<number> => {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const currentUnread = chatSnap.data().unreadForProvider || 0;
    return currentUnread + 1;
  }

  return 1;
};

/**
 * Incrementa el contador de mensajes no leídos para el cliente
 */
const incrementUnreadCountForCustomer = async (chatId: string): Promise<number> => {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const currentUnread = chatSnap.data().unreadForCustomer || 0;
    return currentUnread + 1;
  }

  return 1;
};

/**
 * Escucha mensajes en tiempo real de un chat
 * @param chatId - ID del chat
 * @param callback - Función que se ejecuta cuando hay nuevos mensajes
 * @returns Función para desuscribirse
 */
export const listenMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('sentAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, 'id'>),
      }));
      callback(messages);
    },
    (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    }
  );
};

/**
 * Obtiene un chat por su ID
 */
export const getChat = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      return {
        id: chatSnap.id,
        ...(chatSnap.data() as Omit<Chat, 'id'>),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

/**
 * Obtiene todos los chats de un cliente
 */
export const getCustomerChats = async (customerId: string): Promise<Chat[]> => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('customerId', '==', customerId), orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Chat, 'id'>),
    }));
  } catch (error) {
    console.error('Error getting customer chats:', error);
    throw error;
  }
};

// Variable temporal para el idioma (se puede mejorar con un contexto)
let language: 'es' | 'en' = 'es';

/**
 * Establece el idioma para los mensajes del sistema
 */
export const setChatLanguage = (lang: 'es' | 'en') => {
  language = lang;
};

/**
 * Envía un mensaje desde el proveedor en un chat
 * @param params - Parámetros del mensaje del proveedor
 * @returns El ID del mensaje creado
 */
export const sendProviderMessage = async (params: SendProviderMessageParams): Promise<string> => {
  const { chatId, providerId, text, imageFile } = params;

  try {
    // Validar que haya texto o imagen
    if (!text?.trim() && !imageFile) {
      throw new Error('El mensaje debe contener texto o una imagen');
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
      senderId: providerId,
      senderType: 'provider',
      message: text?.trim() || null,
      imageUrl,
      sentAt: serverTimestamp(),
    });

    // Actualizar el chat: lastMessage, updatedAt, unreadForCustomer
    const chatRef = doc(db, 'chats', chatId);
    const updateData: any = {
      updatedAt: serverTimestamp(),
      unreadForCustomer: await incrementUnreadCountForCustomer(chatId),
    };

    // Actualizar lastMessage con el texto o indicador de imagen
    if (text?.trim()) {
      updateData.lastMessage = text.trim();
    } else if (imageFile) {
      updateData.lastMessage = '📷 Imagen';
    }

    await updateDoc(chatRef, updateData);

    return messageRef.id;
  } catch (error) {
    console.error('Error sending provider message:', error);
    throw error;
  }
};

/**
 * Marca los mensajes de un chat como leídos por el cliente
 * Esto resetea el contador unreadForCustomer a 0
 * @param chatId - ID del chat
 */
export const markAsSeenByCustomer = async (chatId: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadForCustomer: 0,
    });
  } catch (error) {
    console.error('Error marking chat as seen by customer:', error);
    throw error;
  }
};

/**
 * Marca los mensajes de un chat como leídos por el proveedor
 * Esto resetea el contador unreadForProvider a 0
 * @param chatId - ID del chat
 */
export const markAsSeenByProvider = async (chatId: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadForProvider: 0,
    });
  } catch (error) {
    console.error('Error marking chat as seen by provider:', error);
    throw error;
  }
};

