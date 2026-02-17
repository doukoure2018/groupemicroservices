import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface City {
    id: string;
    name: string;
    lon: number;
    lat: number;
    isCapital: boolean;
}

const GUINEA_COORDS: [number, number][] = [
    [-8.439298,7.686043],[-8.722124,7.711674],[-8.926065,7.309037],[-9.208786,7.313921],
    [-9.403348,7.526905],[-9.33728,7.928534],[-9.755342,8.541055],[-10.016567,8.428504],
    [-10.230094,8.406206],[-10.505477,8.348896],[-10.494315,8.715541],[-10.65477,8.977178],
    [-10.622395,9.26791],[-10.839152,9.688246],[-11.117481,10.045873],[-11.917277,10.046984],
    [-12.150338,9.858572],[-12.425929,9.835834],[-12.596719,9.620188],[-12.711958,9.342712],
    [-13.24655,8.903049],[-13.685154,9.494744],[-14.074045,9.886167],[-14.330076,10.01572],
    [-14.579699,10.214467],[-14.693232,10.656301],[-14.839554,10.876572],[-15.130311,11.040412],
    [-14.685687,11.527824],[-14.382192,11.509272],[-14.121406,11.677117],[-13.9008,11.678719],
    [-13.743161,11.811269],[-13.828272,12.142644],[-13.718744,12.247186],[-13.700476,12.586183],
    [-13.217818,12.575874],[-12.499051,12.33209],[-12.278599,12.35444],[-12.203565,12.465648],
    [-11.658301,12.386583],[-11.513943,12.442988],[-11.456169,12.076834],[-11.297574,12.077971],
    [-11.036556,12.211245],[-10.87083,12.177887],[-10.593224,11.923975],[-10.165214,11.844084],
    [-9.890993,12.060479],[-9.567912,12.194243],[-9.327616,12.334286],[-9.127474,12.30806],
    [-8.905265,12.088358],[-8.786099,11.812561],[-8.376305,11.393646],[-8.581305,11.136246],
    [-8.620321,10.810891],[-8.407311,10.909257],[-8.282357,10.792597],[-8.335377,10.494812],
    [-8.029944,10.206535],[-8.229337,10.12902],[-8.309616,9.789532],[-8.079114,9.376224],
    [-7.8321,8.575704],[-8.203499,8.455453],[-8.299049,8.316444],[-8.221792,8.123329],
    [-8.280703,7.68718],[-8.439298,7.686043],
];

const LON_MIN = -15.25;
const LON_MAX = -7.7;
const LAT_MIN = 7.2;
const LAT_MAX = 12.7;
const SVG_W = 500;
const SVG_H = 380;
const PAD = 30;

function geoToSvg(lon: number, lat: number): [number, number] {
    const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (SVG_W - 2 * PAD);
    const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SVG_H - 2 * PAD);
    return [x, y];
}

@Component({
    selector: 'app-guinea-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './guinea-map.component.html',
})
export class GuineaMapComponent {
    @Input() isVisible = false;
    @Input() activeCity: string | null = null;
    @Output() cityHover = new EventEmitter<string | null>();
    @Output() cityClick = new EventEmitter<string>();

    hoveredCity = signal<string | null>(null);
    svgWidth = SVG_W;
    svgHeight = SVG_H;

    cities: City[] = [
        { id: 'conakry', name: 'Conakry', lon: -13.7123, lat: 9.5370, isCapital: true },
        { id: 'kankan', name: 'Kankan', lon: -9.3057, lat: 10.3854, isCapital: false },
        { id: 'labe', name: 'Labe', lon: -12.2891, lat: 11.3183, isCapital: false },
        { id: 'nzerekore', name: 'Nzerekore', lon: -8.8179, lat: 7.7562, isCapital: false },
        { id: 'kindia', name: 'Kindia', lon: -12.8665, lat: 10.0604, isCapital: false },
        { id: 'mamou', name: 'Mamou', lon: -12.0861, lat: 10.3756, isCapital: false },
        { id: 'boke', name: 'Boke', lon: -14.2918, lat: 10.9397, isCapital: false },
        { id: 'faranah', name: 'Faranah', lon: -10.7400, lat: 10.0404, isCapital: false },
        { id: 'siguiri', name: 'Siguiri', lon: -11.4167, lat: 11.4167, isCapital: false },
        { id: 'kissidougou', name: 'Kissidougou', lon: -10.0992, lat: 9.1848, isCapital: false },
    ];

    routes: [string, string][] = [
        ['conakry', 'kindia'], ['kindia', 'mamou'], ['mamou', 'labe'],
        ['mamou', 'faranah'], ['faranah', 'kankan'], ['faranah', 'kissidougou'],
        ['kissidougou', 'nzerekore'], ['conakry', 'boke'], ['labe', 'siguiri'], ['kankan', 'siguiri'],
    ];

    highlighted = ['conakry', 'kankan', 'labe', 'nzerekore', 'kindia', 'mamou', 'boke', 'faranah'];

    outlinePath: string;

    constructor() {
        this.outlinePath = GUINEA_COORDS.map((c, i) => {
            const [x, y] = geoToSvg(c[0], c[1]);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ') + ' Z';
    }

    getSvgCoords(id: string): { x: number; y: number } | null {
        const city = this.cities.find(c => c.id === id);
        if (!city) return null;
        const [x, y] = geoToSvg(city.lon, city.lat);
        return { x, y };
    }

    isActive(cityId: string): boolean {
        return this.activeCity === cityId || this.hoveredCity() === cityId;
    }

    isHighlighted(cityId: string): boolean {
        return this.highlighted.includes(cityId);
    }

    isRouteActive(fromId: string, toId: string): boolean {
        return this.activeCity === fromId || this.activeCity === toId ||
               this.hoveredCity() === fromId || this.hoveredCity() === toId;
    }

    labelIsRight(cityId: string): boolean {
        return !['conakry', 'boke', 'labe', 'siguiri'].includes(cityId);
    }

    getLabelOffsetX(city: City): number {
        const right = this.labelIsRight(city.id);
        return right ? 14 : -(city.name.length * 7 + 26);
    }

    getLabelOffsetY(city: City): number {
        if (city.id === 'mamou') return -16;
        if (city.id === 'kindia') return 14;
        return -4;
    }

    getLabelWidth(city: City): number {
        return city.name.length * 7.5 + 18;
    }

    onCityMouseEnter(cityId: string): void {
        this.hoveredCity.set(cityId);
        this.cityHover.emit(cityId);
    }

    onCityMouseLeave(): void {
        this.hoveredCity.set(null);
        this.cityHover.emit(null);
    }

    onCityClicked(cityId: string): void {
        this.cityClick.emit(cityId);
    }

    getMarkerRadius(city: City): number {
        if (this.isActive(city.id)) return 6;
        if (city.isCapital) return 5.5;
        if (this.isHighlighted(city.id)) return 4.5;
        return 3;
    }

    getInnerRadius(city: City): number {
        if (this.isActive(city.id)) return 2.5;
        if (city.isCapital) return 2.2;
        return 1.5;
    }

    getMarkerDelay(i: number): string {
        return this.isVisible ? `${700 + i * 120}ms` : '0ms';
    }

    getMarkerAnimation(i: number): string {
        return this.isVisible ? `marker-drop 0.6s ease-out ${700 + i * 120}ms both` : 'none';
    }
}
