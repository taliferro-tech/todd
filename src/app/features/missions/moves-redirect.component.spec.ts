import { movesUrlFor } from './moves-redirect.component';
import { movesNewMissionUrl } from '../help/todd/moves-handoff.service';

describe( 'General Assistant -> Moves', () => {
  it( '/missions keeps the request and playbook', () => {
    expect( movesUrlFor( 'missions', { q: 'Email Roland & Co', playbook: 'reach-named-person' } ) ).toBe( 'https://moves.16ahead.com/missions/new?q=Email+Roland+%26+Co&playbook=reach-named-person' );
    expect( movesUrlFor( 'missions', {} ) ).toBe( 'https://moves.16ahead.com/missions/new' );
  } );

  it( '/playbooks goes to Moves Playbooks', () => {
    expect( movesUrlFor( 'playbooks', { q: 'x' } ) ).toBe( 'https://moves.16ahead.com/playbooks' );
  } );

  it( 'a handoff with no link from the server still fills the request in', () => {
    expect( movesNewMissionUrl( 'Find 20 dentists' ) ).toBe( 'https://moves.16ahead.com/missions/new?q=Find+20+dentists' );
  } );
} );
