import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incident',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident.html',
})
export class Incident {}
