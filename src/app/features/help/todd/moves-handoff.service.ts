import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

/** What the gate said about a request asked here. */
export type HandoffRoute =
  | { kind: 'answer'; text: string }
  | { kind: 'handoff'; url: string }
  | { kind: 'mission'; id: string }
  | null;

/** A planned Mission as the chat shows it. */
export interface MissionGlance {
  status: string;
  summary: string;
  reason: string;
  stepCount: number;
}

/** Where real work goes when the gate can't say (an error): Moves' New Mission with the request filled in. */
export function movesNewMissionUrl ( request: string ): string {
  return `https://moves.16ahead.com/missions/new?${new URLSearchParams( { q: request } ).toString()}`;
}

/**
 * The General Assistant never starts or changes a Mission (Ty, 2026-11-22). It
 * asks the Missions gate with handoff: 'moves'. A question one read tool can
 * answer comes back answered. Real work: a paid workspace gets the Mission
 * planned right away and the chat links to it in Moves; a free one gets a link
 * to Moves with the request filled in (2026-11-26). Starting it, answering its
 * questions and every other change happen in Moves.
 */
@Injectable( { providedIn: 'root' } )
export class MovesHandoffService {
  private readonly http = inject( HttpClient );
  private readonly base = `${environment.backendURL}/orchestration/missions`;

  async route ( request: string, context: Record<string, unknown> = {} ): Promise<HandoffRoute> {
    try {
      const res: any = await firstValueFrom( this.http.post<any>( this.base, { request, origin: 'ask', handoff: 'moves', context } ) );
      if ( res?.mode === 'mission' && res?.mission?.id ) return { kind: 'mission', id: String( res.mission.id ) };
      if ( res?.mode === 'handoff' ) return { kind: 'handoff', url: typeof res.url === 'string' && res.url.startsWith( 'https://moves.16ahead.com/' ) ? res.url : movesNewMissionUrl( request ) };
      if ( res?.tool && res?.summary ) return { kind: 'answer', text: String( res.summary ) };
      return null;
    } catch {
      return null;
    }
  }

  /** The Mission's status, for the chat's "Working…" line; null on an error. */
  async glance ( id: string ): Promise<MissionGlance | null> {
    try {
      const res: any = await firstValueFrom( this.http.get<any>( `${this.base}/${encodeURIComponent( id )}` ) );
      const m = res?.mission;
      if ( !m ) return null;
      return { status: String( m.status || '' ), summary: String( m.summary || '' ), reason: String( m.reason || '' ), stepCount: Array.isArray( m.steps ) ? m.steps.length : 0 };
    } catch {
      return null;
    }
  }
}
