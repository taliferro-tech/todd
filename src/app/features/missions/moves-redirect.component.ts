import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/** Where /missions and /playbooks went (2026-11-22). Exported for the spec. */
export function movesUrlFor ( page: 'missions' | 'playbooks', query: { q?: string | null; playbook?: string | null } ): string {
  if ( page === 'playbooks' ) return 'https://moves.16ahead.com/playbooks';
  const params = new URLSearchParams();
  if ( query.q ) params.set( 'q', query.q );
  if ( query.playbook ) params.set( 'playbook', query.playbook );
  const search = params.toString();
  return `https://moves.16ahead.com/missions/new${search ? `?${search}` : ''}`;
}

/**
 * The General Assistant is free and never creates or changes anything (Ty,
 * 2026-11-22), so asking for work and Playbooks live in Moves now. Old links
 * to /missions and /playbooks land there, with any request kept.
 */
@Component( {
  selector: 'app-moves-redirect',
  standalone: true,
  template: `<p class="moving">Opening Moves… <a [href]="url">Continue to Moves</a></p>`,
  styles: [`.moving { max-width: 640px; margin: 64px auto; padding: 0 16px; font-weight: 600; } .moving a { color: var(--blue, #0a84ff); }`],
} )
export class MovesRedirectComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  url = 'https://moves.16ahead.com/missions/new';

  ngOnInit (): void {
    const page = this.route.snapshot.data['page'] === 'playbooks' ? 'playbooks' : 'missions';
    const q = this.route.snapshot.queryParamMap;
    this.url = movesUrlFor( page, { q: q.get( 'q' ), playbook: q.get( 'playbook' ) } );
    if ( this.isBrowser ) window.location.replace( this.url );
  }
}
