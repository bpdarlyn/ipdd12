Crea una aplicación React frontend, dentro de un folder frontend que pueda ser capaz de integrarse a todos los endpoints del backend (ver definición del folde backend), que sea minimalista usando la última versión de React (18+) con las siguientes características:

**Estructura del proyecto:**

- Usa Vite como bundler para mejor rendimiento
- Estructura de carpetas limpia: src/components, src/hooks, src/services, src/utils
- Configuración TypeScript opcional pero recomendada

**Funcionalidades principales:**

- Conexión HTTP a backend REST API usando fetch o axios
- Manejo de estados con hooks nativos (useState, useEffect, useContext)
- Componentes funcionales únicamente
- Formularios para operaciones CRUD básicas
- Manejo de errores y estados de carga
- Responsive design básico

**Estilo minimalista:**

- CSS modules o styled-components para estilos
- Paleta de colores neutra (grises, blancos, un color de acento)
- Tipografía simple y legible
- Espaciado consistente
- Sin librerías de UI pesadas (evitar Material-UI, Ant Design)

**Configuración HTTP:**

- Variables de entorno para URL base del backend
- Interceptores para headers comunes (Authorization, Content-Type)
- Manejo de respuestas y errores HTTP estandarizado
- Loading states y error boundaries
- Todas las vistas requieren que el usuario esté autenticado excepto obviamente la de autenticarse, pero si esta autenticado no debe entrar a la pagina de autenticación

**Estructura sugerida de componentes:**

- App.js (componente principal)
- Header/Navigation básico
- Lista de elementos con paginación simple
- Formulario de creación/edición
- Componente de error y loading

**Tecnologías específicas:**

- React 18+ con hooks
- React Router para navegación
- Context API para estado global si es necesario
- Fetch API nativo o axios para HTTP



