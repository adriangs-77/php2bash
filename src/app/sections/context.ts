import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-context',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './context.html',
})
export class Context {}
