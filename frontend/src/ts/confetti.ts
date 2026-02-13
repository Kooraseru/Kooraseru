/* globals Map */

/**
 * Canvas Confetti Library - TypeScript Version
 * A library to trigger confetti animations
 */

interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    x?: number;
    y?: number;
    origin?: { x?: number; y?: number };
    shapes?: string[];
    zIndex?: number;
    colors?: string[];
    disableForReducedMotion?: boolean;
    scalar?: number;
    resize?: boolean;
    useWorker?: boolean;
    flat?: boolean;
}

interface StyleCanvas extends HTMLCanvasElement {
    __confetti_initialized?: boolean;
}

interface RGBColor {
    r: number;
    g: number;
    b: number;
}

interface PhysicsObject {
    x: number;
    y: number;
    wobble: number;
    wobbleSpeed: number;
    velocity: number;
    angle2D: number;
    tiltAngle: number;
    color: RGBColor;
    shape: any;
    tick: number;
    totalTicks: number;
    decay: number;
    drift: number;
    random: number;
    tiltSin: number;
    tiltCos: number;
    wobbleX: number;
    wobbleY: number;
    gravity: number;
    ovalScalar: number;
    scalar: number;
    flat: boolean;
}

interface Size {
    width: number | null;
    height: number | null;
}

interface AnimationObject {
    addFettis: (fettis: PhysicsObject[]) => Promise<void>;
    canvas: StyleCanvas;
    promise: Promise<void>;
    reset: () => void;
}

const defaults: ConfettiOptions = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: [
        '#26ccff',
        '#a25afd',
        '#ff5e7e',
        '#88ff5a',
        '#fcff42',
        '#ffa62d',
        '#ff36ff'
    ],
    disableForReducedMotion: false,
    scalar: 1
};

function convert(val: any, transform?: (v: any) => any): any {
    return transform ? transform(val) : val;
}

function isOk(val: any): boolean {
    return !(val === null || val === undefined);
}

function prop(options: any, name: string, transform?: any): any {
    return convert(
        options && isOk(options[name]) ? options[name] : (defaults as any)[name],
        transform
    );
}

function onlyPositiveInt(number: number): number {
    return number < 0 ? 0 : Math.floor(number);
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

function toDecimal(str: string): number {
    return parseInt(str, 16);
}

function colorsToRgb(colors: string[]): RGBColor[] {
    return colors.map(hexToRgb);
}

function hexToRgb(str: string): RGBColor {
    let val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }

    return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6))
    };
}

function getOrigin(options: any): { x: number; y: number } {
    const origin = prop(options, 'origin', Object);
    return {
        x: prop(origin, 'x', Number),
        y: prop(origin, 'y', Number)
    };
}

function setCanvasWindowSize(canvas: HTMLCanvasElement): void {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
}

function setCanvasRectSize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function getCanvas(zIndex: number): StyleCanvas {
    const canvas = document.createElement('canvas') as StyleCanvas;

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = String(zIndex);

    return canvas;
}

function randomPhysics(opts: any): PhysicsObject {
    const radAngle = opts.angle * (Math.PI / 180);
    const radSpread = opts.spread * (Math.PI / 180);

    return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: (opts.startVelocity * 0.5) + (Math.random() * opts.startVelocity),
        angle2D: -radAngle + ((0.5 * radSpread) - (Math.random() * radSpread)),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
        flat: opts.flat
    };
}

function updateFetti(context: CanvasRenderingContext2D, fetti: PhysicsObject): boolean {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.velocity *= fetti.decay;

    if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + (10 * fetti.scalar);
        fetti.wobbleY = fetti.y + (10 * fetti.scalar);

        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
    } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + ((10 * fetti.scalar) * Math.cos(fetti.wobble));
        fetti.wobbleY = fetti.y + ((10 * fetti.scalar) * Math.sin(fetti.wobble));

        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
    }

    const progress = (fetti.tick++) / fetti.totalTicks;

    const x1 = fetti.x + (fetti.random * fetti.tiltCos);
    const y1 = fetti.y + (fetti.random * fetti.tiltSin);
    const x2 = fetti.wobbleX + (fetti.random * fetti.tiltCos);
    const y2 = fetti.wobbleY + (fetti.random * fetti.tiltSin);

    context.fillStyle = `rgba(${fetti.color.r}, ${fetti.color.g}, ${fetti.color.b}, ${1 - progress})`;

    context.beginPath();

    // Draw confetti shape
    if (fetti.shape === 'circle') {
        if (context.ellipse) {
            context.ellipse(
                fetti.x, fetti.y,
                Math.abs(x2 - x1) * fetti.ovalScalar,
                Math.abs(y2 - y1) * fetti.ovalScalar,
                Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI
            );
        }
    } else if (fetti.shape === 'star') {
        let rot = Math.PI / 2 * 3;
        const innerRadius = 4 * fetti.scalar;
        const outerRadius = 8 * fetti.scalar;
        let x = fetti.x;
        let y = fetti.y;
        let spikes = 5;
        const step = Math.PI / spikes;

        while (spikes--) {
            x = fetti.x + Math.cos(rot) * outerRadius;
            y = fetti.y + Math.sin(rot) * outerRadius;
            context.lineTo(x, y);
            rot += step;

            x = fetti.x + Math.cos(rot) * innerRadius;
            y = fetti.y + Math.sin(rot) * innerRadius;
            context.lineTo(x, y);
            rot += step;
        }
    } else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
}

