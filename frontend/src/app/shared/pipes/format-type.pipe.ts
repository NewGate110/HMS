import { Pipe, PipeTransform } from '@angular/core';

/** Converts PascalCase room types to spaced words: "DeluxeSuite" → "Deluxe Suite". */
@Pipe({ name: 'formatType', standalone: true })
export class FormatTypePipe implements PipeTransform {
  transform(type: string | null | undefined): string {
    if (!type) return '';
    return type.replace(/([A-Z])/g, ' $1').trim();
  }
}
