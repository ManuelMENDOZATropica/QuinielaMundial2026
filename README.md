# Quiniela Mundial FIFA 2026 - Trópica (Restructured Tailwind Edition)

Aplicación web full-stack de uso interno para el equipo de **Trópica** para realizar la quiniela de la Copa Mundial de la FIFA 2026. 

Esta versión ha sido reestructurada en carpetas independientes para el `backend/` y `frontend/`, e implementa el nuevo sistema de diseño corporativo en tema claro basado en Tailwind CSS, tipografías Montserrat/Work Sans e iconos de Google Material Symbols.

---

## Estructura de Directorios

```
Quiniela mundial/
├── backend/
│   ├── db/
│   │   ├── database.sqlite       (Base de datos local SQLite)
│   │   └── init_db.js            (Script de creación de esquema y seed de 72 partidos de grupos)
│   ├── node_modules/             (Dependencias de Node.js)
│   ├── package.json              (Scripts e instalación del servidor)
│   └── server.js                 (Servidor Express principal con APIs y ruteo estático)
├── frontend/
│   ├── js/
│   │   ├── app.js                (Router SPA, control de estado y peticiones AJAX)
│   │   └── components.js         (Vistas dinámicas renderizadas con clases de Tailwind)
│   └── index.html                (Contenedor principal con menús responsivos de navegación)
└── README.md                     (Este archivo de documentación)
```

---

## Cómo Ejecutar el Proyecto Localmente

El servidor Express se encuentra levantado y activo en el puerto **3005**. Si requieres detenerlo o re-iniciarlo desde cero, ejecuta los siguientes comandos desde la terminal:

### 1. Entrar al directorio del backend e instalar dependencias
```bash
cd backend
npm install
```

### 2. Inicializar la base de datos y fixture oficial
Este comando corre el script que crea las tablas y siembra los partidos oficiales (ej. México vs Sudáfrica en el partido inaugural el 11 de Junio de 2026) junto con las banderas nacionales correspondientes:
```bash
npm run db:init
```

### 3. Levantar el servidor
```bash
npm start
```

Abre tu navegador en: **[http://localhost:3005](http://localhost:3005)**

---

## Flujo de Pruebas Rápidas (Walkthrough)

Para comprobar el correcto funcionamiento de toda la quiniela en pocos segundos:
1. Abre **[http://localhost:3005](http://localhost:3005)** en tu navegador.
2. Inicia sesión instantáneamente con el botón de Google (Demo) para acceder como `Carlos Rodriguez`.
3. Ve a la pestaña **"Predictions"**, ingresa marcadores para el partido **MEX vs USA** y sal del foco (blur) para comprobar el **auto-guardado**.
4. Cierra sesión e ingresa como Administrador con las credenciales oficiales:
   * **Email**: `admin@tropica.me`
   * **Contraseña**: `tropica2026admin`
5. Dirígete a la pestaña **"Admin"**, y haz clic en **"Poblar Base de Datos (Demo)"** para generar 10 empleados con predicciones aleatorias.
6. En el panel izquierdo de administración, ingresa el resultado oficial de **MEX vs USA** (ej. `2 - 1`) y pulsa **"Finalizar"**.
7. Regresa a **"Leaderboards"** para verificar cómo se calculan las puntuaciones (3 pts por acierto exacto, 1 pt por acierto de ganador, 0 pts por error) y se ordenan automáticamente.
