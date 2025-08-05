# Nombre del Proyecto: IEM IPDD 12 - Backend

Quiero crear un proyecto para una organización que necesita registrar informes, para lo cuál una persona es la encargada de registrar informes cada semana. Actualmente registran su informe de forma manual en un papel y lo que quiero lograr es poner esto en un sistema.



Se ha logrado identificar los siguientes Modulos

## Autenticación

**Tecnología**

Se debe usar cognito para la autenticación y debe ser con username o email y password, no debe existir un proceso de registro, solo de autenticación.

En esta versión no es necesario validar los permisos y el alcance de permisos que tiene cada usuario, suficiente con que exista en la consolga de cognito para que se pueda autenticar.

Es requisito que el usuario deba estar logeado para acceder a cualquier sección del sistema.

El usuario puedo cerrar sessión en cualquier momento que lo desee.



## Registros de Informes

Para acceder a esta sección el usuario debe estar autenticado y el backend debe contemplar los campos mencionados para subir el informe. Campos a subir

- Fecha de registro: Fecha y Hora: Campo de fecha y hora
- Fecha y hora de reunión: Fecha y Hora: Campo de fecha y hora
- Encargado Lider: Persona encargada de la reunión: un select para seleccionar a la persona encargada, debe ser una referencia a persona
- Teléfono de la Persona Encargada: un campo de teléfono
- Colaborador: Si tuvo asistente en la reunión indicar la persona: Este campo es opcional, debe ser un campo de texto y no debe ser referencia a Persona
- Lugar: Lugar de la reunión
- Recaudación: En cada reunión hay una recaudación en este campo se debe llenar e indica el monto recaudado
- Moneda: Indica si es USD, BOB: debe ser un select
- Parcipantes: Se debe incluir 0 o más participantes, de cada participante solo es necesario incluir el nombre del participante e indicar el tipo de participante, debe ser un select con opciones como (M -> Miembro), (V -> Visitas), (P -> Participantes)
- Adjuntos: También de forma opcional se puede incluir múltiples archivos adjuntos
- Tipo de Informe: Debe ser un select con estas opciones
  - celula: Célula
  - culto: Culto de Celebración
- Cantidad de Asistentes: un entero para indicar la cantidad de personas asistentes a la reunión.
- Dirección Google Maps Link: string : donde se hizo la reunión



El usuario autenticado puede modificar registros, eliminar y/o crear informes.

**Tecnologías**

- Para guardar los archivos adjuntos debe ser en S3
- Debe ser un endpoint en fast api por cada acción



## Registro de Personas

El usuario debe estar autenticado.

El usuario puede crear, modificar, eliminar personas, se debe considerar los siguientes campos:

- Nombre: string
- Apellido: string
- Fecha de Nacimiento: date
- Celular: string
- Dirección de vivienda: string
- Dirección Google Maps Link: string



**Tecnologías**

- debe ser un endpoint de fast api para cada acción
  - crear
  - update
  - delete



## Definición

Genera dentro de un folder solo parte backend, es decir crea un folder `backend` y ahí pone todo lo descrito arriba.

En cuanto a requisitos de tecnología, todo debe estar bajo los siguientes lineamientos.

- Debe ser python 3.9 y una función lambda de aws que contenga a todos los módulos de forma organizada con FAST API. la versión del endpoint debe ser `v1` en esta iteración del proyecto.
- Todo debe ser creado desde un stack de cloudformation, quiero que me crees 2 stacks de cloudfobmation, uno para la data persistente y lógica de negocio
- En el template de data persistente incluir todos los buckets s3, esto para guardar archivos adjuntos o cualquier file que desearamos guardar al igual que la base de datos que será una RDS t2.medium. También aquí incluir la creación de recursos necesarios para trabajar con Cognito
- En el template de lógica de negocio debe ser soportado para severless y debe incluir la función lambda de aws para  python 3.9
- Para realizar un endpoint debe ser usando el recurso de AWS API GATEWAY y este recurso igual incluir en el template de lógica de negocio y asociar la lambda usando `Path: /{proxy+}`
- Usa buenas prácticas de coding y buenos patrones de diseño considerando que este proyecto puede ser flexible y escalable
- Para la definición de un eschema principal sigue la imagen adjuntada que es un pequeño diagrama de base de datos para los eschemas iniciales
- Para python usa el ORM Alchemy para acceder a BD.
- El deploy debe hacerse usando SAM y las variables de entorno estar definidas en un `samconfig.toml`



## Notas importantes

- Todo lo que tenga que ver con código es muy impotante que lo hagas en inglés, variables en inglés, comentarios en inglés absolutamente todo. Solo el prompt que te estoy dando será en español pero luego todo en inglés.