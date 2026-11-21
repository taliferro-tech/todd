import { AsyncPipe, NgIf, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterLink, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';
import { PlatformMenuComponent } from './shared/platform-menu/platform-menu.component';
import { AskChatStateService } from './services/ask-chat-state.service';

@Component( {
  selector: 'ask-todd-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, PlatformMenuComponent, AsyncPipe, NgIf],
  template: `
    <!-- Ask TODD header (design 10a/10b). Help and About draw their own. -->
    <header class="ask-head" *ngIf="!isEmbedded && showHeader">
      <a class="ask-head__brand" routerLink="/">
        <span class="ask-head__logo"><img class="brand-mark--light" src="assets/brand/products/svg/light/02-general-assistant.svg" alt="" /><img class="brand-mark--dark" src="assets/brand/products/svg/dark/02-general-assistant.svg" alt="" /></span>
        <span class="ask-head__title">16Ahead <span class="brand-product">General Assistant</span></span>
      </a>
      <nav class="ask-head__actions" aria-label="General Assistant">
        <button type="button" class="ask-pill" *ngIf="chat.hasConversation" (click)="chat.newQuestion()" title="New question">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg><span>New question</span>
        </button>
        <button type="button" class="ask-pill" *ngIf="isChatPage" (click)="chat.openSaved()" title="Saved">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg><span>Saved</span>
        </button>
        <button type="button" class="ask-pill ask-pill--text" *ngIf="!((isLoggedIn$ | async) ?? false)" (click)="signIn()">Sign in</button>
        <app-platform-menu [isAdmin]="(isAdmin$ | async) ?? false" [isLoggedIn]="(isLoggedIn$ | async) ?? false" [userName]="(userName$ | async) ?? ''" [userEmail]="(userEmail$ | async) ?? ''" (signOut)="signOut()" />
      </nav>
    </header>
    <router-outlet />
    <div *ngIf="updateNotice" class="ask-update-notice" role="status" aria-live="polite" data-cy="update-notice">
      <span>{{ updateNotice }}</span>
      <button type="button" *ngIf="chunkRecoveryNeedsManualRefresh" (click)="refreshAfterChunkError()">Refresh</button>
    </div>
  `,
  styleUrl: './app.component.css',
} )
export class AppComponent implements OnInit {
  private readonly authService = inject( AuthService );
  private readonly router = inject( Router );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  private isRecoveringFromChunkError = false;
  /** The page whose files failed to load; the router puts the address back, so the reload goes here instead. */
  private failedNavigationUrl = '';
  readonly chunkRecoveryStorageKey = 'ask-todd-chunk-recovery-attempted';
  updateNotice = '';
  chunkRecoveryNeedsManualRefresh = false;
  readonly chat = inject( AskChatStateService );
  readonly user$ = this.authService.getUser();
  readonly isLoggedIn$ = this.user$.pipe( map( user => !!user?.uid ) );
  readonly isAdmin$ = this.user$.pipe( map( user => user?.uid === environment.taliferroTenantId ) );
  readonly userName$ = this.user$.pipe( map( user => user?.displayName || '' ) );
  readonly userEmail$ = this.user$.pipe( map( user => user?.email || '' ) );
  readonly isEmbedded = typeof window !== 'undefined'
    && new URLSearchParams( window.location.search ).get( 'embedded' ) === 'true';

  /**
   * Chunk-load recovery, lifted from Network's app shell. A page opened before
   * a deploy (Safari restores tabs, and the page itself was cached) asks for
   * page files the deploy deleted; the host answers with the HTML page, the
   * page never loads and only the header shows. Reload once to get the new
   * files; if that already happened this session, offer a Refresh button.
   */
  ngOnInit (): void {
    this.updateRouteFlags( this.router.url );
    if ( !this.isBrowser ) {
      this.router.events.subscribe( ( event ) => { if ( event instanceof NavigationEnd ) this.updateRouteFlags( event.urlAfterRedirects ); } );
      return;
    }
    window.addEventListener( 'error', this.handleWindowError, true );
    window.addEventListener( 'unhandledrejection', this.handleUnhandledRejection );
    this.router.events.subscribe( ( event ) => {
      if ( event instanceof NavigationError && this.isChunkLoadFailure( String( event.error?.message || event.error || '' ).toLowerCase() ) ) {
        this.failedNavigationUrl = event.url;
        this.recoverFromChunkFailure();
      }
      // A page loaded, so any earlier recovery worked; allow it again.
      if ( event instanceof NavigationEnd ) {
        this.updateRouteFlags( event.urlAfterRedirects );
        try { sessionStorage.removeItem( this.chunkRecoveryStorageKey ); } catch { /* storage blocked */ }
      }
    } );
  }

  private readonly handleWindowError = ( event: ErrorEvent ): void => {
    const details = `${ event.message || '' } ${ event.filename || '' }`.toLowerCase();
    if ( this.isChunkLoadFailure( details ) ) this.recoverFromChunkFailure();
  };

  private readonly handleUnhandledRejection = ( event: PromiseRejectionEvent ): void => {
    const reason = event.reason as { message?: string } | string | undefined;
    const details = typeof reason === 'string' ? reason : String( reason?.message || reason || '' );
    if ( this.isChunkLoadFailure( details.toLowerCase() ) ) this.recoverFromChunkFailure();
  };

  private isChunkLoadFailure ( details: string ): boolean {
    return details.includes( 'failed to fetch dynamically imported module' )
      || details.includes( 'importing a module script failed' ) // Safari
      || details.includes( 'is not a valid javascript mime type' ) // Safari
      || details.includes( 'loading chunk' )
      || details.includes( 'expected a javascript module script' )
      || details.includes( 'mime type of "text/html"' );
  }

  private recoverFromChunkFailure (): void {
    if ( this.isRecoveringFromChunkError ) return;
    this.isRecoveringFromChunkError = true;
    let alreadyAttempted = false;
    try {
      alreadyAttempted = sessionStorage.getItem( this.chunkRecoveryStorageKey ) === '1';
      if ( !alreadyAttempted ) sessionStorage.setItem( this.chunkRecoveryStorageKey, '1' );
    } catch { /* storage blocked */ }
    if ( alreadyAttempted ) {
      this.updateNotice = 'General Assistant needs a refresh to finish loading.';
      this.chunkRecoveryNeedsManualRefresh = true;
      this.isRecoveringFromChunkError = false;
      return;
    }
    this.updateNotice = 'General Assistant was updated. Refreshing now…';
    // A moment's wait: the window error can arrive before the router names the page that failed.
    setTimeout( () => this.reloadToFailedPage(), 50 );
  }

  private reloadToFailedPage (): void {
    const target = this.failedNavigationUrl;
    if ( target && target !== this.router.url ) window.location.assign( target );
    else window.location.reload();
  }

  refreshAfterChunkError (): void {
    try { sessionStorage.removeItem( this.chunkRecoveryStorageKey ); } catch { /* storage blocked */ }
    this.reloadToFailedPage();
  }

  /** The conversation lives on the home page (and /awards, which opens over it). Set on each navigation, not computed in the template. */
  isChatPage = false;
  /** Help, About and the sign-in pages draw their own page. */
  showHeader = true;

  private updateRouteFlags ( url: string ): void {
    const path = url.split( /[?#]/ )[0];
    this.isChatPage = path === '/' || path === '/awards';
    this.showHeader = !['/help', '/about', '/login', '/finish-sign-in', '/auth/callback'].includes( path );
  }

  /** Sign in goes through TODD's hosted login, then comes back to this page. */
  signIn (): void {
    this.authService.startHostedSignIn( this.router.url.split( /[?#]/ )[0] || '/' );
  }

  signOut (): void {
    this.authService.logout().subscribe();
  }
}
