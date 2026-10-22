import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.html',
})
export class Timeline {}
