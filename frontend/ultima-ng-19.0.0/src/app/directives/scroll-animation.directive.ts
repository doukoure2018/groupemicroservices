import {
    Directive,
    ElementRef,
    Input,
    AfterViewInit,
    OnDestroy,
    NgZone,
} from '@angular/core';

@Directive({
    selector: '[appScrollAnimation]',
    standalone: true,
})
export class ScrollAnimationDirective implements AfterViewInit, OnDestroy {
    @Input('appScrollAnimation') variant: string = 'fade-up';
    @Input() animDelay: number = 0;
    @Input() animThreshold: number = 0.15;

    private observer: IntersectionObserver | null = null;

    constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

    ngAfterViewInit(): void {
        const element = this.el.nativeElement;
        element.classList.add('scroll-hidden', this.variant);

        if (this.animDelay > 0) {
            element.style.transitionDelay = `${this.animDelay}ms`;
        }

        this.zone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        element.classList.add('scroll-visible');
                        this.observer?.unobserve(element);
                    }
                },
                {
                    threshold: this.animThreshold,
                    rootMargin: '0px 0px -60px 0px',
                }
            );
            this.observer.observe(element);
        });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }
}

@Directive({
    selector: '[appCountUp]',
    standalone: true,
})
export class CountUpDirective implements AfterViewInit, OnDestroy {
    @Input('appCountUp') target: number = 0;
    @Input() countSuffix: string = '';
    @Input() countPrefix: string = '';
    @Input() countDuration: number = 2000;
    @Input() countDecimal: boolean = false;

    private observer: IntersectionObserver | null = null;
    private hasRun = false;

    constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

    ngAfterViewInit(): void {
        this.el.nativeElement.textContent = this.countPrefix + '0' + this.countSuffix;

        this.zone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !this.hasRun) {
                        this.hasRun = true;
                        this.animate();
                        this.observer?.unobserve(this.el.nativeElement);
                    }
                },
                { threshold: 0.3 }
            );
            this.observer.observe(this.el.nativeElement);
        });
    }

    private animate(): void {
        let startTime: number | null = null;
        const end = this.target;
        const duration = this.countDuration;
        const el = this.el.nativeElement;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * end);

            const display = this.countDecimal
                ? (current / 10).toFixed(1)
                : current.toString();

            el.textContent = this.countPrefix + display + this.countSuffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }
}
