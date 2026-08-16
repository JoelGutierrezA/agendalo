import { Injectable, signal } from '@angular/core';
import { defer, from, map, Observable, switchMap, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../models/auth.models';
import { SupabaseService } from '../services/supabase.service';

const TOKEN_KEY = 'skedia_token';
const USER_KEY = 'skedia_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private supabase: SupabaseService) {
    void this.restoreSession();

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        this.clearSession();
        return;
      }

      localStorage.setItem(TOKEN_KEY, session.access_token);
      void this.loadProfile(session.user.id, session.access_token);
    });
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.auth.signInWithPassword(payload);

        if (error || !data.session || !data.user) {
          throw new Error(error?.message ?? 'No se pudo iniciar sesion');
        }

      const user = await this.getProfile(data.user.id);
      if (!user.is_active) {
        await this.supabase.client.auth.signOut();
        this.clearSession();
        throw new Error('Tu cuenta esta pendiente de aprobacion. Te avisaremos cuando este activa.');
      }

      return this.buildAuthResponse(user, data.session.access_token);
    }).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return from(this.supabase.client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { name: payload.name },
      },
    })).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.user) {
          throw new Error(error?.message ?? 'No se pudo crear la cuenta');
        }

        if (!data.session) {
          throw new Error('Cuenta creada. Revisa tu correo para confirmar el acceso antes de iniciar sesion.');
        }

        return from(this.getProfile(data.user.id)).pipe(
          map(user => this.buildAuthResponse(user, data.session?.access_token ?? ''))
        );
      }),
      tap(response => this.saveSession(response))
    );
  }

  registerPending(payload: RegisterRequest): Observable<{ message: string }> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: { name: payload.name },
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? 'No se pudo crear la cuenta');
      }

      if (data.session) {
        const { error: profileError } = await this.supabase.client
          .from('profiles')
          .update({ is_active: false })
          .eq('id', data.user.id);

        if (profileError) {
          throw new Error(profileError.message);
        }

        await this.supabase.client.auth.signOut();
        this.clearSession();
      }

      return {
        message: 'Solicitud creada. Un administrador debe aprobar tu cuenta antes de ingresar.',
      };
    });
  }

  logout(): Observable<void> {
    return from(this.supabase.client.auth.signOut()).pipe(
      tap(() => this.clearSession()),
      map(() => undefined)
    );
  }

  endSession(): void {
    this.clearSession();
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    const redirectTo = `${window.location.origin}/restablecer-contrasena`;

    return from(this.supabase.client.auth.resetPasswordForEmail(email, { redirectTo })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
        return { message: 'Te enviamos un enlace para restablecer tu contrasena.' };
      })
    );
  }

  resetPassword(payload: { password: string; token?: string; email?: string; password_confirmation?: string }): Observable<{ message: string }> {
    return from(this.supabase.client.auth.updateUser({ password: payload.password })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
        return { message: 'Contrasena actualizada.' };
      })
    );
  }

  me(): Observable<User> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.auth.getUser();
      if (error || !data.user) throw new Error(error?.message ?? 'Sesion no disponible');
      return this.getProfile(data.user.id);
    });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setCurrentUserBusinessId(businessId: number): void {
    const user = this.currentUser();
    if (!user) return;

    const updated = { ...user, business_id: businessId };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  private saveSession(response: AuthResponse): void {
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    this.currentUser.set(response.data.user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (!data.session) return;

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    await this.loadProfile(data.session.user.id, data.session.access_token);
  }

  private async loadProfile(userId: string, accessToken: string): Promise<void> {
    const user = await this.getProfile(userId);
    if (!user.is_active) {
      await this.supabase.client.auth.signOut();
      this.clearSession();
      return;
    }

    this.saveSession(this.buildAuthResponse(user, accessToken));
  }

  private async getProfile(userId: string): Promise<User> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, name, email, role, business_id, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'No se pudo cargar el perfil');
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      email_verified_at: null,
      role: data.role,
      business_id: data.business_id,
      is_active: data.is_active,
    };
  }

  private buildAuthResponse(user: User, token: string): AuthResponse {
    return {
      success: true,
      data: {
        user,
        business: null,
        token,
      },
    };
  }
}
