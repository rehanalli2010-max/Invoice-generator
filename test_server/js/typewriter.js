/**
 * Typewriter — vanilla JS port of the React component
 * Displays a typewriter text animation overlay.
 */
export class Typewriter {
    constructor(options = {}) {
        this.sequences = options.sequences || [
            { text: "Typewriter", deleteAfter: true },
            { text: "Multiple Words", deleteAfter: true },
            { text: "Auto Loop", deleteAfter: false },
        ];
        this.typingSpeed = options.typingSpeed ?? 50;
        this.deleteSpeed = options.deleteSpeed ?? 30;
        this.pauseBeforeDelete = options.pauseBeforeDelete ?? 1000;
        this.loopDelay = options.loopDelay ?? 1000;
        this.naturalVariance = options.naturalVariance ?? true;
        this.autoLoop = options.autoLoop ?? false;

        this._seqIdx = 0;
        this._charIdx = 0;
        this._deleting = false;
        this._timer = null;
        this._destroyed = false;
        this._overlay = null;
        this._textEl = null;
    }

    show() {
        if (this._overlay) return;

        this._overlay = document.createElement("div");
        this._overlay.className = "typewriter-overlay";
        this._overlay.innerHTML = `
            <div class="typewriter-box">
                <span class="typewriter-text"></span>
                <span class="typewriter-cursor"></span>
            </div>
        `;
        document.body.appendChild(this._overlay);
        this._textEl = this._overlay.querySelector(".typewriter-text");

        requestAnimationFrame(() => {
            this._overlay.classList.add("show");
        });

        this._destroyed = false;
        this._seqIdx = 0;
        this._charIdx = 0;
        this._deleting = false;
        this._tick();
    }

    hide() {
        return new Promise((resolve) => {
            if (!this._overlay) { resolve(); return; }
            this._destroyed = true;
            clearTimeout(this._timer);
            this._overlay.classList.remove("show");
            setTimeout(() => {
                this._overlay?.remove();
                this._overlay = null;
                this._textEl = null;
                resolve();
            }, 400);
        });
    }

    _tick() {
        if (this._destroyed) return;

        const seq = this.sequences[this._seqIdx];
        if (!seq) return;

        if (!this._textEl) return;

        if (this._deleting) {
            if (this._charIdx > 0) {
                this._charIdx--;
                this._textEl.textContent = seq.text.slice(0, this._charIdx);
                this._timer = setTimeout(() => this._tick(), this.deleteSpeed);
            } else {
                this._deleting = false;
                const isLast = this._seqIdx === this.sequences.length - 1;
                if (isLast && this.autoLoop) {
                    this._timer = setTimeout(() => {
                        this._seqIdx = 0;
                        this._tick();
                    }, this.loopDelay);
                } else if (!isLast) {
                    this._timer = setTimeout(() => {
                        this._seqIdx++;
                        this._tick();
                    }, 100);
                }
            }
        } else if (this._charIdx < seq.text.length) {
            this._charIdx++;
            this._textEl.textContent = seq.text.slice(0, this._charIdx);
            this._timer = setTimeout(() => this._tick(), this._getTypingDelay());
        } else {
            const pause = seq.pauseAfter ?? this.pauseBeforeDelete;
            if (seq.deleteAfter) {
                this._timer = setTimeout(() => {
                    this._deleting = true;
                    this._tick();
                }, pause);
            } else {
                const isLast = this._seqIdx === this.sequences.length - 1;
                if (isLast && this.autoLoop) {
                    this._timer = setTimeout(() => {
                        this._seqIdx = 0;
                        this._charIdx = 0;
                        this._textEl.textContent = "";
                        this._tick();
                    }, this.loopDelay);
                } else if (!isLast) {
                    this._timer = setTimeout(() => {
                        this._seqIdx++;
                        this._charIdx = 0;
                        this._textEl.textContent = "";
                        this._tick();
                    }, pause);
                }
            }
        }
    }

    _getTypingDelay() {
        if (!this.naturalVariance) return this.typingSpeed;
        const r = Math.random();
        if (r < 0.1) return this.typingSpeed * 2;
        if (r > 0.9) return this.typingSpeed * 0.5;
        const min = this.typingSpeed * 0.6;
        const max = this.typingSpeed * 1.4;
        return Math.random() * (max - min) + min;
    }

    destroy() {
        this._destroyed = true;
        clearTimeout(this._timer);
        this._overlay?.remove();
        this._overlay = null;
        this._textEl = null;
    }
}

/**
 * Convenience: show a one-shot typewriter overlay, then auto-hide.
 */
export function showTypewriter(text, options = {}) {
    const tw = new Typewriter({
        sequences: [{ text, deleteAfter: false }],
        typingSpeed: options.typingSpeed ?? 45,
        naturalVariance: true,
        ...options,
    });
    tw.show();
    const duration = (options.typingSpeed ?? 45) * text.length * 1.3 + 800;
    setTimeout(() => tw.hide(), duration);
    return tw;
}
