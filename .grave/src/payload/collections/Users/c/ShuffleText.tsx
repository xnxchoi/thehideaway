import { useCallback, useMemo, useRef, useState } from "react";

type RP_TextShuffle = {};
type RP_TextShuffleProps = {
  characters?: string;
  duration?: number;
  speed?: number;
  delay?: number;
  order?: string;
};
type ShuffledChar = {
  isSpace: boolean;
  index: number;
  origin: string;
  random: string;
  delay: number;
  interval: null | ReturnType<typeof setInterval>;
  timer: null | ReturnType<typeof setTimeout>;
};

export function useTextShuffle(props: RP_TextShuffleProps) {
  const {
    characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz~!@#$%^&*()-+=[]{}|;:,./<>?",
    duration = 500,
    speed = 50,
    delay = 50,
    order = "random"
  } = props;
  const wait = useRef<number>(duration),
    interval = useRef<ReturnType<typeof setInterval>>(null!),
    timer = useRef<ReturnType<typeof setTimeout>>(null!);
  const originalTextRef = useRef<string>(null!),
    randomText = useRef<string>(null!);
  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);
  const [text, setText] = useState<string>(null!);
  const shuffleText: Array<ShuffledChar> = useMemo(() => {
    const originalText = text;
    if (originalText === undefined || originalText.length < 1) return [];
    return originalText.split("").flatMap((t, e) => {
      if (!t) return [];
      const isSpace = t === " " || t === "　";
      return {
        isSpace,
        index: e,
        origin: t,
        random: isSpace ? t : getRandomChar(),
        timer: null,
        interval: null,
        delay: 0
      };
    });
  }, [getRandomChar, text]);
  const onOrder = useCallback(() => {
    switch (order) {
      case "random":
        shuffleText.forEach((t, e) => {
          const n = Math.random();
          let r = delay * n * (speed / 10);
          (n < 0.5 && (r = r * Math.random() * 0.1),
            (r += (e + 1) * delay * 0.1),
            (t.delay = r),
            (wait.current += r));
        });
        break;
      default:
        shuffleText.forEach((t, e) => {
          const n = (e + 1) * delay;
          ((t.delay = n), (wait.current += n));
        });
        break;
    }
  }, [delay, order, shuffleText, speed]);

  const onShuffle = useCallback(
    (e = speed) => {
      ((wait.current = duration), onOrder());
      shuffleText.forEach((t, n) => {
        t.interval && clearInterval(t.interval);
        t.interval = setInterval(() => {
          t.isSpace || (t.random = getRandomChar());
        }, e);
        t.timer && clearTimeout(t.timer);
        t.timer = setTimeout(() => {
          (t.interval && clearInterval(t.interval), (t.random = t.origin));
        }, t.delay + duration);
      });
      interval.current && clearInterval(interval.current);
      interval.current = setInterval(() => {
        randomText.current = "";

        randomText.current = shuffleText.reduce((acc, t) => {
          return acc + t.random;
        }, "");
        setText(randomText.current);
      }, e);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        interval.current && clearInterval(interval.current);
      }, wait.current);
    },
    [speed, duration, onOrder, shuffleText, getRandomChar]
  );

  const onDestroy = useCallback(() => {
    shuffleText.forEach((e, t) => {
      e.interval && clearInterval(e.interval);
      e.timer && clearTimeout(e.timer);
    });
    interval.current && clearInterval(interval.current);
    timer.current && clearTimeout(timer.current);
  }, [shuffleText]);

  const stop = useCallback(() => {
    shuffleText.forEach((e, t) => {
      e.interval && clearInterval(e.interval);
      e.timer && clearTimeout(e.timer);
    });
    (clearInterval(interval.current), clearTimeout(timer.current));
  }, [shuffleText]);
}

class UsagiSHuffleText {
  el: HTMLElement;
  characters: string =
    "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz~!@#$%^&*()-+=[]{}|;:,./<>?";
  duration: number;
  speed: number = 50;
  delay: number = 50;
  order: "random" | string = "random";
  interval: null | ReturnType<typeof setInterval> = null;
  timer: null | ReturnType<typeof setTimeout> = null;
  wait: number;
  originalText: string;
  randomText: string;
  array: Array<ShuffledChar>;
  constructor(e = {}) {
    ((this.el = e.el),
      this.el &&
        ((this.characters =
          e.characters ||
          "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz~!@#$%^&*()-+=[]{}|;:,./<>?"),
        (this.duration = e.duration || 500),
        (this.speed = e.speed || 50),
        (this.delay = e.delay || 50),
        (this.order = e.order || "random"),
        (this.interval = null),
        (this.timer = null),
        this.onRunRabbit()));
  }

