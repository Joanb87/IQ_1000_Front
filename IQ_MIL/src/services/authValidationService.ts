import { usuariosService, type Usuario } from './usuariosService';

export interface ValidationResult {
  isValid: boolean;
  user?: Usuario;
  role?: 'admin' | 'lider' | 'usuario';
  error?: string;
}

export const authValidationService = {
  /**
   * Valida que el usuario actual tenga un token válido, exista en BD y esté activo
   */
  async validateCurrentUser(email: string): Promise<ValidationResult> {
    try {
      // 1. Verificar que el token sea válido (implícito en la llamada autenticada)
      const usuario = await usuariosService.obtener(email);
      
      if (!usuario) {
        return {
          isValid: false,
          error: 'Usuario no registrado en el sistema'
        };
      }

      if (!usuario.activo) {
        return {
          isValid: false,
          error: 'Usuario inactivo. Contacte al administrador'
        };
      }

      // Mapear role_id a rol textual
      const roleMapping: Record<number, 'admin' | 'lider' | 'usuario'> = {
        1: 'admin',
        2: 'lider', 
        3: 'usuario'
      };

      const role = usuario.role_id ? roleMapping[usuario.role_id] : undefined;
      
      if (!role) {
        return {
          isValid: false,
          error: 'Rol de usuario no válido'
        };
      }

      return {
        isValid: true,
        user: usuario,
        role
      };

    } catch (error: any) {
      // Si el token es inválido o hay error de red, la llamada fallará
      return {
        isValid: false,
        error: error?.message || 'Error de autenticación'
      };
    }
  },

  /**
   * Verifica si un usuario tiene acceso a una ruta específica
   */
  hasAccess(userRole: 'admin' | 'lider' | 'usuario', requiredRole: 'admin' | 'lider' | 'usuario'): boolean {
    const roleHierarchy: Record<string, number> = {
      'admin': 3,
      'lider': 2, 
      'usuario': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  /**
   * Obtiene la ruta por defecto según el rol del usuario
   */
  getDefaultRoute(role: 'admin' | 'lider' | 'usuario'): string {
    const routes = {
      'admin': '/admin',
      'lider': '/leader', 
      'usuario': '/user'
    };
    return routes[role];
  }
};