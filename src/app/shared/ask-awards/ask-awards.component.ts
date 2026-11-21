import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { AskAward, AskAwardIcon, AskAwardView, AskAwardsProgress, AskAwardsService } from '../../services/ask-awards.service';

const ICON_CLASSES: Record<AskAwardIcon, string> = {
  'first-ask': 'fa-solid fa-comment',
  curious: 'fa-solid fa-circle-question',
  'better-questions': 'fa-solid fa-lightbulb',
  'follow-up': 'fa-solid fa-arrow-turn-up',
  clarifier: 'fa-solid fa-crosshairs',
  'pattern-finder': 'fa-solid fa-share-nodes',
  'deep-diver': 'fa-solid fa-water',
  'thought-partner': 'fa-solid fa-people-arrows',
  'momentum-seeker': 'fa-solid fa-bolt',
  'ask-legend': 'fa-solid fa-crown'
};

/** One card, with everything the template shows worked out ahead of time. */
interface AwardCard {
  id: string;
  mystery: boolean;
  cardClass: string;
  iconClass: string;
  title: string;
  copy: string;
}

/**
 * The Awards sheet. Everything the template shows is worked out once (on open,
 * and when a new award arrives), never in the template: the old version bound
 * getters that rebuilt all ten awards on every change-detection pass, and
 * *ngFor tore down and redrew every card each time - on an iPhone, every tap
 * and scroll redrew the sheet and it froze.
 */
@Component( {
  selector: 'app-ask-awards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ask-awards.component.html',
  styleUrl: './ask-awards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AskAwardsComponent implements OnInit, OnChanges {
  @Input() pendingAward: AskAward | null = null;
  @Input() overlayOnly = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly dismissUnlock = new EventEmitter<void>();

  cards: AwardCard[] = [];
  progress: AskAwardsProgress = { count: 0, unlockedCount: 0, totalCount: 0, percent: 0, nextAward: null };
  pendingIconClass = '';

  constructor ( private readonly awardsService: AskAwardsService ) { }

  ngOnInit (): void {
    this.refresh();
  }

  ngOnChanges (): void {
    // A new unlock means the counts moved too.
    this.refresh();
  }

  trackCard ( _index: number, card: AwardCard ): string {
    return card.id;
  }

  dismiss (): void {
    this.dismissUnlock.emit();
  }

  private refresh (): void {
    this.pendingIconClass = this.pendingAward ? ICON_CLASSES[this.pendingAward.icon] : '';
    if ( this.overlayOnly ) return;
    this.progress = this.awardsService.progress;
    this.cards = this.awardsService.awards.map( ( award: AskAwardView ) => {
      const mystery = award.state === 'mystery';
      return {
        id: award.id,
        mystery,
        cardClass: `ask-award-card ask-award-card--${ award.state }`,
        iconClass: ICON_CLASSES[award.icon],
        title: mystery ? '— — —' : award.title,
        copy: mystery ? 'Keep asking to reveal this one.' : award.copy,
      };
    } );
  }
}
