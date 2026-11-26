import { looksLikeMultiStep } from './todd.component';

describe( 'looksLikeMultiStep', () => {
  const multi = [
    'We\'re launching our new feature next Tuesday. Write the announcement email to customers, three social posts, a blog post, and a survey a week later asking how it\'s going.',
    'The client deliverable is due Friday and we\'re behind. Figure out what\'s blocking, rework the schedule, draft a status email to the client that doesn\'t overpromise, and set check-ins with the team.',
    'A federal RFP for IT services just opened. Check if we qualify, list the requirements, find past contacts at that agency, draft the proposal outline, and put the deadlines on my calendar.',
    'New winter stock arrives Thursday. Add it to my store, take care of the product photos and descriptions, tell my regulars by email, post it on Instagram and Facebook, and ask buyers how they like it after two weeks.',
  ];
  const single = [
    'Draft an email to Jane Smith about our pricing',
    'Find contacts at Boeing',
    'list my contacts',
    'Write a follow-up email to the investor I met at the conference last week, thanking him and his partner',
  ];

  multi.forEach( ( prompt ) => it( `sends "${prompt.slice( 0, 30 )}…" to the Missions gate first`, () => {
    expect( looksLikeMultiStep( prompt ) ).toBeTrue();
  } ) );

  single.forEach( ( prompt ) => it( `keeps the shortcuts for "${prompt.slice( 0, 30 )}…"`, () => {
    expect( looksLikeMultiStep( prompt ) ).toBeFalse();
  } ) );
} );
