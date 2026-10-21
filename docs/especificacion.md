\# Desarrollo de aplicación web de metas SMART y seguimiento de hábitos



Actúa como un desarrollador full-stack senior, diseñador UX/UI y arquitecto de software.



Quiero que desarrolles una aplicación web completa en \*\*React + TypeScript\*\*, enfocada en ayudar a los usuarios a alcanzar sus metas SMART mediante hábitos recurrentes, visualizar su progreso y mantener su motivación a través de un tablero de visión.



La aplicación debe funcionar realmente, no ser únicamente un prototipo visual.



\*\*REQUISITO FUNDAMENTAL: Toda la aplicación debe estar en español.\*\* Esto incluye navegación, botones, formularios, mensajes de error, onboarding, gráficos, estadísticas, notificaciones, estados y configuraciones. Utiliza un español natural, claro y cercano, sin traducciones literales innecesarias.



\## 1. Tecnologías



Utiliza:



\- React + TypeScript + Vite para el frontend.

\- Tailwind CSS para los estilos.

\- shadcn/ui para los componentes.

\- Lucide React para los íconos.

\- Supabase PostgreSQL para la base de datos.

\- Supabase Auth para autenticación.

\- Supabase Storage para almacenar imágenes.

\- React Router para navegación.

\- Recharts para las estadísticas.

\- date-fns con configuración regional en español.

\- React Hook Form + Zod para formularios y validaciones.

\- Vitest para pruebas.



El código debe ser limpio, modular y mantenible.



Todos los datos deben persistir en Supabase y estar asociados al usuario autenticado.



No utilices localStorage como almacenamiento principal.



\## 2. Diseño adaptable al iPhone 12 Pro Max



La aplicación debe diseñarse principalmente para un \*\*iPhone 12 Pro Max, con dimensiones CSS de 428 × 926 píxeles\*\*.



También debe funcionar en navegadores de computadora, pero siempre conservar el formato visual de una aplicación móvil.



Reglas:



\- En el iPhone, utilizar el ancho disponible de la pantalla.

\- En computadora, centrar la aplicación con un ancho máximo de 428px.

\- No transformar el diseño en un dashboard horizontal de escritorio.

\- Evitar cualquier desbordamiento horizontal.

\- Adaptarse también a pantallas de iPhone más pequeñas.

\- Respetar las áreas seguras de iOS.

\- Utilizar `100dvh` cuando corresponda.

\- Mantener botones y elementos táctiles de al menos 44 × 44px.

\- Incorporar animaciones suaves.



\### Estilo visual



Quiero una interfaz minimalista, moderna, elegante y agradable.



Inspiración: aplicaciones como Things 3, Structured y aplicaciones premium de bienestar y productividad.



Utilizar:



\- Fondo blanco cálido o crema.

\- Tipografía gris oscuro.

\- Colores de acento suaves.

\- Tarjetas con bordes redondeados.

\- Sombras sutiles.

\- Buena separación entre elementos.

\- Indicadores de progreso visuales.

\- Animaciones discretas.



Evitar interfaces recargadas, colores demasiado saturados y exceso de información.



Implementar primero el modo claro, dejando preparada la arquitectura para un futuro modo oscuro.



\## 3. Registro e inicio de sesión



Crear un sistema completo de autenticación.



El usuario debe poder:



\- Registrarse con correo electrónico y contraseña.

\- Iniciar sesión.

\- Cerrar sesión.

\- Recuperar su contraseña.

\- Mantener su sesión iniciada al actualizar la página.



Toda la información debe ser privada y estar asociada a su cuenta.



Implementar políticas Row Level Security en Supabase.



Después de iniciar sesión, dirigir al usuario a Inicio.



Si es un usuario nuevo y no tiene metas, mostrar el proceso para crear su primera meta SMART.



\## 4. Creación de metas SMART



Las metas SMART serán el elemento principal de la aplicación.



Un usuario puede crear múltiples metas.



Cada meta debe incluir:



\### Información general



\- Nombre de la meta.