function animate(canvas: StyleCanvas, fettis: PhysicsObject[], resizer: (c: any) => void, size: Size, done: () => void): AnimationObject {
    let animatingFettis = fettis.slice();
    const context = canvas.getContext('2d')!;
    let animationFrame: number | null;
    let destroy: (() => void) | null;

    const prom = new Promise<void>((resolve) => {
        function onDone(): void {
            animationFrame = null;
            destroy = null;

            context.clearRect(0, 0, size.width || 0, size.height || 0);

            done();
            resolve();
        }

        function update(): void {
            if (!size.width && !size.height) {
                resizer(canvas);
                size.width = canvas.width;
                size.height = canvas.height;
            }

            context.clearRect(0, 0, size.width || 0, size.height || 0);

            animatingFettis = animatingFettis.filter((fetti) => {
                return updateFetti(context, fetti);
            });

            if (animatingFettis.length) {
                animationFrame = requestAnimationFrame(update);
            } else {
                onDone();
            }
        }

        animationFrame = requestAnimationFrame(update);
        destroy = onDone;
    });

    return {
        addFettis: function (newFettis: PhysicsObject[]): Promise<void> {
            animatingFettis = animatingFettis.concat(newFettis);
            return prom;
        },
        canvas: canvas,
        promise: prom,
        reset: function (): void {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            if (destroy) {
                destroy();
            }
        }
    };
}

function confettiCannon(canvas: StyleCanvas | null, globalOpts: ConfettiOptions | undefined): any {
    const isLibCanvas = !canvas;
    const allowResize = !!prop(globalOpts || {}, 'resize');
    let hasResizeEventRegistered = false;
    const globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    const preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    let animationObj: AnimationObject | null = null;

    function fireLocal(options: ConfettiOptions, size: Size, done: () => void): Promise<void> {
        const particleCount = prop(options, 'particleCount', onlyPositiveInt);
        const angle = prop(options, 'angle', Number);
        const spread = prop(options, 'spread', Number);
        const startVelocity = prop(options, 'startVelocity', Number);
        const decay = prop(options, 'decay', Number);
        const gravity = prop(options, 'gravity', Number);
        const drift = prop(options, 'drift', Number);
        const colors = prop(options, 'colors', colorsToRgb);
        const ticks = prop(options, 'ticks', Number);
        const shapes = prop(options, 'shapes');
        const scalar = prop(options, 'scalar');
        const flat = !!prop(options, 'flat');
        const origin = getOrigin(options);

        let temp = particleCount;
        const fettis: PhysicsObject[] = [];

        const startX = (canvas as StyleCanvas).width * origin.x;
        const startY = (canvas as StyleCanvas).height * origin.y;

        while (temp--) {
            fettis.push(
                randomPhysics({
                    x: startX,
                    y: startY,
                    angle: angle,
                    spread: spread,
                    startVelocity: startVelocity,
                    color: colors[temp % colors.length],
                    shape: shapes[randomInt(0, shapes.length)],
                    ticks: ticks,
                    decay: decay,
                    gravity: gravity,
                    drift: drift,
                    scalar: scalar,
                    flat: flat
                })
            );
        }

        if (animationObj) {
            return animationObj.addFettis(fettis);
        }

        animationObj = animate(canvas as StyleCanvas, fettis, () => setCanvasWindowSize(canvas as StyleCanvas), size, done);

        return animationObj.promise;
    }

    function fire(options: ConfettiOptions): Promise<void> {
        const disableForReducedMotion = globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
        const zIndex = prop(options, 'zIndex', Number);

        if (disableForReducedMotion && preferLessMotion) {
            return Promise.resolve();
        }

        if (isLibCanvas && animationObj) {
            canvas = animationObj.canvas;
        } else if (isLibCanvas && !canvas) {
            canvas = getCanvas(zIndex);
            document.body.appendChild(canvas);
        }

        if (allowResize && !((canvas as StyleCanvas).__confetti_initialized)) {
            setCanvasWindowSize(canvas as StyleCanvas);
        }

        const size: Size = {
            width: (canvas as StyleCanvas).width,
            height: (canvas as StyleCanvas).height
        };

        (canvas as StyleCanvas).__confetti_initialized = true;

        function onResize(): void {
            size.width = null;
            size.height = null;
        }

        function done(): void {
            animationObj = null;

            if (allowResize) {
                hasResizeEventRegistered = false;
                window.removeEventListener('resize', onResize);
            }

            if (isLibCanvas && canvas) {
                if (document.body.contains(canvas)) {
                    document.body.removeChild(canvas);
                }
                canvas = null;
            }
        }

        if (allowResize && !hasResizeEventRegistered) {
            hasResizeEventRegistered = true;
            window.addEventListener('resize', onResize, false);
        }

        return fireLocal(options, size, done);
    }

    fire.reset = function (): void {
        if (animationObj) {
            animationObj.reset();
        }
    };

    return fire;
}

let defaultFire: any;

function getDefaultFire(): any {
    if (!defaultFire) {
        defaultFire = confettiCannon(null, { useWorker: false, resize: true });
    }
    return defaultFire;
}

// Main export
const confetti = function(this: any): Promise<void> {
    return getDefaultFire().apply(this, arguments);
};

confetti.reset = function (): void {
    getDefaultFire().reset();
};

confetti.create = confettiCannon;

// Expose to global scope
(window as any).confetti = confetti;
