# HomeAlarm
Bot de Alarma con WhatsApp
Descripción
Este proyecto es una aplicación de servidor que utiliza Node.js, Express, y WhatsApp-Web.js para gestionar un sistema de alarma interactivo a través de mensajes de WhatsApp. La aplicación permite a los usuarios registrados controlar una alarma, verificar el estado de sensores, configurar horarios automáticos, activar/desactivar una sirena, y recibir notificaciones en tiempo real sobre eventos de sensores o capturas de imágenes. La aplicación se integra con Firebase para almacenar datos como estados de alarma, sensores, horarios, y contactos, y utiliza una API de transcripción de audio para procesar comandos de voz enviados por WhatsApp.
El sistema está diseñado para:
Gestionar usuarios a través de una API REST.

Controlar una alarma mediante comandos de texto o voz en WhatsApp.

Monitorear sensores y enviar notificaciones automáticas a contactos registrados.

Procesar imágenes capturadas y almacenadas en Firebase Storage.

Automatizar la activación/desactivación de la alarma según horarios configurados.

Requisitos previos
Antes de ejecutar la aplicación, asegúrate de tener instalados los siguientes requisitos:
Node.js (versión 14 o superior)

npm (gestor de paquetes de Node.js)

Firebase Account con un proyecto configurado (Realtime Database y Storage habilitados)

Python (para la API de transcripción de audio, si se utiliza)

WhatsApp (una cuenta para autenticar el cliente de WhatsApp-Web.js)

Instalación
Clonar el repositorio:
bash

git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>

Instalar dependencias:
Ejecuta el siguiente comando para instalar las dependencias listadas en package.json:
bash

npm install

Configurar variables de entorno:
Crea un archivo .env en la raíz del proyecto con las siguientes variables:
env

PORT=3000

PORT: Puerto donde correrá el servidor Express (por defecto 3000).

Configurar Firebase:
Crea un proyecto en Firebase Console.

Genera una clave de cuenta de servicio (JSON) y colócala en el archivo firebaseConfig.json en la raíz del proyecto.

Asegúrate de que la base de datos en tiempo real y el almacenamiento estén habilitados en Firebase.

Configurar la API de transcripción de audio (opcional):
Si usas la transcripción de audio, configura un servidor Python con la API en http://127.0.0.1:5000/transcribe-audio.

Asegúrate de que las dependencias de Python necesarias estén instaladas (por ejemplo, flask).

Estructura de Firebase:
Configura las siguientes rutas en la base de datos en tiempo real de Firebase:
contactos: Almacena los números de teléfono de los usuarios con su estado (true/false) y nombre.

variables: Almacena el estado de los sensores (variable1, variable2, variable3) con sus nombres y estados (true/false).

estado_alarma: Estado booleano de la alarma (true para encendida, false para apagada).

alerta: Estado booleano de la alerta (true para activa, false para inactiva).

sirena: Estado booleano de la sirena (true para encendida, false para apagada).

horarios_alarma: Horarios de activación automática con inicio, fin (formato HH:MM) y state (true/false).

snapshots: Referencias a imágenes capturadas almacenadas en Firebase Storage.

Estructura del proyecto
plaintext

├── firebaseConfig.json      # Configuración de Firebase (credenciales)
├── .env                     # Variables de entorno
├── package.json             # Dependencias y scripts del proyecto
├── models/
│   └── User.js              # Modelo de usuario para la base de datos
├── services/
│   └── whatsappService.js   # Lógica del cliente de WhatsApp y gestión de alarma
├── index.js                 # Archivo principal del servidor Express
└── README.md                # Documentación del proyecto

Dependencias
Las dependencias principales del proyecto son:
express: Framework para crear el servidor HTTP.

whatsapp-web.js: Biblioteca para interactuar con WhatsApp.

qrcode-terminal: Genera códigos QR en la terminal para autenticación.

firebase-admin: SDK para interactuar con Firebase Realtime Database y Storage.

axios: Cliente HTTP para solicitudes a la API de transcripción.

form-data: Manejo de datos multipart/form-data para enviar archivos de audio.

dotenv: Carga variables de entorno desde un archivo .env.

Uso
Iniciar el servidor:
Ejecuta el siguiente comando para iniciar el servidor Express y el cliente de WhatsApp:
bash

npm start

El servidor correrá en http://localhost:3000 (o el puerto especificado en .env).

Autenticación de WhatsApp:
Al iniciar el cliente de WhatsApp por primera vez, se mostrará un código QR en la terminal.

Escanea el código QR con la aplicación de WhatsApp en tu teléfono para autenticar el cliente.

La autenticación se guarda localmente para sesiones futuras.

Comandos de WhatsApp:
Los usuarios registrados pueden enviar los siguientes comandos por WhatsApp:
alarma-on: Enciende la alarma.

alarma-off: Apaga la alarma.

alarma-ver: Muestra el estado de los sensores, horarios, alarma y alerta.

sirena-on: Enciende la sirena.

sirena-off: Apaga la sirena.

configurar alarma HH:MM-HH:MM: Configura horarios automáticos (ej. configurar alarma 23:00-05:00).

horario-off: Desactiva los horarios automáticos.

hermes: Muestra la lista de comandos disponibles.