\- Descripción opcional.

\- Categoría: Educación, Carrera profesional, Salud, Ejercicio, Finanzas, Personal, Creatividad u Otra.

\- Fecha de creación.

\- Fecha límite para alcanzar la meta.

\- Estado: Activa, En pausa, Completada o Archivada.

\- Color identificador opcional.



\### Formulario SMART



Guiar al usuario paso a paso para definir los cinco componentes.



\*\*S: Específica\*\*



¿Qué quieres lograr exactamente?



\*\*M: Medible\*\*



¿Cómo sabrás que alcanzaste tu meta? ¿Qué resultado concreto puedes medir?



\*\*A: Alcanzable\*\*



¿Por qué consideras que puedes conseguir esta meta? ¿Con qué recursos, tiempo o capacidades cuentas?



\*\*R: Relevante\*\*



¿Por qué es importante esta meta para ti? ¿Cómo contribuirá a tus objetivos personales o profesionales?



\*\*T: Temporal\*\*



¿Cuál es la fecha límite para lograrla?



Cada pregunta debe tener una explicación sencilla y un ejemplo.



\### Ejemplo



Meta: Completar mi curso de Coursera.



\- Específica: Completar todos los módulos y evaluaciones del curso.

\- Medible: Finalizar el 100% de los módulos y obtener el certificado.

\- Alcanzable: Dedicar 45 minutos por sesión de estudio.

\- Relevante: Mejorar mis habilidades profesionales.

\- Temporal: Completar el curso antes del 31 de marzo de 2027.



\### Administración de metas



Permitir:



\- Crear nuevas metas.

\- Editar las existentes.

\- Modificar cualquiera de los campos SMART.

\- Cambiar las fechas límite.

\- Marcar manualmente una meta como completada.

\- Poner una meta en pausa.

\- Reanudarla.

\- Archivarla.

\- Restaurar metas archivadas.

\- Eliminarlas permanentemente mediante confirmación.



Archivar una meta no debe borrar su historial.



Cuando una meta está en pausa, sus hábitos no deben aparecer como tareas pendientes en Inicio.



Las metas completadas deben conservar su historial.



\## 5. Hábitos asociados a metas



Después de crear una meta SMART, el sistema debe solicitar al usuario que registre por lo menos un hábito recurrente que le ayude a conseguirla.



\*\*Todos los hábitos deben pertenecer a una meta.\*\*



Una meta puede contener múltiples hábitos.



El usuario también puede tener múltiples metas.



\### Creación de hábitos



Solicitar:



\- Nombre del hábito.

\- Descripción opcional.

\- Meta a la que pertenece.

\- Fecha de inicio.

\- Fecha de finalización.

\- Días de repetición.

\- Hora opcional.

\- Duración estimada opcional.

\- Ícono o color opcional.



\### Frecuencia



Permitir seleccionar:



\- Todos los días.

\- Días específicos de la semana: lunes, martes, miércoles, jueves, viernes, sábado y domingo.

\- Cada cierta cantidad de días.



Priorizar la implementación confiable de las primeras dos modalidades. Implementar la tercera únicamente con reglas claras y pruebas.



\### Ejemplo



Meta: Completar mi curso de Coursera.



Hábito 1:

\- Nombre: Estudiar 45 minutos.

\- Repetición: Lunes, miércoles y viernes.

\- Inicio: 1 de noviembre de 2026.

\- Finalización: 31 de marzo de 2027.



Hábito 2:

\- Nombre: Repasar apuntes.

\- Repetición: Domingo.

\- Inicio: 1 de noviembre de 2026.

\- Finalización: 31 de marzo de 2027.



\### Administración de hábitos



Permitir:



\- Agregar nuevos hábitos a una meta existente.

\- Editar hábitos.

\- Modificar los días de repetición.

\- Ampliar o reducir su fecha de finalización.

\- Cambiar su fecha de inicio.

\- Pausar o reanudar un hábito.

\- Archivarlo.

\- Eliminarlo mediante confirmación.



