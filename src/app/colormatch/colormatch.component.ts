import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-colormatch',
  imports: [],
  templateUrl: './colormatch.component.html',
  styleUrl: './colormatch.component.scss'
})
export class ColormatchComponent {
  leftColor = signal<string>('#bebebe');
  rightColor = signal<string>('#f2f2f2');

  hexToHsl(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hslH = 0, hslS = 0, hslL = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      hslS = hslL > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: hslH = (g - b) / d + (g < b ? 6 : 0); break;
        case g: hslH = (b - r) / d + 2; break;
        case b: hslH = (r - g) / d + 4; break;
      }
      hslH /= 6;
    }

    return [hslH * 360, hslS * 100, hslL * 100];
  }

  desaturateColor(hex: string): string {
    const [h, , l] = this.hexToHsl(hex);
    return `hsl(${h}, 0%, ${l}%)`;
  }

  onLeftColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (this.isHexValid(value)) {
      const normalized = this.normalizeHex(value);
      this.leftColor.set(normalized);
    }
  }

  onRightColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (this.isHexValid(value)) {
      const normalized = this.normalizeHex(value);
      this.rightColor.set(normalized);
    }
  }
  private normalizeHex(hex: string): string {
    if (hex.length === 4) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.toLowerCase();
  }
  isHexValid(hex: string): boolean {
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex);
  }
}