API REST:
La aplicación incluye una API básica para gestionar usuarios:
POST /users: Crea un nuevo usuario con phone (número de teléfono) y allowed (estado booleano).
bash

curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"phone": "1234567890", "allowed": true}'

GET /users: Obtiene la lista de usuarios registrados.
bash

curl http://localhost:3000/users

Notificaciones:
Los contactos activos reciben notificaciones automáticas cuando:
Un sensor se activa (variables en Firebase cambia a true).

Se detecta una nueva captura de imagen en snapshots.

La alarma se activa/desactiva automáticamente según el horario.

Se activa una alerta porque los sensores están activos al inicio del horario.

Transcripción de audio:
Los mensajes de audio enviados por WhatsApp se transcriben utilizando una API local en http://127.0.0.1:5000/transcribe-audio.

Los comandos de voz reconocidos incluyen activar_alarma, desactivar_alarma, estado_alarma, sirena_on, sirena_off, y saludo.

Detalles técnicos
Estructura del código
index.js
Archivo principal que configura el servidor Express y inicializa el cliente de WhatsApp.
Middleware: Usa express.json() para procesar solicitudes con cuerpo JSON.

Rutas:
POST /users: Crea un nuevo usuario en la base de datos.

GET /users: Lista todos los usuarios registrados.

Inicio del cliente de WhatsApp: Llama a initWhatsAppClient para conectar con WhatsApp.

Puerto: Escucha en el puerto especificado en .env o 3000 por defecto.

services/whatsappService.js
Contiene la lógica principal del cliente de WhatsApp y la gestión de la alarma:
Inicialización de Firebase: Conecta con la base de datos en tiempo real y el almacenamiento de Firebase.

Funciones de tiempo:
horaAMinutos: Convierte una hora en formato HH:MM a minutos desde medianoche.

minutosDesdeMedianoche: Obtiene la hora actual en minutos desde medianoche.

Gestión de sensores:
hayVariablesActivas: Verifica si algún sensor está activo en Firebase.

Gestión de alarma:
verEstadoAlarma: Muestra el estado de los sensores, horarios, alarma y alerta.

checkEstadoCambiado: Verifica si el cambio de estado de la alarma fue exitoso.

actualizarEstadoAlarmaPorHorario: Actualiza automáticamente el estado de la alarma según el horario.

actualizarEstadoAlarma: Actualiza manualmente el estado de la alarma.

Gestión de sirena:
actualizarSirena: Actualiza el estado de la sirena.

checkEstadoSirena: Verifica si el cambio de estado de la sirena fue exitoso.

Notificaciones:
notifyContacts: Envía mensajes o imágenes a contactos activos.

Cliente de WhatsApp:
initWhatsAppClient: Configura el cliente de WhatsApp, maneja autenticación, mensajes entrantes, y escucha cambios en Firebase.

Escucha eventos en tiempo real para sensores (variables) y capturas (snapshots).

Procesa comandos de texto y audio, incluyendo transcripción de audio a través de una API externa.

models/User.js
Define el modelo de usuario para la base de datos (no proporcionado en el código, pero referenciado). Se espera que tenga al menos los campos phone (número de teléfono) y allowed (estado booleano).
Flujo de trabajo
Inicio:
El servidor Express se inicia y configura las rutas API.

El cliente de WhatsApp se inicializa y espera autenticación mediante un código QR.

Autenticación:
Escanea el código QR en la terminal con la aplicación de WhatsApp para conectar el cliente.

Gestión de usuarios:
Usa las rutas /users para agregar o listar usuarios en la base de datos.

Interacción por WhatsApp:
Los usuarios registrados envían comandos por texto o audio.

El sistema procesa los comandos, actualiza Firebase, y responde al usuario.

Los mensajes de audio se transcriben usando una API externa.

Monitoreo en tiempo real:
Escucha cambios en los sensores (variables) y envía notificaciones si un sensor se activa.

Escucha nuevas capturas en snapshots, descarga las imágenes desde Firebase Storage, y las envía a los contactos.

Automatización de alarma:
Cada minuto, verifica si la alarma debe activarse/desactivarse según el horario configurado.

Si hay sensores activos al inicio del horario, activa una alerta en lugar de la alarma.

Problemas conocidos
Dependencia de la API de transcripción: Si la API en http://127.0.0.1:5000/transcribe-audio no está disponible, los mensajes de audio no se procesarán.

Autenticación de WhatsApp: La autenticación puede fallar si la sesión expira o si WhatsApp-Web.js tiene problemas de conexión.

Base de datos: El modelo User y la conexión a la base de datos (connectDB) están referenciados pero no implementados en el código proporcionado.

Contribuciones
Si deseas contribuir al proyecto:
Haz un fork del repositorio.

Crea una rama para tu funcionalidad (git checkout -b feature/nueva-funcionalidad).

Realiza tus cambios y haz commit (git commit -m "Añadir nueva funcionalidad").

Envía un pull request al repositorio principal.

Licencia
Este proyecto no tiene una licencia específica definida. Asegúrate de agregar una licencia (por ejemplo, MIT) si planeas compartir el proyecto públicamente.
Contacto
Para cualquier duda o consulta, contacta al desarrollador en [tu_email@example.com (mailto:tu_email@example.com)].