Los cambios de programación no deben borrar los registros anteriores.



Si el usuario cambia los días de repetición, el sistema debe conservar el calendario histórico para que las estadísticas pasadas no se alteren incorrectamente.



\## 6. Registro diario de cumplimiento



Cada aparición programada de un hábito tendrá uno de estos estados:



\- Completado.

\- No completado.

\- Pendiente.



El usuario debe poder:



\- Marcar hábitos como completados.

\- Desmarcar hábitos.

\- Consultar días anteriores.

\- Corregir registros de fechas anteriores.



No permitir registros duplicados del mismo hábito en una misma fecha.



Los hábitos futuros se mostrarán como programados, pero no podrán marcarse como completados antes de tiempo.



Utilizar la fecha local del usuario para calcular el día correspondiente.



\## 7. Página Inicio



Esta será la pantalla principal y la más utilizada.



Debe funcionar como una agenda diaria de hábitos.



\### Encabezado



Mostrar:



\- Saludo personalizado.

\- Fecha actual.

\- Mensaje motivacional breve.

\- Progreso de cumplimiento del día.



\### Selector de calendario



Crear tres opciones:



\*\*Día | Semana | Mes\*\*



La opción predeterminada será Día.



\### Vista Día



Mostrar:



\- Fecha seleccionada.

\- Selector horizontal de fechas.

\- Hábitos programados para ese día.

\- Hábitos agrupados según su meta.

\- Casillas interactivas para marcar cumplimiento.

\- Porcentaje de cumplimiento diario.



Ejemplo:



Lunes, 2 de noviembre



\*\*Meta: Completar curso de Coursera\*\*

\- \[ ] Estudiar 45 minutos.

\- \[ ] Repasar apuntes.



\*\*Meta: Mejorar mi condición física\*\*

\- \[x] Entrenamiento matutino.

\- \[ ] Estiramientos de 15 minutos.



Cada grupo debe mostrar el nombre de la meta y su progreso.



Los hábitos completados deben tener una confirmación visual sutil y agradable.



\### Vista Semana



Mostrar:



\- Calendario de siete días.

\- Indicadores de cumplimiento por día.

\- Posibilidad de seleccionar un día.

\- Resumen del cumplimiento semanal.

\- Hábitos del día seleccionado.



\### Vista Mes



Mostrar:



\- Calendario mensual completo.

\- Indicadores de cumplimiento.

\- Posibilidad de seleccionar cualquier día.

\- Porcentaje de cumplimiento del mes.

\- Hábitos programados para la fecha seleccionada.



El usuario debe poder navegar entre fechas pasadas y futuras.



Las tareas futuras no deben contarse como incumplidas.



Las tres vistas deben compartir la misma lógica de programación y seguimiento.



\## 8. Página Mis metas



Crear una página llamada \*\*Mis metas\*\*.



Mostrar todas las metas activas mediante tarjetas.



Cada tarjeta debe contener:



\- Nombre de la meta.

\- Categoría.

\- Fecha límite.

\- Porcentaje de progreso.

\- Estado.

\- Días restantes.

\- Número de hábitos asociados.



Al seleccionar una meta, abrir su página de detalle.



\### Detalle de meta



Mostrar:



\- Nombre.

\- Estado.

\- Fecha límite.

\- Los cinco componentes SMART.

\- Indicador de progreso.

\- Hábitos asociados.

\- Estadísticas de cumplimiento.

\- Botón para agregar hábitos.

\- Opciones para editar, pausar, completar o archivar.



\### Cálculo del progreso



Distinguir dos conceptos:



\*\*1. Constancia de hábitos\*\*



Porcentaje de ocasiones programadas en las que el usuario completó sus hábitos.



\*\*2. Avance hacia la meta\*\*



Progreso real respecto al resultado medible definido en la meta SMART.



Ejemplo:



Meta: Completar un curso de 12 módulos.



Permitir configurar:



\- Indicador: Módulos completados.

\- Valor objetivo: 12.

