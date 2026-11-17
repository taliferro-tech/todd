import { toolAnswerHtml } from './todd.component';

describe( 'General Assistant tool answers (Missions gate, 2026-11-17)', () => {
  it( 'shows the summary and makes the saved Doc link real', () => {
    const html = toolAnswerHtml( '619 people in “A quick intro”: 7 with a phone number.\n\n[Open “Call list: A quick intro”](https://docs.16ahead.com/docs/editor/abc)' );
    expect( html ).toBe( '<p>619 people in “A quick intro”: 7 with a phone number.</p><p><a href="https://docs.16ahead.com/docs/editor/abc" target="_blank" rel="noopener">Open “Call list: A quick intro”</a></p>' );
  } );

  it( 'escapes anything that looks like markup, and links only https', () => {
    expect( toolAnswerHtml( '<b>hi</b> [x](javascript:alert(1))' ) ).toBe( '<p>&lt;b&gt;hi&lt;/b&gt; [x](javascript:alert(1))</p>' );
  } );
} );