  getRandomChar() {
    const e = Math.floor(Math.random() * this.characters.length);
    return this.characters[e];
  }

  onRunRabbit() {
    ((this.originalText = this.el.textContent),
      (this.randomText = this.el.textContent),
      (this.array = []));
    for (let e = 0; e < this.originalText.split("").length; e++) {
      const t = this.originalText.split("")[e];
      let n = !1;
      ((t === " " || t === "　") && (n = !0),
        this.array.push({
          isSpace: n,
          index: e,
          origin: t,
          random: n ? t : this.getRandomChar(),
          timer: null,
          interval: null,
          delay: 0
        }));
    }
    this.onOrder();
  }

  onOrder() {
    switch (this.order) {
      case "random":
        for (let e = 0; e < this.array.length; e++) {
          const t = this.array[e];
          const n = Math.random();
          let r = this.delay * n * (this.speed / 10);
          (n < 0.5 && (r = r * Math.random() * 0.1),
            (r += (e + 1) * this.delay * 0.1),
            (t.delay = r),
            (this.wait += r));
        }
        break;
      default:
        for (let e = 0; e < this.array.length; e++) {
          const t = this.array[e],
            n = (e + 1) * this.delay;
          ((t.delay = n), (this.wait += n));
        }
        break;
    }
  }

  onShuffle(e = this.speed) {
    ((this.wait = this.duration),
      this.onOrder(),
      this.array.forEach((t, n) => {
        (clearInterval(t.interval),
          (t.interval = setInterval(() => {
            t.isSpace || (t.random = this.getRandomChar());
          }, e)),
          clearTimeout(t.timer),
          (t.timer = setTimeout(() => {
            (clearInterval(t.interval), (t.random = t.origin));
          }, t.delay + this.duration)));
      }),
      clearInterval(this.interval),
      (this.interval = setInterval(() => {
        this.randomText = "";
        for (let t = 0; t < this.array.length; t++) {
          const n = this.array[t];
          this.randomText += n.random;
        }
        this.el.textContent = this.randomText;
      }, e)),
      clearTimeout(this.timer),
      (this.timer = setTimeout(() => {
        clearInterval(this.interval);
      }, this.wait)));
  }

  onDestroy() {
    (this.array.forEach((e, t) => {
      (e.interval && clearInterval(e.interval),
        e.timer && clearTimeout(e.timer));
      ((e.interval = null), (e.timer = null));
    }),
      this.interval && clearInterval(this.interval),
      this.timer && clearTimeout(this.timer),
      (this.interval = null),
      (this.timer = null),
      (this.array = []));
  }

  stop() {
    (this.array.forEach((e, t) => {
      (e.interval && clearInterval(e.interval),
        e.timer && clearTimeout(e.timer));
      ((e.interval = null), (e.timer = null));
    }),
      this.interval && clearInterval(this.interval),
      this.timer && clearTimeout(this.timer),
      (this.interval = null),
      (this.timer = null));
  }
}