\- Valor actual: 7.

\- Unidad: Módulos.



Mostrar avance: 58.3%.



La constancia de hábitos debe calcularse por separado.



Si una meta no tiene un indicador numérico, mostrar únicamente la constancia y evitar presentarla como porcentaje de cumplimiento de la meta.



No marcar automáticamente una meta como completada solo por haber cumplido sus hábitos.



\## 9. Página Estadísticas



Crear una página llamada \*\*Estadísticas\*\*.



Debe permitir seleccionar:



\- Esta semana.

\- Este mes.

\- Mes anterior.

\- Rango personalizado.



\### Indicadores



\*\*Cumplimiento de hábitos\*\*



Mostrar:



\- Total de hábitos programados dentro del período transcurrido.

\- Total de hábitos completados.

\- Porcentaje de cumplimiento.



Ejemplo:



42 de 56 hábitos completados.



75% de cumplimiento.



\*\*Constancia a lo largo del tiempo\*\*



Crear un gráfico que muestre la evolución diaria o semanal del porcentaje de cumplimiento.



\*\*Progreso de metas\*\*



Mostrar cada meta activa con:



\- Progreso hacia el objetivo, cuando sea medible.

\- Constancia de hábitos.

\- Fecha límite.



\*\*Metas próximas a vencer\*\*



Mostrar:



\- Nombre.

\- Fecha límite.

\- Días restantes.

\- Progreso actual.



Clasificar las metas como:



\- Vencida.

\- Vence en los próximos 7 días.

\- Vence en los próximos 30 días.

\- Más adelante.



Solo las metas activas deben aparecer como próximas a vencer.



\*\*Información adicional\*\*



\- Hábito con mayor constancia.

\- Hábito con menor constancia.

\- Número de metas activas.

\- Número de hábitos activos.

\- Racha actual de cumplimiento, siempre que pueda calcularse correctamente.



\### Reglas estadísticas



\- No incluir hábitos futuros en el denominador de cumplimiento histórico.

\- Distinguir entre pendiente e incumplido.

\- Respetar las fechas de inicio y finalización.

\- Respetar las frecuencias de repetición.

\- Conservar la programación histórica después de realizar cambios.

\- No penalizar períodos en los que una meta o hábito estuvo en pausa.

\- Definir correctamente cómo se incluyen las metas archivadas y completadas en los datos históricos.

\- Mostrar estados vacíos cuando no haya suficiente información.



Las estadísticas deben generarse a partir de datos reales.



\## 10. Página Tablero de visión



Crear una cuarta página llamada \*\*Tablero de visión\*\*.



Esta sección representa la motivación emocional detrás de las metas del usuario.



\### Reflexión escrita



Permitir responder y guardar estas preguntas:



\- ¿En qué persona quiero convertirme?

\- ¿Por qué estas metas son importantes para mí?

\- ¿Cómo será mi vida cuando las consiga?

\- ¿Qué me motiva a seguir adelante?



Los textos deben guardarse automáticamente o mediante un botón Guardar claramente visible.



El usuario debe poder editarlos cuando quiera.



\### Tablero visual



Permitir:



\- Subir imágenes desde el iPhone o computadora.

\- Guardarlas permanentemente.

\- Visualizarlas en una cuadrícula o collage.

\- Eliminarlas.

\- Agregar descripciones opcionales.

\- Asociar una imagen a una meta SMART específica, si lo desea.

\- Organizar el orden de las imágenes.



Utilizar Supabase Storage.



Validar los archivos y configurar acceso privado.



El diseño debe recordar a un moodboard de Pinterest, elegante y visual.



Las imágenes deben mantener sus proporciones originales.



\## 11. Navegación inferior



Crear una barra de navegación fija en la parte inferior con cuatro secciones:



1\. Inicio

2\. Mis metas

3\. Estadísticas

4\. Tablero de visión



Utilizar íconos Lucide y etiquetas en español.



Respetar el área segura inferior del iPhone.



