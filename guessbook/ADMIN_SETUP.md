# 🔐 Configuración de Contraseñas de Administrador

## Problema Solucionado

Antes, el sistema aceptaba literalmente el texto "Contraseña especial" como contraseña válida. Ahora las contraseñas se validan contra Firebase.

## Configuración en Firebase

Para configurar las contraseñas de administrador y moderador:

### 1. Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `fenix-guestbook`
3. Ve a **Firestore Database**

### 2. Crear el Documento de Credenciales

1. En Firestore, crea una nueva colección llamada: `system_config`
2. Dentro de `system_config`, crea un documento con ID: `admin_credentials`
3. Agrega los siguientes campos:

```
admin_credentials (documento)
├── adminPassword: "TU_CONTRASEÑA_ADMIN_SEGURA"
├── moderatorPassword: "TU_CONTRASEÑA_MODERADOR_SEGURA"
└── domain: "thisisfenix.github.io"
```

### 3. Ejemplo de Configuración

```json
{
  "adminPassword": "MiContraseñaSuperSegura2024!",
  "moderatorPassword": "ModeradorSeguro2024!",
  "domain": "thisisfenix.github.io"
}
```

### 4. Reglas de Seguridad Recomendadas

Asegúrate de que las reglas de Firestore protejan este documento:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Proteger credenciales de admin
    match /system_config/admin_credentials {
      allow read: if request.auth != null || 
                     request.resource.data.domain == 'thisisfenix.github.io';
      allow write: if false; // Solo editable desde Firebase Console
    }
  }
}
```

## Cómo Funciona Ahora

1. El usuario ingresa una contraseña en el panel de admin
2. La contraseña se envía a `checkAdminAccess(password)`
3. Firebase verifica la contraseña contra `system_config/admin_credentials`
4. Si coincide con `adminPassword`: acceso de administrador completo
5. Si coincide con `moderatorPassword`: acceso de moderador
6. Si no coincide: acceso denegado

## Cambiar Contraseñas

Para cambiar las contraseñas:

1. Ve a Firebase Console
2. Navega a Firestore Database
3. Busca: `system_config` > `admin_credentials`
4. Edita los campos `adminPassword` o `moderatorPassword`
5. Guarda los cambios

## Seguridad Adicional

- ✅ Las contraseñas NO están hardcodeadas en el código
- ✅ Las contraseñas se verifican en el servidor (Firebase)
- ✅ El dominio debe ser autorizado
- ✅ Sistema de rate limiting para prevenir fuerza bruta
- ✅ Logs de seguridad para auditoría

## Notas Importantes

- **NUNCA** compartas las contraseñas públicamente
- Usa contraseñas fuertes (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos)
- Cambia las contraseñas periódicamente
- Revisa los logs de seguridad regularmente en `security_logs`

## Primer Uso

Si es la primera vez que configuras el sistema:

1. Crea el documento en Firebase como se indica arriba
2. Establece contraseñas seguras
3. Prueba el acceso desde el guestbook
4. Verifica que funcione correctamente
5. Guarda las contraseñas en un lugar seguro (gestor de contraseñas)

---

**Última actualización:** Diciembre 2024
**Versión:** 2.2.1
