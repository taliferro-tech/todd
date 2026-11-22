/**
 * The General Assistant is free and never creates or changes anything (Ty,
 * 2026-11-22). Real work is handed to Moves with the request filled in; a
 * question one read tool can answer is answered in the chat. Asking for work
 * and Playbooks moved to Moves (moves/cypress/e2e/new-mission.cy.ts).
 */
const MISSIONS = '**/api/orchestration/missions';
const ME = { uid: 'uid-owner', tenantId: 'tenant-1', paid: false };
const ASK = 'Find 20 dentists in Denver and invite them to a webinar';

function ask ( text: string ) {
  cy.get( 'textarea[aria-label="General Assistant"]' ).first().type( text );
  cy.get( '.ask-search__go' ).click();
}

describe( 'General Assistant hands work to Moves', () => {
  beforeEach( () => {
    cy.intercept( { url: '**/api/**' }, { statusCode: 200, body: { success: true } } );
  } );

  it( 'real work: a "Plan it in Moves" button with the request filled in, and nothing created here', () => {
    const url = `https://moves.16ahead.com/missions/new?q=${encodeURIComponent( ASK ).replace( /%20/g, '+' )}`;
    cy.intercept( 'POST', MISSIONS, { success: true, mode: 'handoff', app: 'moves', url } ).as( 'gate' );
    cy.intercept( 'POST', `${MISSIONS}/**`, cy.spy().as( 'missionWrite' ) );
    cy.visitWithCypressAuth( '/', ME );
    ask( ASK );
    cy.wait( '@gate' ).its( 'request.body' ).should( 'include', { request: ASK, origin: 'ask', handoff: 'moves' } );
    cy.get( '[data-cy="moves-handoff"]' ).should( 'be.visible' ).and( 'have.attr', 'href', url ).and( 'contain.text', 'Plan it in Moves' );
    cy.contains( 'a job for Moves' ).should( 'be.visible' );
    cy.get( '[data-cy="assistant-mission"]' ).should( 'not.exist' );
    cy.get( '@missionWrite' ).should( 'not.have.been.called' );
  } );

  it( 'a question one read tool can answer is answered in the chat', () => {
    cy.intercept( 'POST', MISSIONS, { success: true, mode: 'direct', tool: 'network.findContactRoute', product: 'network', summary: 'roland.martin@caldersystems.com' } ).as( 'gate' );
    cy.visitWithCypressAuth( '/', ME );
    ask( 'What is Roland Martin’s email address?' );
    cy.wait( '@gate' );
    cy.contains( 'roland.martin@caldersystems.com' ).should( 'be.visible' );
    cy.get( '[data-cy="moves-handoff"]' ).should( 'not.exist' );
  } );
} );