Incluir también una pantalla secundaria de Perfil y Configuración, desde la cual el usuario pueda cerrar sesión.



\## 12. Experiencia inicial del usuario



Diseñar un proceso de bienvenida sencillo y agradable.



\### Flujo



1\. El usuario se registra o inicia sesión.

2\. Aparece una bienvenida que explica cómo las pequeñas acciones ayudan a conseguir grandes metas.

3\. Crea su primera meta SMART.

4\. Completa las cinco preguntas SMART mediante un formulario por pasos.

5\. Selecciona su fecha límite.

6\. Crea su primer hábito recurrente.

7\. Selecciona los días, fecha de inicio y fecha de finalización.

8\. Guarda y entra a Inicio.



El usuario debe poder regresar a pasos anteriores sin perder información.



No mostrar todas las preguntas SMART al mismo tiempo.



\## 13. Arquitectura de base de datos



Diseñar una base de datos relacional en Supabase.



Tablas sugeridas:



\- `profiles`

\- `goals`

\- `habits`

\- `habit\_schedule\_versions`

\- `habit\_completions`

\- `habit\_pauses`

\- `vision\_board\_entries`

\- `vision\_board\_images`



Usar identificadores UUID y relaciones mediante claves foráneas.



Cada meta pertenece a un usuario.



Cada hábito pertenece a una meta.



Cada cumplimiento pertenece a un hábito.



Utilizar correctamente campos de fecha y marca de tiempo.



Implementar:



\- Row Level Security.

\- Restricciones de integridad.

\- Índices para consultas frecuentes.

\- Restricciones de unicidad.

\- Políticas de almacenamiento de imágenes.

\- Estrategia clara de eliminación y archivado.



\### Conservación del historial



Este punto es muy importante.



Si durante noviembre un hábito se repetía lunes y miércoles, pero en diciembre el usuario cambia la frecuencia a martes y jueves, las estadísticas de noviembre deben seguir considerando lunes y miércoles.



Implementar versiones de programación con fechas de vigencia o una solución equivalente.



No generar cantidades ilimitadas de registros para fechas futuras.



Calcular las ocurrencias programadas según los rangos de fechas solicitados.



Guardar los cumplimientos por separado.



Prevenir errores de zona horaria y cambios de horario.



\## 14. Casos especiales



La aplicación debe manejar correctamente:



\- Varias metas simultáneas.

\- Varios hábitos por meta.

\- Hábitos que comienzan en el futuro.

\- Hábitos que ya finalizaron.

\- Extensión de fechas.

\- Cambios de frecuencia.

\- Metas en pausa.

\- Hábitos en pausa.

\- Metas vencidas.

\- Metas sin indicadores numéricos.

\- Cambios en registros de días anteriores.

\- Archivado y restauración.

\- Cambios de zona horaria.

\- Transiciones entre meses y años.

\- Días sin hábitos programados.

\- Metas completadas antes de su fecha límite.



Centralizar los cálculos para que Inicio, Mis metas y Estadísticas utilicen la misma lógica.



\## 15. Experiencia de usuario



Desarrollar las siguientes pantallas:



\- Registro.

\- Inicio de sesión.

\- Recuperación de contraseña.

\- Bienvenida.

\- Creación de meta SMART.

\- Creación de hábito.

\- Inicio con vista Día.

\- Inicio con vista Semana.

\- Inicio con vista Mes.

\- Mis metas.

\- Detalle de meta.

\- Editar meta.

\- Editar hábito.

\- Estadísticas.

\- Tablero de visión.

\- Perfil y Configuración.



Incluir:



\- Estados de carga.

\- Pantallas vacías bien diseñadas.

\- Validaciones.

\- Mensajes de confirmación.

\- Diálogos antes de eliminar información.

\- Mensajes claros ante errores.

\- Componentes accesibles.

\- Animaciones sutiles.

\- Actualizaciones visuales inmediatas cuando sea seguro.



\## 16. Aplicación web instalable (PWA)



Quiero poder agregar la aplicación a la pantalla de inicio de mi iPhone y utilizarla como una app.



