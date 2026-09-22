# Política de seguridad

Frame es un producto de **VT Asvent**. La seguridad de quienes lo usan es prioritaria.

## Versiones con soporte

| Versión | Soporte |
| --- | --- |
| La versión estable vigente | ✅ |
| La inmediatamente anterior | ✅ |
| Versiones más antiguas | ❌ — actualiza desde la app |

## Cómo reportar una vulnerabilidad

**No abras un reporte público.** Usa el reporte privado de GitHub:

➡️ [Reportar una vulnerabilidad](https://github.com/GasparRojasDiego/frame-app/security/advisories/new)

Incluye, si puedes:

1. Qué componente afecta (la app de escritorio, la página de descarga o el portal para instituciones).
2. Los pasos exactos para reproducirlo y la versión de Frame.
3. El impacto que crees que tiene.

Recibirás respuesta por el mismo canal. Mientras investigamos, te pedimos no divulgar el problema ni acceder a datos de otras personas. Frame ofrece un **puerto seguro** para la investigación de buena fe, descrito dentro de la app en *Ajustes → Reportar un error*.

## Cómo protegemos las descargas

- Cada versión de la app está **firmada**: Frame solo instala actualizaciones con la firma de VT Asvent.
- Junto a cada versión se publica su huella **SHA-256**. Compruébala antes de instalar:

  ```powershell
  Get-FileHash .\Frame-Setup.exe -Algorithm SHA256
  ```

- Este repositorio solo contiene la página de descarga y los instaladores oficiales. El código fuente de Frame no es público.
