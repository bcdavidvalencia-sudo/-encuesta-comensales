# Encuesta de Satisfacción — Comensales

App web simple (sin backend) para que los comensales califiquen su experiencia
(Comida, Servicio, Ambiente, Limpieza) desde el celular, y para que el equipo
del restaurante vea los resultados en un panel.

Pensada para usarse en **varios comedores/ubicaciones**: cada respuesta indica
a qué comedor pertenece, y el panel de resultados permite filtrar por comedor.

## Uso

Abre `index.html` en cualquier navegador (o publícalo con GitHub Pages, ver
abajo). No requiere servidor ni base de datos: las respuestas se guardan en el
`localStorage` del navegador de cada dispositivo.

- **Pestaña "Encuesta"**: la llena el comensal.
- **Pestaña "Resultados"**: panel para el equipo del restaurante — promedios,
  distribución de calificaciones, comentarios recientes, filtro por comedor,
  exportar a CSV y código QR para imprimir.

> Nota: como los datos viven en el navegador de cada persona, el panel de
> "Resultados" solo muestra las respuestas enviadas desde ese mismo
> dispositivo/navegador. Para centralizar resultados de muchos comensales en
> un solo panel administrable, el siguiente paso sería agregar un backend
> (por ejemplo, un endpoint simple o una hoja de cálculo conectada).

## Desarrollo local

`serve.ps1` levanta un servidor estático simple en `http://localhost:8791`
(útil porque abrir el `index.html` con doble clic bloquea `fetch`/módulos en
algunos navegadores):

```powershell
powershell -File serve.ps1
```

## Despliegue en GitHub Pages

1. Sube este contenido a un repositorio de GitHub.
2. En el repositorio: **Settings → Pages → Source: Deploy from a branch**,
   selecciona la rama `main` y la carpeta `/ (root)`.
3. La app queda publicada en `https://<usuario>.github.io/<repositorio>/`
   — en este repo: `https://bcdavidvalencia-sudo.github.io/-encuesta-comensales/`.

## Código QR

`qr-code.png` apunta a la URL de GitHub Pages de este proyecto. Si cambias el
nombre de usuario o del repositorio, regenera el QR con la nueva URL, por
ejemplo desde:
`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=<URL-CODIFICADA>`
