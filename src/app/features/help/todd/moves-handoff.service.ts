import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

/** What the gate said about a request asked here. */
export type HandoffRoute =
  | { kind: 'answer'; text: string }
  | { kind: 'handoff'; url: string }
  | null;

/** Where real work goes when the gate can't say (an error): Moves' New Mission with the request filled in. */
export function movesNewMissionUrl ( request: string ): string {
  return `https://moves.16ahead.com/missions/new?${new URLSearchParams( { q: request } ).toString()}`;
}

/**
 * The General Assistant is free and never creates or changes anything (Ty,
 * 2026-11-22). It asks the Missions gate with handoff: 'moves'. A question one
 * read tool can answer comes back answered; real work comes back as a link to
 * Moves with the request filled in, where the person plans and starts it.
 * The backend refuses Mission writes from this site whatever is sent.
 */
@Injectable( { providedIn: 'root' } )
export class MovesHandoffService {
  private readonly http = inject( HttpClient );
  private readonly base = `${environment.backendURL}/orchestration/missions`;

  async route ( request: string, context: Record<string, unknown> = {} ): Promise<HandoffRoute> {
    try {
      const res: any = await firstValueFrom( this.http.post<any>( this.base, { request, origin: 'ask', handoff: 'moves', context } ) );
      if ( res?.mode === 'handoff' ) return { kind: 'handoff', url: typeof res.url === 'string' && res.url.startsWith( 'https://moves.16ahead.com/' ) ? res.url : movesNewMissionUrl( request ) };
      if ( res?.tool && res?.summary ) return { kind: 'answer', text: String( res.summary ) };
      return null;
    } catch {
      return null;
    }
  }
}
