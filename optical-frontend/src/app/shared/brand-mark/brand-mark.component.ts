import { Component, Input, ViewEncapsulation } from '@angular/core';

/* Module-level counter ensures every rendered instance gets a unique SVG gradient ID. */
let instanceCount = 0;

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg
      class="brand-mark-svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      [attr.aria-hidden]="ariaLabel ? null : 'true'"
      [attr.aria-label]="ariaLabel || null"
      [attr.role]="ariaLabel ? 'img' : null"
      focusable="false"
    >
      <defs>
        <linearGradient
          [attr.id]="gradId"
          x1="0" y1="0" x2="24" y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stop-color="#6366f1"/>
          <stop offset="50%"  stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#d946ef"/>
        </linearGradient>
      </defs>

      <!-- Outer ring — scales 110% on hover/focus -->
      <circle
        class="bm-outer-ring"
        cx="12" cy="12" r="9.75"
        [attr.stroke]="'url(#' + gradId + ')'"
        stroke-width="1.5"
        fill="none"
      />
      <!-- Iris fill — opacity shifts on hover/focus -->
      <circle
        class="bm-iris-fill"
        cx="12" cy="12" r="6.5"
        [attr.fill]="'url(#' + gradId + ')'"
        opacity="0.12"
      />
      <!-- Mid ring -->
      <circle
        class="bm-mid-ring"
        cx="12" cy="12" r="6.5"
        [attr.stroke]="'url(#' + gradId + ')'"
        stroke-width="1"
        fill="none"
      />
      <!-- Pupil — scales 70% on hover/focus -->
      <circle
        class="bm-pupil"
        cx="12" cy="12" r="3"
        [attr.fill]="'url(#' + gradId + ')'"
      />
      <!-- Specular highlight -->
      <circle cx="10.8" cy="10.8" r="0.85" fill="white" opacity="0.7"/>
    </svg>
  `,
  styles: [`
    /* ── Brand mark — all selectors use app-brand-mark host to avoid global collision ── */

    app-brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .brand-mark-svg {
      overflow: visible;
      display: block;
    }

    /* Shared transition for iris elements */
    .bm-outer-ring,
    .bm-iris-fill,
    .bm-mid-ring,
    .bm-pupil {
      transform-origin: 12px 12px;
      transition:
        transform 250ms var(--ease-out-soft, ease-out),
        opacity   250ms ease-out;
    }

    /* ── Iris animation: direct hover/focus on the host element ── */
    app-brand-mark:hover .bm-outer-ring,
    app-brand-mark:focus-visible .bm-outer-ring {
      transform: scale(1.1);
    }
    app-brand-mark:hover .bm-mid-ring,
    app-brand-mark:focus-visible .bm-mid-ring {
      transform: scale(1.07);
    }
    app-brand-mark:hover .bm-iris-fill,
    app-brand-mark:focus-visible .bm-iris-fill {
      opacity: 0.28;
    }
    app-brand-mark:hover .bm-pupil,
    app-brand-mark:focus-visible .bm-pupil {
      transform: scale(0.72);
    }

    /* ── Iris animation: parent <a> or <button> hover/focus ── */
    /* Handles the nav brand link — when <a> is :focus-visible, the mark animates */
    a:focus-visible app-brand-mark .bm-outer-ring,
    a:hover         app-brand-mark .bm-outer-ring,
    button:focus-visible app-brand-mark .bm-outer-ring {
      transform: scale(1.1);
    }
    a:focus-visible app-brand-mark .bm-mid-ring,
    a:hover         app-brand-mark .bm-mid-ring,
    button:focus-visible app-brand-mark .bm-mid-ring {
      transform: scale(1.07);
    }
    a:focus-visible app-brand-mark .bm-iris-fill,
    a:hover         app-brand-mark .bm-iris-fill,
    button:focus-visible app-brand-mark .bm-iris-fill {
      opacity: 0.28;
    }
    a:focus-visible app-brand-mark .bm-pupil,
    a:hover         app-brand-mark .bm-pupil,
    button:focus-visible app-brand-mark .bm-pupil {
      transform: scale(0.72);
    }

    /* Reduced-motion: disable iris animation entirely */
    @media (prefers-reduced-motion: reduce) {
      .bm-outer-ring,
      .bm-iris-fill,
      .bm-mid-ring,
      .bm-pupil {
        transition: none;
      }
    }
  `],
})
export class BrandMarkComponent {
  @Input() size: number = 24;
  @Input() ariaLabel = '';

  readonly gradId: string;

  constructor() {
    this.gradId = `bm-grad-${++instanceCount}`;
  }
}