const styleTextShuffle = {
  local: null,
  array: [],
  onInit(i) {
    if ((this.local = i || document)) return !1;
    this.onInitHover();
    const e = this.local.querySelectorAll(".js-shuffle"),
      t = this.local.querySelectorAll(".js-shuffle-child > *"),
      n = [...e, ...t];
    for (let r = 0; r < n.length; r++) {
      const a = n[r];
      if (
        a.classList.contains("js-disable-for-portrait") &&
        ORIENTATION === "portrait"
      )
        return !1;
      const o = a.dataset.delay ? Number(a.dataset.delay) : 10,
        l = a.dataset.inview !== "false",
        c = a.dataset.duration ? Number(a.dataset.duration) : 400,
        h = a.dataset.order ? a.dataset.order : "random",
        u = a.dataset.wait ? Number(a.dataset.wait) * 400 : 0,
        d = new UsagiSHuffleText({
          el: a,
          duration: c,
          delay: o,
          order: h,
          characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        });
      this.array.push({
        el: a,
        body: d,
        wait: u,
        delay: o,
        inview: l,
        duration: c,
        timer: null,
        observer: null,
        listerner: null
      });
    }
    (this.array.forEach((r, a) => {
      r.inview
        ? ((r.listerner = (o) => {
            o.forEach((l, c) => {
              const h = l.target;
              l.isIntersecting
                ? ((h.dataset.visible = 1),
                  clearTimeout(r.timer),
                  (r.timer = setTimeout(() => {
                    (r.el.classList.add("is-start-shuffle"),
                      r.el.classList.contains("is-skip") || r.body.onShuffle());
                  }, r.wait)))
                : (h.dataset.visible = 0);
            });
          }),
          (r.observer = new IntersectionObserver(r.listerner, {
            threshold: 0
          })),
          r.observer.observe(r.el))
        : (clearTimeout(r.timer),
          (r.timer = setTimeout(() => {
            (r.el.classList.add("is-start-shuffle"), r.body.onShuffle());
          }, r.wait)));
    }),
      setTimeout(() => {
        this.array.forEach((r, a) => {
          r.el.classList.remove("is-skip");
        });
      }, 1e3));
  },
  onDestroy() {
    (this.array.forEach((i, e) => {
      (i.body && i.body.onDestroy(),
        (i.body = null),
        i.timer && clearTimeout(i.timer),
        (i.timer = null),
        i.observer &&
          (i.observer.disconnect(i.el),
          (i.observer = null),
          (i.listerner = null)));
    }),
      (this.array = []),
      this.onDestroyHover());
  },
  hover_once: [],
  once() {
    if (DETECT.reduced) return !1;
    const i = this.local.querySelectorAll(".js-hover-shuffle-once");
    for (let e = 0; e < i.length; e++) {
      const t = i[e],
        n = t.dataset.wait ? Number(t.dataset.wait) : 0,
        r = t.dataset.delay ? Number(t.dataset.delay) : 50,
        a = t.dataset.duration ? Number(t.dataset.duration) : 400,
        o = [],
        l = t.querySelectorAll(".t");
      for (let c = 0; c < l.length; c++) {
        const h = l[c],
          u = new UsagiSHuffleText({
            el: h,
            duration: a,
            delay: r,
            order: "left",
            characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          });
        o.push({
          el: h,
          body: u
        });
      }
      this.hover_once.push({
        timer: null,
        el: t,
        target: o,
        wait: n,
        delay: r,
        duration: a,
        mouseenter: {
          func: null
        },
        mouseleave: {
          func: null
        }
      });
    }
    this.hover_once.forEach((e, t) => {
      ((e.mouseenter.func = () => {
        (clearTimeout(e.timer),
          (e.timer = setTimeout(() => {
            e.target.forEach((n) => {
              n.body.onShuffle();
            });
          }, e.wait)));
      }),
        (e.mouseleave.func = () => {}),
        e.el.addEventListener("mouseenter", e.mouseenter.func),
        e.el.addEventListener("mouseleave", e.mouseleave.func));
    });
  },
  hover_local: [],
  onInitHover() {
    const i = this.local.querySelectorAll(".js-hover-shuffle");
    for (let e = 0; e < i.length; e++) {
      const t = i[e],
        n = t.dataset.wait ? Number(t.dataset.wait) : 0,
        r = t.dataset.delay ? Number(t.dataset.delay) : 50,
        a = t.dataset.duration ? Number(t.dataset.duration) : 400,
        o = [],
        l = t.querySelectorAll(".t");
      for (let c = 0; c < l.length; c++) {
        const h = l[c],
          u = new UsagiSHuffleText({
            el: h,
            duration: a,
            delay: r,
            order: "left",
            characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          });
        o.push({
          el: h,
          body: u
        });
      }
      this.hover_local.push({
        timer: null,
        el: t,
        target: o,
        wait: n,
        delay: r,
        duration: a,
        mouseenter: {
          func: null
        },
        mouseleave: {
          func: null
        }
      });
    }
    this.hover_local.forEach((e, t) => {
      ((e.mouseenter.func = () => {
        (clearTimeout(e.timer),
          (e.timer = setTimeout(() => {
            e.target.forEach((n) => {
              n.body.onShuffle();
            });
          }, e.wait)));
      }),
        (e.mouseleave.func = () => {}),
        e.el.addEventListener("mouseenter", e.mouseenter.func),
        e.el.addEventListener("mouseleave", e.mouseleave.func));
    });
  },
  onDestroyHover() {
    (this.hover_local.forEach((i, e) => {
      (i.target.forEach((t) => {
        (t.body && t.body.onDestroy(), (t.body = null));
      }),
        (i.target = null),
        i.el.removeEventListener("mouseenter", i.mouseenter.func),
        i.el.removeEventListener("mouseleave", i.mouseleave.func),
        (i.mouseenter.func = null),
        (i.mouseleave.func = null));
    }),
      (this.hover_local = []));
  }
};
