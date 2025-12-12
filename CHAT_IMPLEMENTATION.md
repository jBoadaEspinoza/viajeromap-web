# 🔥 Sistema de Chat en Tiempo Real - ViajeroMap

## 📋 Índice

1. [Arquitectura de Firestore](#arquitectura-de-firestore)
2. [Servicios TypeScript](#servicios-typescript)
3. [Componentes React](#componentes-react)
4. [Utilidades](#utilidades)
5. [Estructura de Datos](#estructura-de-datos)
6. [Flujo de Funcionamiento](#flujo-de-funcionamiento)
7. [Guía para Activar Flujo PROVEEDOR → CLIENTE](#guía-para-activar-flujo-proveedor--cliente)

---

## 🗄️ Arquitectura de Firestore

### Colección `chats/`

Cada documento representa un chat entre un cliente y un proveedor para una orden específica.

**Campos:**
```typescript
{
  orderId: string;              // ID de la orden
  activityId: string;            // ID de la actividad
  customerId: string;            // ID del cliente (Firebase UID)
  providerId: string;            // ID/Nombre del proveedor
  createdAt: Timestamp;          // Fecha de creación
  updatedAt: Timestamp;          // Última actualización
  lastMessage: string;           // Último mensaje enviado
  unreadForProvider: number;      // Contador de mensajes no leídos
}
```

### Subcolección `messages/`

Dentro de cada chat, se almacenan los mensajes.

**Campos:**
```typescript
{
  senderId: string;              // ID del remitente (siempre cliente por ahora)
  senderType: "customer";        // Tipo de remitente
  message: string | null;        // Texto del mensaje (null si solo hay imagen)
  imageUrl: string | null;       // URL de la imagen (null si solo hay texto)
  sentAt: Timestamp;             // Fecha y hora de envío
}
```

### Storage: `chat_uploads/{chatId}/{messageId}`

Las imágenes se almacenan en Firebase Storage con esta estructura de rutas.

---

## 🔧 Servicios TypeScript

### `src/api/chat.ts`

#### `createOrGetChat(params: CreateChatParams): Promise<string>`

Crea o obtiene un chat existente entre cliente y proveedor para una orden.

**Parámetros:**
```typescript
{
  orderId: string;
  customerId: string;
  providerId: string;
  activityId: string;
}
```

**Retorna:** `chatId: string`

**Funcionamiento:**
1. Busca si ya existe un chat con los mismos `orderId`, `customerId` y `providerId`
2. Si existe → retorna su ID
3. Si no existe → crea uno nuevo y retorna su ID

#### `sendMessage(params: SendMessageParams): Promise<string>`

Envía un mensaje en un chat.

**Parámetros:**
```typescript
{
  chatId: string;
  customerId: string;
  text?: string;        // Opcional si hay imagen
  imageFile?: File;     // Opcional si hay texto
}
```

**Retorna:** `messageId: string`

**Funcionamiento:**
1. Valida que haya texto o imagen
2. Si hay imagen:
   - Sube la imagen a Storage: `chat_uploads/{chatId}/{messageId}`
   - Obtiene la URL de descarga
3. Crea el documento en `messages/`
4. Actualiza el chat:
   - `lastMessage`: texto o "📷 Imagen"
   - `updatedAt`: timestamp actual
   - `unreadForProvider`: incrementa en 1

#### `listenMessages(chatId: string, callback: Function): Unsubscribe`

Escucha mensajes en tiempo real usando `onSnapshot`.

**Parámetros:**
- `chatId`: ID del chat
- `callback`: Función que recibe el array de mensajes

**Retorna:** Función para desuscribirse

**Funcionamiento:**
1. Crea una query ordenada por `sentAt` ascendente
2. Usa `onSnapshot` para escuchar cambios en tiempo real
3. Ejecuta el callback cada vez que hay cambios
4. Retorna función para desuscribirse

---

## 🧩 Componentes React

### `ChatButton.tsx`

Botón que abre el chat. Se integra fácilmente en cualquier parte de la aplicación.

**Props:**
```typescript
{
  orderId: string;
  providerId: string;
  activityId: string;
  providerName?: string;
  activityTitle?: string;
  variant?: 'success' | 'primary' | 'outline-primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Funcionamiento:**
1. Al hacer clic, llama a `createOrGetChat`
2. Si el chat se crea/obtiene exitosamente, abre `ChatWindow`
3. El botón se oculta automáticamente cuando el chat está abierto

### `ChatWindow.tsx`

Ventana principal del chat. Maneja la visualización de mensajes y el envío.

**Props:**
```typescript
{
  chatId: string;
  providerName: string;
  activityTitle?: string;
  orderId: string;
  onClose: () => void;
  isMobile?: boolean;
}
```

**Características:**
- **Desktop**: Panel lateral fijo a la derecha (350px)
- **Móvil**: Pantalla completa
- Escucha mensajes en tiempo real
- Auto-scroll al final cuando hay nuevos mensajes
- Muestra loader mientras carga
- Header con título de actividad truncado

### `MessageBubble.tsx`

Burbuja de mensaje individual.

**Props:**
```typescript
{
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
  isCustomer: boolean;
}
```

**Estilos:**
- Cliente: `bg-primary text-white` (alineado a la derecha)
- Proveedor: `bg-light text-dark border` (alineado a la izquierda)
- Imágenes: Cards Bootstrap con `max-width: 300px`

### `ChatInput.tsx`

Input para escribir y enviar mensajes.

**Props:**
```typescript
{
  onSendMessage: (text: string, imageFile?: File) => void;
  disabled?: boolean;
  language?: 'es' | 'en';
}
```

**Características:**
- Input de texto con placeholder
- Botón para seleccionar imagen
- Preview de imagen antes de enviar
- Validación de archivos (JPG, PNG, GIF, WEBP, máx 5MB)
- Envío con Enter o botón
- Deshabilitado mientras se envía

---

## 🛠️ Utilidades

### `src/utils/chatUtils.ts`

#### `formatTimestampToLocalTime(timestamp: Timestamp): string`

Formatea un timestamp a hora local en formato AM/PM.

**Ejemplo:** `"2:30 PM"`

#### `formatTimestampToDateTime(timestamp: Timestamp, language: 'es' | 'en'): string`

Formatea un timestamp a fecha y hora completa.

**Ejemplo:** `"15 Ene, 2:30 PM"`

#### `sanitizeMessage(text: string): string`

Sanitiza un mensaje removiendo HTML y scripts maliciosos.

**Retorna:** Texto plano seguro

#### `isValidImageFile(file: File): boolean`

Valida si un archivo es una imagen válida.

**Validaciones:**
- Tipo: JPG, PNG, GIF, WEBP
- Tamaño máximo: 5MB

#### `createImagePreview(file: File): string | null`

Crea una URL de preview para una imagen.

**Retorna:** URL del objeto o `null` si hay error

#### `revokeImagePreview(url: string): void`

Revoca una URL de preview para liberar memoria.

---

## 📊 Estructura de Datos

### Ejemplo de Chat en Firestore

```json
{
  "id": "chat_abc123",
  "orderId": "order_xyz789",
  "activityId": "activity_123",
  "customerId": "customer_firebase_uid",
  "providerId": "Provider Name",
  "createdAt": {
    "_seconds": 1704067200,
    "_nanoseconds": 0
  },
  "updatedAt": {
    "_seconds": 1704067800,
    "_nanoseconds": 0
  },
  "lastMessage": "Hola, tengo una pregunta sobre la actividad",
  "unreadForProvider": 2
}
```

### Ejemplo de Mensaje en Firestore

```json
{
  "id": "msg_456",
  "senderId": "customer_firebase_uid",
  "senderType": "customer",
  "message": "Hola, tengo una pregunta sobre la actividad",
  "imageUrl": null,
  "sentAt": {
    "_seconds": 1704067800,
    "_nanoseconds": 0
  }
}
```

### Ejemplo de Mensaje con Imagen

```json
{
  "id": "msg_789",
  "senderId": "customer_firebase_uid",
  "senderType": "customer",
  "message": null,
  "imageUrl": "https://firebasestorage.googleapis.com/v0/b/.../chat_uploads/chat_abc123/msg_789",
  "sentAt": {
    "_seconds": 1704067900,
    "_nanoseconds": 0
  }
}
```

---

## 🔄 Flujo de Funcionamiento

### 1. Cliente hace clic en "Chatear con proveedor"

```
Usuario → ChatButton → createOrGetChat()
```

### 2. Se crea o obtiene el chat

```
createOrGetChat() → Busca chat existente
  ├─ Existe → Retorna chatId
  └─ No existe → Crea nuevo chat → Retorna chatId
```

### 3. Se abre la ventana de chat

```
ChatButton → ChatWindow (con chatId)
  └─ listenMessages(chatId) → Escucha en tiempo real
```

### 4. Cliente envía un mensaje

```
ChatInput → sendMessage()
  ├─ Si hay imagen → Sube a Storage
  ├─ Crea documento en messages/
  └─ Actualiza chat (lastMessage, updatedAt, unreadForProvider)
```

### 5. Mensaje aparece en tiempo real

```
Firestore → onSnapshot → ChatWindow → MessageBubble
  └─ Auto-scroll al final
```

---

## 🚀 Guía para Activar Flujo PROVEEDOR → CLIENTE

### Paso 1: Actualizar `sendMessage` en `src/api/chat.ts`

Modificar la función para aceptar `senderType`:

```typescript
export interface SendMessageParams {
  chatId: string;
  senderId: string;           // Cambiar de customerId a senderId
  senderType: 'customer' | 'provider';  // Agregar senderType
  text?: string;
  imageFile?: File;
}

export const sendMessage = async (params: SendMessageParams): Promise<string> => {
  const { chatId, senderId, senderType, text, imageFile } = params;
  
  // ... código de subida de imagen ...
  
  // Crear mensaje
  const messageRef = await addDoc(messagesRef, {
    senderId,
    senderType,  // Usar el parámetro
    message: text?.trim() || null,
    imageUrl,
    sentAt: serverTimestamp(),
  });
  
  // Actualizar unreadForProvider solo si es del cliente
  if (senderType === 'customer') {
    updateData.unreadForProvider = await incrementUnreadCount(chatId);
  } else {
    // Si es del proveedor, podría incrementar unreadForCustomer
    // (necesitarías agregar ese campo al chat)
  }
  
  // ... resto del código ...
};
```

### Paso 2: Agregar campo `unreadForCustomer` al chat

```typescript
export interface Chat {
  // ... campos existentes ...
  unreadForCustomer: number;  // Agregar este campo
}
```

### Paso 3: Crear componente para proveedor

Crear `src/components/chat/ProviderChatWindow.tsx` similar a `ChatWindow.tsx` pero:
- Mostrar mensajes del proveedor alineados a la izquierda
- Mostrar mensajes del cliente alineados a la derecha
- Usar `senderType: 'provider'` al enviar

### Paso 4: Actualizar `MessageBubble.tsx`

Ya está preparado para mostrar mensajes de ambos lados usando `isCustomer`.

### Paso 5: Crear vista en la extranet

En la extranet del proveedor:
1. Listar chats con `getProviderChats(providerId)`
2. Mostrar contador de `unreadForProvider`
3. Al abrir un chat, usar `ProviderChatWindow`
4. Al enviar, usar `sendMessage` con `senderType: 'provider'`

### Paso 6: Reglas de Seguridad Firestore

Agregar reglas para que el proveedor solo pueda:
- Leer sus propios chats
- Escribir mensajes con `senderType: 'provider'`

```javascript
match /chats/{chatId} {
  allow read: if request.auth != null && 
    (resource.data.providerId == request.auth.uid || 
     resource.data.customerId == request.auth.uid);
  
  match /messages/{messageId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null && 
      (request.resource.data.senderId == request.auth.uid);
  }
}
```

---

## 📝 Notas Importantes

1. **Autenticación**: El sistema requiere que el usuario esté autenticado con Firebase Auth
2. **Storage**: Las imágenes se suben automáticamente a Firebase Storage
3. **Tiempo Real**: Los mensajes se actualizan automáticamente usando `onSnapshot`
4. **Responsive**: El chat se adapta automáticamente a desktop y móvil
5. **Sanitización**: Todos los mensajes de texto se sanitizan antes de mostrar
6. **Validación**: Las imágenes se validan antes de subir (tipo y tamaño)

---

## 🐛 Troubleshooting

### El chat no se abre
- Verificar que el usuario esté autenticado
- Verificar que `orderId`, `providerId` y `activityId` sean válidos
- Revisar la consola para errores de Firestore

### Los mensajes no aparecen
- Verificar que `listenMessages` esté suscrito
- Verificar reglas de seguridad de Firestore
- Verificar que el `chatId` sea correcto

### Las imágenes no se suben
- Verificar permisos de Storage
- Verificar que el archivo sea válido (tipo y tamaño)
- Revisar reglas de seguridad de Storage

---

## ✅ Checklist de Implementación

- [x] Firestore configurado
- [x] Servicios de chat creados
- [x] Componentes React creados
- [x] Utilidades creadas
- [x] Integración con Bookings.tsx
- [x] Documentación completa
- [ ] Reglas de seguridad Firestore (pendiente configuración)
- [ ] Testing (pendiente)
- [ ] Flujo proveedor → cliente (pendiente)

---

**Desarrollado para ViajeroMap** 🗺️