Configurar:



\- Web App Manifest.

\- Íconos para iPhone.

\- Apple Touch Icon.

\- Modo standalone.

\- Viewport correcto.

\- Colores del tema.

\- Almacenamiento en caché de archivos estáticos.



No prometer funcionamiento sin conexión ni sincronización offline si esas funciones no están implementadas correctamente.



\## 17. Fases de desarrollo



Trabaja en el siguiente orden:



\*\*Fase 1: Estructura inicial\*\*



Configurar React, TypeScript, Tailwind, rutas, diseño y componentes reutilizables.



\*\*Fase 2: Base de datos y autenticación\*\*



Crear esquema de Supabase, migraciones, políticas de seguridad y sistema de inicio de sesión.



\*\*Fase 3: Metas SMART y hábitos\*\*



Implementar creación, edición, administración y programación recurrente.



\*\*Fase 4: Inicio y calendario\*\*



Desarrollar las vistas Día, Semana y Mes con seguimiento real.



\*\*Fase 5: Estadísticas\*\*



Implementar indicadores, gráficos, progreso y alertas de fechas límite.



\*\*Fase 6: Tablero de visión\*\*



Implementar textos motivacionales, imágenes, almacenamiento y collage.



\*\*Fase 7: Pruebas y optimización\*\*



Corregir errores, validar los cálculos y perfeccionar el diseño móvil.



\## 18. Calidad técnica



Implementar:



\- Componentes reutilizables.

\- Tipado TypeScript.

\- Separación entre interfaz y lógica de negocio.

\- Acceso centralizado a datos.

\- Validación de formularios.

\- Manejo de errores.

\- Variables de entorno.

\- Código organizado.

\- Pruebas de los cálculos más importantes.



Probar especialmente:



\- Inicio y cierre de sesión.

\- Privacidad de información entre usuarios.

\- Creación de metas.

\- Programación recurrente.

\- Registro y desmarcado de hábitos.

\- Cambios históricos de frecuencia.

\- Pausas.

\- Estadísticas.

\- Subida de imágenes.



\## 19. Entregables



Espero recibir:



1\. Aplicación React funcional.

2\. Código fuente completo.

3\. Migraciones SQL de Supabase.

4\. Sistema de autenticación funcional.

5\. Administración persistente de metas y hábitos.

6\. Calendarios funcionales.

7\. Estadísticas calculadas con datos reales.

8\. Tablero de visión funcional.

9\. Configuración PWA.

10\. README con instrucciones para ejecutar y publicar la aplicación.

11\. Archivo `.env.example`.

12\. Pruebas de las funcionalidades principales.



No quiero únicamente un diseño estático ni datos ficticios simulando que la aplicación funciona.



\## 20. Instrucciones finales



Antes de comenzar:



1\. Revisa el directorio del proyecto.

2\. Si no existe una aplicación, inicialízala.

3\. Explícame brevemente la arquitectura que utilizarás.

4\. Define un sistema de diseño consistente.

5\. Organiza un plan de implementación.

6\. Comienza a programar siguiendo las fases.



No te detengas después de presentar el plan.



Toma decisiones técnicas razonables de manera autónoma.



Si necesitas credenciales de Supabase u otra configuración externa, prepara todo lo que puedas y explícame exactamente qué debo configurar.



Nunca incluyas credenciales privadas dentro del frontend.



Verifica el funcionamiento de cada fase antes de continuar.



\*\*Prioridades principales:\*\*



1\. Que las funcionalidades realmente funcionen.

2\. Que todos los datos se guarden correctamente.

3\. Que la experiencia sea excelente en iPhone 12 Pro Max.

4\. Que todo esté en español.

5\. Que el diseño sea minimalista, elegante e intuitivo.

6\. Que el progreso de hábitos y metas sea confiable.



El objetivo final es crear una aplicación personal que transforme metas a largo plazo en acciones pequeñas, medibles y constantes, con una experiencia visual motivadora y agradable.

