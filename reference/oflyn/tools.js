let s = null;
function d(e) {
  s = e
}
function f() {
  return s
}
async function c(e, n=null) {
  try {
    let t;
    if (n ? t = await fetch(`${window.location.pathname}?sections=${e.title}&${n.searchParams.toString()}`) : t = await fetch(`${window.location.pathname}?sections=${e.title}`),
      t.ok) {
      const i = await t.json();
      e.selector.forEach(o => {
          const l = [...document.querySelectorAll(`${o}`)];
          let r;
          l.forEach(a => {
              a.dataset.id ? r = new DOMParser().parseFromString(i[e.title], "text/html").querySelector(`${o}[data-id="${a.dataset.id}"]`) : r = new DOMParser().parseFromString(i[e.title], "text/html").querySelector(o),
              a && r && (a.innerHTML = r.innerHTML)
            }
          )
        }
      )
    } else
      console.error("Error:", t),
        window.location.reload()
  } catch (t) {
    console.error("Error:", t),
      window.location.reload()
  }
}
async function u(e, n=null) {
  for (const t of e)
    await c(t, n)
}
function h(e) {
  let n = e
    , t = null;
  for (; n.parentElement; )
    n = n.parentElement,
    n.hasAttribute("data-next") && (t = n);
  return t
}
export {f as a, h as g, u as r, d as s};
